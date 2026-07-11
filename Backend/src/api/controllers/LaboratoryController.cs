using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Laboratory requests and results endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1")]
    public class LaboratoryController : ControllerBase
    {
        private readonly LaboratoryService _labService;
        private readonly FMDDS.Data.Db.AppDbContext _dbContext;

        public LaboratoryController(LaboratoryService labService, FMDDS.Data.Db.AppDbContext dbContext)
        {
            _labService = labService;
            _dbContext = dbContext;
        }

        [HttpGet("lab-test-types")]
        public async Task<IActionResult> GetLabTestTypes()
        {
            var types = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_dbContext.LaboratoryTestTypes);
            return Ok(types);
        }

        /// <summary>
        /// Creates a laboratory investigation request for a case.
        /// Route: POST /api/v1/cases/{caseId}/lab-requests
        /// </summary>
        [HttpPost("cases/{caseId}/lab-requests")]
        [PermissionAuthorize("lab:request")] // JMO or MO only
        public async Task<IActionResult> CreateLabRequest(int caseId, [FromBody] CreateLabRequestDto request)
        {
            try
            {
                var labReq = await _labService.CreateLabRequestAsync(caseId, request.RequesterID);
                return Created($"/api/v1/lab-requests/{labReq.LabRequestID}", labReq);
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
        /// Posts results to an existing laboratory request.
        /// Route: POST /api/v1/lab-requests/{requestId}/results
        /// </summary>
        [HttpPost("lab-requests/{requestId}/results")]
        [PermissionAuthorize("lab:result_write")] // Laboratory Staff only
        public async Task<IActionResult> PostLabResult(int requestId, [FromBody] PostLabResultDto request)
        {
            if (string.IsNullOrWhiteSpace(request.ResultText))
            {
                return BadRequest(new { message = "Result text cannot be empty." });
            }

            try
            {
                var result = await _labService.PostLabResultAsync(requestId, request.LabStaffID, request.ResultText);
                return Created($"/api/v1/lab-requests/{requestId}/results", result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = "ERR_REQ_STATE", message = ex.Message });
            }
        }
    }

    public class CreateLabRequestDto
    {
        public int RequesterID { get; set; }
    }

    public class PostLabResultDto
    {
        public int LabStaffID { get; set; }
        public string ResultText { get; set; }
    }
}
