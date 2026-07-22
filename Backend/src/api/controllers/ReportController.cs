using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Medico-Legal Report generation, approval, and download endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1")]
    public class ReportController : ControllerBase
    {
        private readonly ReportService _reportService;

        public ReportController(ReportService reportService)
        {
            _reportService = reportService;
        }

        /// <summary>
        /// Creates a draft medico-legal report for a case.
        /// Route: POST /api/v1/cases/{caseId}/reports
        /// </summary>
        [HttpPost("cases/{caseId}/reports")]
        [PermissionAuthorize("case:edit")]
        public async Task<IActionResult> CreateReport(int caseId, [FromBody] CreateReportDto request)
        {
            try
            {
                var report = await _reportService.CreateDraftReportAsync(caseId, request?.Summary ?? "Draft Medico-Legal Report");
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
        /// Approves the final medico-legal report and locks the case (by case ID).
        /// Route: POST /api/v1/cases/{caseId}/reports/approve
        /// </summary>
        [HttpPost("cases/{caseId}/reports/approve")]
        [PermissionAuthorize("report:approve")] // JMO Only
        public async Task<IActionResult> ApproveReportByCase(int caseId, [FromBody] ApproveReportDto request)
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
        /// Approves the final medico-legal report (by report ID).
        /// Route: PUT /api/v1/reports/{reportId}/approve
        /// </summary>
        [HttpPut("reports/{reportId}/approve")]
        [PermissionAuthorize("report:approve")] // JMO Only
        public async Task<IActionResult> ApproveReportById(int reportId, [FromBody] ApproveReportDto request)
        {
            try
            {
                var report = await _reportService.ApproveAndLockReportByReportIdAsync(reportId, request.JmoID);
                return Ok(report);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = "ERR_REPORT_STATE", message = ex.Message });
            }
        }

        /// <summary>
        /// Generates and downloads the PDF report for an approved case.
        /// Route: GET /api/v1/cases/{caseId}/reports/download
        /// </summary>
        [HttpGet("cases/{caseId}/reports/download")]
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

    public class CreateReportDto
    {
        public string? Summary { get; set; }
    }

    public class ApproveReportDto
    {
        public int JmoID { get; set; }
    }
}
