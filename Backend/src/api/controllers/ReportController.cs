using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Medico-Legal Report generation and Case locking.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/cases/{caseId}/reports")]
    public class ReportController : ControllerBase
    {
        private readonly ReportService _reportService;

        public ReportController(ReportService reportService)
        {
            _reportService = reportService;
        }

        /// <summary>
        /// Approves the final medico-legal report and locks the case.
        /// Route: POST /api/v1/cases/{caseId}/reports/approve
        /// </summary>
        [HttpPost("approve")]
        [PermissionAuthorize("report:approve")] // JMO Only
        public async Task<IActionResult> ApproveReport(int caseId, [FromBody] ApproveReportDto request)
        {
            try
            {
                var report = await _reportService.ApproveAndLockReportAsync(caseId, request.JmoID);
                return Created($"/api/v1/cases/{caseId}/reports/{report.ReportID}", report);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = "ERR_CASE_STATE", message = ex.Message });
            }
        }

        /// <summary>
        /// Generates and downloads the PDF report for an approved case.
        /// Route: GET /api/v1/cases/{caseId}/reports/download
        /// </summary>
        [HttpGet("download")]
        [PermissionAuthorize("report:print")]
        public async Task<IActionResult> DownloadReport(int caseId)
        {
            try
            {
                var pdfBytes = await _reportService.GeneratePdfReportAsync(caseId);
                return File(pdfBytes, "application/pdf", $"Case_{caseId}_Report.pdf");
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = "ERR_REPORT_NOT_READY", message = ex.Message });
            }
        }
    }

    public class ApproveReportDto
    {
        public int JmoID { get; set; }
    }
}
