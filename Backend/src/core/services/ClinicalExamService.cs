using System;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service managing clinical forensic examination record updates and case status updates.
    /// Tags: #backend #database
    /// </summary>
    public class ClinicalExamService
    {
        private readonly IRepository<ClinicalExamination> _examRepo;
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public ClinicalExamService(
            IRepository<ClinicalExamination> examRepo,
            ICaseRepository caseRepo,
            IRepository<User> userRepo,
            IRepository<AuditLog> auditRepo)
        {
            _examRepo = examRepo;
            _caseRepo = caseRepo;
            _userRepo = userRepo;
            _auditRepo = auditRepo;
        }

        public async Task<ClinicalExamination> RecordClinicalExamAsync(
            int caseID, 
            int examinerID, 
            DateTime examDate, 
            string observations, 
            string diagnosis)
        {
            // 1. Verify case exists and is valid (active and correct type)
            var targetCase = await _caseRepo.GetCaseWithDetailsAsync(caseID);
            if (targetCase == null)
            {
                throw new ArgumentException("Associated Case does not exist.");
            }
            if (targetCase.CaseType != "Clinical Forensic")
            {
                throw new ArgumentException("Clinical examinations can only be recorded for Clinical Forensic cases.");
            }
            if (targetCase.Status == "Closed" || targetCase.Status == "Archived")
            {
                throw new InvalidOperationException("Observations cannot be recorded for a closed or archived case.");
            }

            // 2. Validate examiner credentials (BRL-008 - handled in controller role check, but double checked here)
            var examiner = await _userRepo.GetByIdAsync(examinerID);
            if (examiner == null)
            {
                throw new ArgumentException("Examiner user record does not exist.");
            }

            // 3. Enforce mandatory observations checks (BRL-007)
            if (string.IsNullOrWhiteSpace(observations) || observations.Trim().Length < 10)
            {
                throw new ArgumentException("Detailed clinical observations (minimum 10 characters) are mandatory.");
            }

            // 4. Save clinical examination entity
            var exam = new ClinicalExamination
            {
                CaseID = caseID,
                ExaminerID = examinerID,
                ExamDate = examDate,
                Observations = observations.Trim(),
                Diagnosis = diagnosis?.Trim()
            };

            await _examRepo.AddAsync(exam);

            // 5. Update Case Status to 'Examination In Progress' (BRL-003)
            targetCase.Status = "Examination In Progress";
            _caseRepo.Update(targetCase);

            // 6. Log transaction audit row
            var audit = new AuditLog
            {
                Action = $"Clinical Exam Recorded: Case ID {caseID}",
                Timestamp = DateTime.UtcNow,
                UserID = examinerID
            };
            await _auditRepo.AddAsync(audit);

            return exam;
        }
    }
}
