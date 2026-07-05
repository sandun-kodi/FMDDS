using System;
using System.Linq;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service managing laboratory requests, results, and case status transitions.
    /// Tags: #backend #database
    /// </summary>
    public class LaboratoryService
    {
        private readonly IRepository<LaboratoryRequest> _labRequestRepo;
        private readonly IRepository<LaboratoryResult> _labResultRepo;
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public LaboratoryService(
            IRepository<LaboratoryRequest> labRequestRepo,
            IRepository<LaboratoryResult> labResultRepo,
            ICaseRepository caseRepo,
            IRepository<AuditLog> auditRepo)
        {
            _labRequestRepo = labRequestRepo;
            _labResultRepo = labResultRepo;
            _caseRepo = caseRepo;
            _auditRepo = auditRepo;
        }

        public async Task<LaboratoryRequest> CreateLabRequestAsync(int caseID, int requesterID)
        {
            var targetCase = await _caseRepo.GetByIdAsync(caseID);
            if (targetCase == null) throw new ArgumentException("Case not found.");

            if (targetCase.Status == "Closed" || targetCase.Status == "Archived")
            {
                throw new InvalidOperationException("Cannot request lab tests for closed/archived cases.");
            }

            var labReq = new LaboratoryRequest
            {
                CaseID = caseID,
                RequestDate = DateTime.UtcNow,
                Status = "Pending"
            };

            await _labRequestRepo.AddAsync(labReq);

            // Update Case Status to 'Laboratory Pending'
            targetCase.Status = "Laboratory Pending";
            _caseRepo.Update(targetCase);

            var audit = new AuditLog
            {
                Action = $"Lab Request Created: Case ID {caseID}",
                Timestamp = DateTime.UtcNow,
                UserID = requesterID
            };
            await _auditRepo.AddAsync(audit);

            return labReq;
        }

        public async Task<LaboratoryResult> PostLabResultAsync(int labRequestID, int labStaffID, string resultText)
        {
            var labReq = await _labRequestRepo.GetByIdAsync(labRequestID);
            if (labReq == null) throw new ArgumentException("Lab request not found.");

            if (labReq.Status == "Completed")
            {
                throw new InvalidOperationException("This lab request is already completed.");
            }

            // Create Result
            var labResult = new LaboratoryResult
            {
                LabRequestID = labRequestID,
                Result = resultText.Trim(),
                CompletionDate = DateTime.UtcNow
            };
            await _labResultRepo.AddAsync(labResult);

            // Update Request Status
            labReq.Status = "Completed";
            _labRequestRepo.Update(labReq);

            // State Machine Check: If all lab requests for this case are completed, move case to 'Report Preparation'
            var targetCase = await _caseRepo.GetByIdAsync(labReq.CaseID);
            var allCaseRequests = await _labRequestRepo.FindAsync(r => r.CaseID == targetCase.CaseID);
            
            bool allCompleted = allCaseRequests.All(r => r.Status == "Completed" || r.LabRequestID == labRequestID);
            
            if (allCompleted)
            {
                targetCase.Status = "Report Preparation";
                _caseRepo.Update(targetCase);
            }

            var audit = new AuditLog
            {
                Action = $"Lab Result Posted: Request ID {labRequestID}",
                Timestamp = DateTime.UtcNow,
                UserID = labStaffID
            };
            await _auditRepo.AddAsync(audit);

            return labResult;
        }
    }
}
