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
            targetCase.Status = "Report Approved"; // Alternately, 'Closed' based on specific definitions, assuming 'Report Approved' is terminal or near-terminal.
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

        public async Task<byte[]> GeneratePdfReportAsync(int caseID)
        {
            var targetCase = await _caseRepo.GetCaseWithDetailsAsync(caseID);
            if (targetCase == null) throw new ArgumentException("Case not found.");

            if (targetCase.Status != "Report Approved" && targetCase.Status != "Closed")
            {
                throw new InvalidOperationException("PDF reports can only be generated for approved/closed cases.");
            }

            // Implementation placeholder for PDF generation (e.g., using iText7 or QuestPDF).
            // For now, generating a simulated byte stream.
            string content = $"MEDICO-LEGAL REPORT\n\nCase Number: {targetCase.CaseNumber}\nType: {targetCase.CaseType}\nStatus: {targetCase.Status}\n\nGenerated on: {DateTime.UtcNow}";
            byte[] pdfBytes = Encoding.UTF8.GetBytes(content);
            
            return pdfBytes;
        }
    }
}
