using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Clinical forensic examination endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/cases/{caseId}/clinical-exam")]
    public class ClinicalExamController : ControllerBase
    {
        private readonly ClinicalExamService _examService;

        public ClinicalExamController(ClinicalExamService examService)
        {
            _examService = examService;
        }

        /// <summary>
        /// Registers clinical forensic observations for a case.
        /// Route: POST /api/v1/cases/{caseId}/clinical-exam
        /// </summary>
        [HttpPost]
        [PermissionAuthorize("exam:record_clinical")] // Secure endpoint (JMO and MO only)
        public async Task<IActionResult> RecordClinicalExam(int caseId, [FromBody] RecordClinicalExamRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid examination payload." });
            }

            try
            {
                var exam = await _examService.RecordClinicalExamAsync(
                    caseId,
                    request.ExaminerID,
                    request.ExamDate,
                    request.Observations,
                    request.Diagnosis
                );

                return Created($"/api/v1/cases/{caseId}/clinical-exam", exam);
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
    /// Data Transfer Object representing clinical examination details request body.
    /// </summary>
    public class RecordClinicalExamRequest
    {
        public int ExaminerID { get; set; }
        public DateTime ExamDate { get; set; }
        public string Observations { get; set; }
        public string Diagnosis { get; set; }
    }
}
