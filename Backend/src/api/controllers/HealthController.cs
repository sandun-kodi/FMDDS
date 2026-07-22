using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.Data.Db;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing health check endpoints.
    /// Tags: #backend #health
    /// </summary>
    [ApiController]
    [Route("api/v1/health")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public HealthController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Health check endpoint returning API status and database connectivity.
        /// Route: GET /api/v1/health
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetHealthStatus()
        {
            bool isDbConnected = false;
            string dbStatus = "Disconnected";

            try
            {
                isDbConnected = await _dbContext.Database.CanConnectAsync();
                dbStatus = isDbConnected ? "Connected" : "Unavailable";
            }
            catch (Exception)
            {
                dbStatus = "Error";
            }

            var result = new
            {
                status = isDbConnected ? "Healthy" : "Degraded",
                timestamp = DateTime.UtcNow,
                service = "FMDDS API Service",
                version = "1.0.0",
                database = new
                {
                    system = "PostgreSQL",
                    status = dbStatus
                }
            };

            if (!isDbConnected)
            {
                return StatusCode(503, result);
            }

            return Ok(result);
        }
    }
}
