using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FMDDS.API.Middlewares;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing Admin-only audit logs and system statistics endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;

        public AdminController(AdminService adminService)
        {
            _adminService = adminService;
        }

        /// <summary>
        /// Retrieves paginated system audit logs.
        /// Route: GET /api/v1/admin/audit-logs
        /// </summary>
        [HttpGet("audit-logs")]
        [PermissionAuthorize("admin:audit")] // Admins Only
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            try
            {
                var logs = await _adminService.GetAuditLogsAsync(page, pageSize);
                return Ok(logs);
            }
            catch (Exception)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred retrieving audit logs." });
            }
        }

        /// <summary>
        /// Retrieves aggregate statistics for the dashboard.
        /// Route: GET /api/v1/admin/dashboard-stats
        /// </summary>
        [HttpGet("dashboard-stats")]
        [PermissionAuthorize("admin:stats")] // Admins Only
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _adminService.GetSystemStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred generating dashboard statistics." });
            }
        }

        /// <summary>
        /// Retrieves system roles and their assigned permissions.
        /// Route: GET /api/v1/admin/roles-permissions
        /// </summary>
        [HttpGet("roles-permissions")]
        [PermissionAuthorize("user:manage")] // Admins Only
        public async Task<IActionResult> GetRolesPermissions()
        {
            try
            {
                var rolesPerms = await _adminService.GetRolesWithPermissionsAsync();
                return Ok(rolesPerms);
            }
            catch (Exception)
            {
                return StatusCode(500, new { code = "ERR_INTERNAL_SERVER", message = "An error occurred retrieving roles and permissions." });
            }
        }
    }
}
