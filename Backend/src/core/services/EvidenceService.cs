using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service managing evidence registry and immutable chain of custody ledgers.
    /// Tags: #backend #database
    /// </summary>
    public class EvidenceService
    {
        private readonly IRepository<Evidence> _evidenceRepo;
        private readonly IRepository<ChainOfCustody> _custodyRepo;
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public EvidenceService(
            IRepository<Evidence> evidenceRepo,
            IRepository<ChainOfCustody> custodyRepo,
            ICaseRepository caseRepo,
            IRepository<AuditLog> auditRepo)
        {
            _evidenceRepo = evidenceRepo;
            _custodyRepo = custodyRepo;
            _caseRepo = caseRepo;
            _auditRepo = auditRepo;
        }

        public async Task<Evidence> RegisterEvidenceAsync(
            int caseID, 
            int officerID, 
            string evidenceType, 
            string description, 
            string storageLocation)
        {
            var targetCase = await _caseRepo.GetByIdAsync(caseID);
            if (targetCase == null) throw new ArgumentException("Case not found.");

            if (string.IsNullOrWhiteSpace(evidenceType))
            {
                throw new ArgumentException("Evidence Type is required.");
            }

            var evidence = new Evidence
            {
                CaseID = caseID,
                EvidenceType = evidenceType.Trim(),
                Description = description?.Trim(),
                StorageLocation = storageLocation?.Trim()
            };

            await _evidenceRepo.AddAsync(evidence);

            var audit = new AuditLog
            {
                Action = $"Evidence Registered: Case ID {caseID}, Type: {evidenceType}",
                Timestamp = DateTime.UtcNow,
                UserID = officerID
            };
            await _auditRepo.AddAsync(audit);

            return evidence;
        }

        public async Task<ChainOfCustody> TransferCustodyAsync(
            int evidenceID, 
            int transferringOfficerID, 
            int receivingOfficerID, 
            string newLocation, 
            string reason)
        {
            var evidence = await _evidenceRepo.GetByIdAsync(evidenceID);
            if (evidence == null) throw new ArgumentException("Evidence not found.");

            if (string.IsNullOrWhiteSpace(newLocation) || string.IsNullOrWhiteSpace(reason))
            {
                throw new ArgumentException("Transfer location and reason are mandatory.");
            }

            // Create immutable ledger entry
            var custody = new ChainOfCustody
            {
                EvidenceID = evidenceID,
                TransferringOfficerID = transferringOfficerID,
                ReceivingOfficerID = receivingOfficerID,
                TransferTimestamp = DateTime.UtcNow,
                Location = newLocation.Trim(),
                ReasonForTransfer = reason.Trim()
            };

            await _custodyRepo.AddAsync(custody);

            // Update evidence current location pointer
            evidence.StorageLocation = newLocation.Trim();
            _evidenceRepo.Update(evidence);

            var audit = new AuditLog
            {
                Action = $"Custody Transferred: Evidence ID {evidenceID} to {receivingOfficerID}",
                Timestamp = DateTime.UtcNow,
                UserID = transferringOfficerID
            };
            await _auditRepo.AddAsync(audit);

            return custody;
        }

        public async Task<IEnumerable<ChainOfCustody>> GetCustodyLogAsync(int evidenceID)
        {
            return await _custodyRepo.FindAsync(c => c.EvidenceID == evidenceID);
        }
    }
}
