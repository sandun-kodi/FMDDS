using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Evidence and Custody Ledger endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1")]
    public class EvidenceController : ControllerBase
    {
        private readonly EvidenceService _evidenceService;

        public EvidenceController(EvidenceService evidenceService)
        {
            _evidenceService = evidenceService;
        }

        /// <summary>
        /// Registers physical evidence associated with a case.
        /// Route: POST /api/v1/cases/{caseId}/evidence
        /// </summary>
        [HttpPost("cases/{caseId}/evidence")]
        [PermissionAuthorize("evidence:manage")] // Forensic Officers
        public async Task<IActionResult> RegisterEvidence(int caseId, [FromBody] RegisterEvidenceDto request)
        {
            try
            {
                var evidence = await _evidenceService.RegisterEvidenceAsync(
                    caseId, 
                    request.OfficerID, 
                    request.EvidenceType, 
                    request.Description, 
                    request.StorageLocation
                );
                return Created($"/api/v1/evidence/{evidence.EvidenceID}", evidence);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
        }

        /// <summary>
        /// Logs a custody transfer in the immutable ledger.
        /// Route: POST /api/v1/evidence/{evidenceId}/transfer
        /// </summary>
        [HttpPost("evidence/{evidenceId}/transfer")]
        [PermissionAuthorize("evidence:manage")]
        public async Task<IActionResult> TransferCustody(int evidenceId, [FromBody] TransferCustodyDto request)
        {
            try
            {
                var custody = await _evidenceService.TransferCustodyAsync(
                    evidenceId,
                    request.TransferringOfficerID,
                    request.ReceivingOfficerID,
                    request.NewLocation,
                    request.Reason
                );
                return Created($"/api/v1/evidence/{evidenceId}/custody-log/{custody.CustodyID}", custody);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves the custody log for a specific evidence item.
        /// Route: GET /api/v1/evidence/{evidenceId}/custody-log
        /// </summary>
        [HttpGet("evidence/{evidenceId}/custody-log")]
        [PermissionAuthorize("evidence:manage")]
        public async Task<IActionResult> GetCustodyLog(int evidenceId)
        {
            var logs = await _evidenceService.GetCustodyLogAsync(evidenceId);
            return Ok(logs);
        }
    }

    public class RegisterEvidenceDto
    {
        public int OfficerID { get; set; }
        public string EvidenceType { get; set; }
        public string Description { get; set; }
        public string StorageLocation { get; set; }
    }

    public class TransferCustodyDto
    {
        public int TransferringOfficerID { get; set; }
        public int ReceivingOfficerID { get; set; }
        public string NewLocation { get; set; }
        public string Reason { get; set; }
    }
}
