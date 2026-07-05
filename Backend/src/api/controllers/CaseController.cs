using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Case intake and tracking REST endpoints.
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
                var newCase = await _caseService.CreateCaseAsync(
                    request.PatientID,
                    request.CaseType,
                    request.ReferralSource,
                    request.ReferralSourceTypeID,
                    request.AssignedOfficerID,
                    request.HospitalID,
                    request.WardID
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
    }

    /// <summary>
    /// Data Transfer Object representing case registration request body.
    /// </summary>
    public class CreateCaseRequest
    {
        public int PatientID { get; set; }
        public string CaseType { get; set; }
        public string ReferralSource { get; set; }
        public int? ReferralSourceTypeID { get; set; }
        public int? AssignedOfficerID { get; set; }
        public int? HospitalID { get; set; }
        public int? WardID { get; set; }
    }
}
