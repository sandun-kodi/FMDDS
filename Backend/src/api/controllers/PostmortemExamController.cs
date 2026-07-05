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

        public PostmortemExamController(PostmortemExamService examService)
        {
            _examService = examService;
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
}
