using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Case intake, retrieval, and status REST endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/cases")]
    public class CaseController : ControllerBase
    {
        private readonly CaseService _caseService;

        public CaseController(CaseService caseService)
        {
            _caseService = caseService;
        }

        /// <summary>
        /// Retrieves a paginated/filtered list of cases.
        /// Route: GET /api/v1/cases
        /// </summary>
        [HttpGet]
        [PermissionAuthorize("case:view_all")]
        public async Task<IActionResult> GetCases([FromQuery] string? status, [FromQuery] string? caseType, [FromQuery] string? nic)
        {
            var cases = await _caseService.GetAllCasesAsync(status, caseType, nic);
            return Ok(cases);
        }

        /// <summary>
        /// Retrieves a single case by ID.
        /// Route: GET /api/v1/cases/{id}
        /// </summary>
        [HttpGet("{id}")]
        [PermissionAuthorize("case:view_all")]
        public async Task<IActionResult> GetCaseById(int id)
        {
            var targetCase = await _caseService.GetCaseByIdAsync(id);
            if (targetCase == null)
            {
                return NotFound(new { message = $"Case with ID {id} not found." });
            }
            return Ok(targetCase);
        }

        /// <summary>
        /// Registers a new Case linked to a Patient.
        /// Route: POST /api/v1/cases
        /// </summary>
        [HttpPost]
        [PermissionAuthorize("case:create")] // Restrict access to Clerks, JMOs, and Forensic Officers
        public async Task<IActionResult> CreateCase([FromBody] CreateCaseRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid case registration payload." });
            }

            try
            {
                var newCase = await _caseService.RegisterCaseAsync(
                    request.PatientID,
                    request.CaseType,
                    request.HospitalID,
                    request.WardID,
                    request.ReferralSourceTypeID,
                    request.AssignedOfficerID
                );

                return Created($"/api/v1/cases/{newCase.CaseID}", newCase);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred while creating the case." });
            }
        }

        /// <summary>
        /// Updates the status of an existing case.
        /// Route: PUT /api/v1/cases/{id}/status
        /// </summary>
        [HttpPut("{id}/status")]
        [PermissionAuthorize("case:edit")]
        public async Task<IActionResult> UpdateCaseStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { message = "Target status is required." });
            }

            try
            {
                var updatedCase = await _caseService.UpdateCaseStatusAsync(id, request.Status, request.OfficerID);
                return Ok(updatedCase);
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
    }

    public class CreateCaseRequest
    {
        public int PatientID { get; set; }
        public string CaseType { get; set; } = string.Empty;
        public string ReferralSource { get; set; } = string.Empty;
        public int? ReferralSourceTypeID { get; set; }
        public int? AssignedOfficerID { get; set; }
        public int? HospitalID { get; set; }
        public int? WardID { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public int OfficerID { get; set; }
    }
}
