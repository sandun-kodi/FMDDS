using System;
using System.Text;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service managing Medico-Legal report generation and Case status locking.
    /// Tags: #backend #database #pdf
    /// </summary>
    public class ReportService
    {
        private readonly IRepository<MedicoLegalReport> _reportRepo;
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public ReportService(
            IRepository<MedicoLegalReport> reportRepo,
            ICaseRepository caseRepo,
            IRepository<AuditLog> auditRepo)
        {
            _reportRepo = reportRepo;
            _caseRepo = caseRepo;
            _auditRepo = auditRepo;
        }

        public async Task<MedicoLegalReport> CreateDraftReportAsync(int caseID, string reportSummary, int userId = 1)
        {
            var targetCase = await _caseRepo.GetByIdAsync(caseID);
            if (targetCase == null) throw new ArgumentException("Case not found.");

            if (targetCase.Status == "Closed" || targetCase.Status == "Archived")
            {
                throw new InvalidOperationException("Cannot create a report for a closed or archived case.");
            }

            var report = new MedicoLegalReport
            {
                CaseID = caseID,
                ReportType = targetCase.CaseType,
                ApprovalStatus = "Draft",
                ApprovedByID = null,
                ApprovalDate = null
            };

            await _reportRepo.AddAsync(report);

            targetCase.Status = "Report Preparation";
            _caseRepo.Update(targetCase);

            var audit = new AuditLog
            {
                Action = $"Draft Report Created: Case ID {caseID}",
                Timestamp = DateTime.UtcNow,
                UserID = userId > 0 ? userId : 1
            };
            await _auditRepo.AddAsync(audit);

            return report;
        }

        public async Task<MedicoLegalReport> ApproveAndLockReportAsync(int caseID, int jmoID)
        {
            var targetCase = await _caseRepo.GetByIdAsync(caseID);
            if (targetCase == null) throw new ArgumentException("Case not found.");

            // BRL-004: Report can only be approved if case is in 'Report Preparation' status.
            if (targetCase.Status != "Report Preparation")
            {
                throw new InvalidOperationException($"Cannot approve report. Case is currently in '{targetCase.Status}' status. Expected 'Report Preparation'.");
            }

            // Create Report Entity
            var report = new MedicoLegalReport
            {
                CaseID = caseID,
                ReportType = targetCase.CaseType, // Clinical or Postmortem
                ApprovalStatus = "Approved",
                ApprovedByID = jmoID,
                ApprovalDate = DateTime.UtcNow
            };

            await _reportRepo.AddAsync(report);

            // Lock the case status
            targetCase.Status = "Report Approved";
            _caseRepo.Update(targetCase);

            var audit = new AuditLog
            {
                Action = $"Report Approved and Case Locked: Case ID {caseID}",
                Timestamp = DateTime.UtcNow,
                UserID = jmoID
            };
            await _auditRepo.AddAsync(audit);

            return report;
        }

        public async Task<MedicoLegalReport> ApproveAndLockReportByReportIdAsync(int reportID, int jmoID)
        {
            var report = await _reportRepo.GetByIdAsync(reportID);
            if (report == null) throw new ArgumentException("Report not found.");

            if (report.ApprovalStatus == "Approved")
            {
                throw new InvalidOperationException("Report is already approved.");
            }

            var targetCase = await _caseRepo.GetByIdAsync(report.CaseID);
            if (targetCase == null) throw new ArgumentException("Associated case not found.");

            report.ApprovalStatus = "Approved";
            report.ApprovedByID = jmoID;
            report.ApprovalDate = DateTime.UtcNow;

            _reportRepo.Update(report);

            targetCase.Status = "Report Approved";
            _caseRepo.Update(targetCase);

            var audit = new AuditLog
            {
                Action = $"Report ID {reportID} Approved for Case ID {targetCase.CaseID}",
                Timestamp = DateTime.UtcNow,
                UserID = jmoID
            };
            await _auditRepo.AddAsync(audit);

            return report;
        }

        public async Task<byte[]> GeneratePdfReportAsync(int caseID)
        {
            var targetCase = await _caseRepo.GetCaseWithDetailsAsync(caseID);
            if (targetCase == null) throw new ArgumentException("Case not found.");

            if (targetCase.Status != "Report Approved" && targetCase.Status != "Closed")
            {
                throw new InvalidOperationException("PDF reports can only be generated for approved/closed cases.");
            }

            string content = $"MEDICO-LEGAL REPORT\n\nCase Number: {targetCase.CaseNumber}\nType: {targetCase.CaseType}\nStatus: {targetCase.Status}\n\nGenerated on: {DateTime.UtcNow}";
            byte[] pdfBytes = Encoding.UTF8.GetBytes(content);
            
            return pdfBytes;
        }
    }
}
