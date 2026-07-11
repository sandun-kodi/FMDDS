using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;

namespace FMDDS.API.Controllers
{
    [ApiController]
    [Route("api/v1/attachments")]
    public class AttachmentController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly string _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        public AttachmentController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

        [HttpPost("case/{caseId}")]
        public async Task<IActionResult> UploadAttachments(int caseId, [FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files provided.");

            var caseExists = await _dbContext.Cases.AnyAsync(c => c.CaseID == caseId);
            if (!caseExists)
                return NotFound($"Case {caseId} not found.");

            var uploadedAttachments = new List<Attachment>();

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(_uploadPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var attachment = new Attachment
                    {
                        CaseID = caseId,
                        FileName = file.FileName,
                        FilePath = $"/uploads/{fileName}",
                        UploadDate = DateTime.UtcNow,
                        UploadedByID = 1 // Hardcoded for demo; should come from token
                    };

                    _dbContext.Attachments.Add(attachment);
                    uploadedAttachments.Add(attachment);
                }
            }

            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Files uploaded successfully", count = uploadedAttachments.Count });
        }
    }
}
