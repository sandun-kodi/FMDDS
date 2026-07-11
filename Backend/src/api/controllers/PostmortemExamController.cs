using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Postmortem forensic examination endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/cases/{caseId}/postmortem-exam")]
    public class PostmortemExamController : ControllerBase
    {
        private readonly PostmortemExamService _examService;
        private readonly FMDDS.Data.Db.AppDbContext _dbContext;

        public PostmortemExamController(PostmortemExamService examService, FMDDS.Data.Db.AppDbContext dbContext)
        {
            _examService = examService;
            _dbContext = dbContext;
        }

        /// <summary>
        /// Registers postmortem autopsy observations for a case.
        /// Route: POST /api/v1/cases/{caseId}/postmortem-exam
        /// </summary>
        [HttpPost]
        [PermissionAuthorize("exam:record_postmortem")] // Secure endpoint (JMO and MO only)
        public async Task<IActionResult> RecordPostmortemExam(int caseId, [FromBody] RecordPostmortemExamRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid examination payload." });
            }

            try
            {
                var exam = await _examService.RecordPostmortemExamAsync(
                    caseId,
                    request.ExaminerID,
                    request.Findings,
                    request.CauseOfDeath
                );

                return Created($"/api/v1/cases/{caseId}/postmortem-exam", exam);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { code = "ERR_VALIDATION_FAILED", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { code = "ERR_CASE_CLOSED", message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred while saving the examination." });
            }
        }

        [HttpPost("causes")]
        [PermissionAuthorize("exam:record_postmortem")]
        public async Task<IActionResult> SaveCausesOfDeath(int caseId, [FromBody] System.Collections.Generic.List<CauseOfDeathDto> request)
        {
            var exam = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_dbContext.PostmortemExaminations, e => e.CaseID == caseId);
            if (exam == null) return NotFound("Postmortem exam not found for this case.");

            foreach (var cause in request)
            {
                _dbContext.CauseOfDeathRecords.Add(new FMDDS.Data.Entities.CauseOfDeathRecord
                {
                    PostmortemID = exam.PostmortemExamID,
                    RecordType = cause.RecordType,
                    Category = cause.Category,
                    Description = cause.Description
                });
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Causes of death saved." });
        }
    }

    /// <summary>
    /// Data Transfer Object representing postmortem examination details request body.
    /// </summary>
    public class RecordPostmortemExamRequest
    {
        public int ExaminerID { get; set; }
        public string Findings { get; set; }
        public string CauseOfDeath { get; set; }
    }

    public class CauseOfDeathDto
    {
        public string RecordType { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
    }
}
