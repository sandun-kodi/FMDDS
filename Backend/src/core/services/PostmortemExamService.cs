using System;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service managing postmortem autopsy examination record updates and case status transitions.
    /// Tags: #backend #database
    /// </summary>
    public class PostmortemExamService
    {
        private readonly IRepository<PostmortemExamination> _examRepo;
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public PostmortemExamService(
            IRepository<PostmortemExamination> examRepo,
            ICaseRepository caseRepo,
            IRepository<User> userRepo,
            IRepository<AuditLog> auditRepo)
        {
            _examRepo = examRepo;
            _caseRepo = caseRepo;
            _userRepo = userRepo;
            _auditRepo = auditRepo;
        }

        public async Task<PostmortemExamination> RecordPostmortemExamAsync(
            int caseID, 
            int examinerID, 
            string findings, 
            string causeOfDeath)
        {
            // 1. Verify case exists and is valid (active and correct type)
            var targetCase = await _caseRepo.GetCaseWithDetailsAsync(caseID);
            if (targetCase == null)
            {
                throw new ArgumentException("Associated Case does not exist.");
            }
            if (targetCase.CaseType != "Postmortem")
            {
                throw new ArgumentException("Postmortem examinations can only be recorded for Postmortem cases.");
            }
            if (targetCase.Status == "Closed" || targetCase.Status == "Archived")
            {
                throw new InvalidOperationException("Autopsy findings cannot be recorded for a closed or archived case.");
            }

            // 2. Validate examiner credentials
            var examiner = await _userRepo.GetByIdAsync(examinerID);
            if (examiner == null)
            {
                throw new ArgumentException("Examiner user record does not exist.");
            }

            // 3. Enforce mandatory observations and COD checks
            if (string.IsNullOrWhiteSpace(findings) || findings.Trim().Length < 20)
            {
                throw new ArgumentException("Detailed autopsy findings (minimum 20 characters) are mandatory.");
            }
            if (string.IsNullOrWhiteSpace(causeOfDeath) || causeOfDeath.Trim().Length < 5)
            {
                throw new ArgumentException("Cause of Death details are mandatory.");
            }

            // 4. Save postmortem examination entity
            var exam = new PostmortemExamination
            {
                CaseID = caseID,
                ExaminerID = examinerID,
                Findings = findings.Trim(),
                CauseOfDeath = causeOfDeath.Trim()
            };

            await _examRepo.AddAsync(exam);

            // 5. Update Case Status to 'Examination In Progress'
            targetCase.Status = "Examination In Progress";
            _caseRepo.Update(targetCase);

            // 6. Log transaction audit row
            var audit = new AuditLog
            {
                Action = $"Postmortem Exam Recorded: Case ID {caseID}",
                Timestamp = DateTime.UtcNow,
                UserID = examinerID
            };
            await _auditRepo.AddAsync(audit);

            return exam;
        }
    }
}
