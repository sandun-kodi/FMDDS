using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using System;

namespace FMDDS.API.Controllers
{
    [ApiController]
    [Route("api/v1/settings")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public SettingsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _dbContext.SystemSettings
                .Select(s => new { s.SettingID, s.SettingKey, s.SettingValue, s.Description })
                .ToListAsync();
            return Ok(settings);
        }

        [HttpPut("bulk")]
        public async Task<IActionResult> UpdateSettings([FromBody] List<SettingDto> settingsToUpdate)
        {
            if (settingsToUpdate == null || !settingsToUpdate.Any())
                return BadRequest("No settings provided for update.");

            foreach (var s in settingsToUpdate)
            {
                var existing = await _dbContext.SystemSettings.FindAsync(s.Id);
                if (existing != null)
                {
                    existing.SettingValue = s.Value;
                    existing.LastUpdatedDate = DateTime.UtcNow;
                    // In a real app, set LastUpdatedByID from current user token
                }
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Settings updated successfully." });
        }
    }

    public class SettingDto
    {
        public int Id { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
        public string Description { get; set; }
    }
}
