using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service managing case creation validation, status progression, and number generation.
    /// Tags: #backend #database
    /// </summary>
    public class CaseService
    {
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<Patient> _patientRepo;
        private readonly IRepository<Hospital> _hospitalRepo;
        private readonly IRepository<Ward> _wardRepo;
        private readonly IRepository<ReferralSourceType> _referralTypeRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public CaseService(
            ICaseRepository caseRepo,
            IRepository<Patient> patientRepo,
            IRepository<Hospital> hospitalRepo,
            IRepository<Ward> wardRepo,
            IRepository<ReferralSourceType> referralTypeRepo,
            IRepository<AuditLog> auditRepo)
        {
            _caseRepo = caseRepo;
            _patientRepo = patientRepo;
            _hospitalRepo = hospitalRepo;
            _wardRepo = wardRepo;
            _referralTypeRepo = referralTypeRepo;
            _auditRepo = auditRepo;
        }

        public async Task<Case> CreateCaseAsync(
            int patientID, 
            string caseType, 
            string referralSource, 
            int? referralSourceTypeID, 
            int? assignedOfficerID, 
            int? hospitalID, 
            int? wardID)
        {
            // 1. Validate patient existence (BRL-002)
            var patient = await _patientRepo.GetByIdAsync(patientID);
            if (patient == null)
            {
                throw new ArgumentException("Patient record does not exist.");
            }

            // 2. Validate Hospital, Ward, and Referral lookup associations
            if (hospitalID.HasValue)
            {
                var hospital = await _hospitalRepo.GetByIdAsync(hospitalID.Value);
                if (hospital == null) throw new ArgumentException("Referring Hospital does not exist.");
            }

            if (wardID.HasValue)
            {
                var ward = await _wardRepo.GetByIdAsync(wardID.Value);
                if (ward == null) throw new ArgumentException("Referring Ward does not exist.");
                if (hospitalID.HasValue && ward.HospitalID != hospitalID.Value)
                {
                    throw new ArgumentException("The specified Ward does not belong to the selected Hospital.");
                }
            }

            if (referralSourceTypeID.HasValue)
            {
                var refType = await _referralTypeRepo.GetByIdAsync(referralSourceTypeID.Value);
                if (refType == null) throw new ArgumentException("Referral Source Type category does not exist.");
            }

            // 3. Generate unique Case Number sequence (BRL-001)
            string caseNumber = await GenerateCaseNumberAsync("COL", caseType);

            // 4. Construct Case entity
            var newCase = new Case
            {
                PatientID = patientID,
                CaseNumber = caseNumber,
                CaseType = caseType,
                RegistrationDate = DateTime.UtcNow,
                Status = "Registered",
                AssignedOfficerID = assignedOfficerID,
                HospitalID = hospitalID,
                WardID = wardID,
                ReferralSourceTypeID = referralSourceTypeID
            };

            await _caseRepo.AddAsync(newCase);

            // 5. Create immutable log trace row (BRL-021)
            var audit = new AuditLog
            {
                Action = $"Case Registered: {caseNumber}",
                Timestamp = DateTime.UtcNow,
                UserID = assignedOfficerID ?? 0
            };
            await _auditRepo.AddAsync(audit);

            return newCase;
        }

        public async Task<Patient> RegisterPatientAsync(
            string nic, 
            string fullName, 
            DateTime? dateOfBirth, 
            string gender, 
            string address, 
            string telephone)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full Name is mandatory.");
                
            if (string.IsNullOrWhiteSpace(gender))
                throw new ArgumentException("Gender is mandatory.");

            if (!string.IsNullOrWhiteSpace(nic))
            {
                var existing = await GetPatientByNicAsync(nic);
                if (existing != null)
                {
                    throw new ArgumentException("A patient with this NIC is already registered.");
                }
            }

            var patient = new Patient
            {
                NIC = nic,
                FullName = fullName,
                DateOfBirth = dateOfBirth,
                Gender = gender,
                Address = address,
                Telephone = telephone
            };

            await _patientRepo.AddAsync(patient);
            return patient;
        }

        public async Task<Patient> GetPatientByNicAsync(string nic)
        {
            if (string.IsNullOrWhiteSpace(nic)) return null;
            var results = await _patientRepo.FindAsync(p => p.NIC == nic);
            return System.Linq.Enumerable.FirstOrDefault(results);
        }

        private async Task<string> GenerateCaseNumberAsync(string branchCode, string caseType)
        {
            int year = DateTime.UtcNow.Year;
            string typeCode = caseType == "Postmortem" ? "PM" : "CL";
            
            // Fetch next sequence by checking existing matches
            var existingCases = await _caseRepo.SearchCasesAsync(null, null, null, caseType);
            int nextSeq = 1;
            foreach (var c in existingCases)
            {
                if (c.CaseNumber.Contains($"/{year}/"))
                {
                    nextSeq++;
                }
            }

            return $"{branchCode}/{year}/{typeCode}/{nextSeq:D4}"; // e.g. COL/2026/CL/0001
        }
    }
}
