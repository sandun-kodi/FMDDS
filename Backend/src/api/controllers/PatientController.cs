using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;
using FMDDS.Data.Entities;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Patient registration and search REST endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/patients")]
    public class PatientController : ControllerBase
    {
        private readonly CaseService _caseService;

        public PatientController(CaseService caseService)
        {
            _caseService = caseService;
        }

        /// <summary>
        /// Registers a new patient.
        /// Route: POST /api/v1/patients
        /// </summary>
        [HttpPost]
        [PermissionAuthorize("case:create")] // JMOs, Clerks, and Forensic Officers can register patients
        public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid patient registration payload." });
            }

            try
            {
                var patient = await _caseService.RegisterPatientAsync(
                    request.NIC,
                    request.FullName,
                    request.DateOfBirth,
                    request.Gender,
                    request.Address,
                    request.Telephone
                );

                return Created($"/api/v1/patients/{patient.PatientID}", patient);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred while registering the patient." });
            }
        }

        /// <summary>
        /// Retrieves a patient by NIC.
        /// Route: GET /api/v1/patients/nic/{nic}
        /// </summary>
        [HttpGet("nic/{nic}")]
        [PermissionAuthorize("case:create")]
        public async Task<IActionResult> GetPatientByNic(string nic)
        {
            try
            {
                var patient = await _caseService.GetPatientByNicAsync(nic);
                if (patient == null)
                {
                    return NotFound(new { message = $"Patient with NIC '{nic}' not found." });
                }
                return Ok(patient);
            }
            catch (Exception)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred while looking up the patient." });
            }
        }
    }

    public class RegisterPatientRequest
    {
        public string NIC { get; set; }
        public string FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string? Address { get; set; }
        public string? Telephone { get; set; }
    }
}
