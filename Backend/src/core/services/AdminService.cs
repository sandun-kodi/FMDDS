using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service for administrator-level operations including system auditing and statistical dashboards.
    /// Tags: #backend #analytics
    /// </summary>
    public class AdminService
    {
        private readonly IRepository<AuditLog> _auditRepo;
        private readonly ICaseRepository _caseRepo;
        private readonly FMDDS.Data.Db.AppDbContext _context;

        public AdminService(
            IRepository<AuditLog> auditRepo,
            ICaseRepository caseRepo,
            FMDDS.Data.Db.AppDbContext context)
        {
            _auditRepo = auditRepo;
            _caseRepo = caseRepo;
            _context = context;
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsAsync(int page = 1, int pageSize = 100)
        {
            // Simple pagination logic, ordered by most recent first
            var allLogs = await _auditRepo.FindAsync(_ => true); // In a real scenario with EF Core, use IQueryable for efficiency.
            return allLogs.OrderByDescending(a => a.Timestamp)
                          .Skip((page - 1) * pageSize)
                          .Take(pageSize);
        }

        public async Task<DashboardStatsDto> GetSystemStatisticsAsync()
        {
            var cases = await _caseRepo.FindAsync(_ => true);

            var stats = new DashboardStatsDto
            {
                TotalCases = cases.Count(),
                ActiveCases = cases.Count(c => c.Status != "Closed" && c.Status != "Archived"),
                CasesByType = cases.GroupBy(c => c.CaseType)
                                   .ToDictionary(g => g.Key, g => g.Count()),
                CasesByStatus = cases.GroupBy(c => c.Status)
                                     .ToDictionary(g => g.Key, g => g.Count())
            };

            return stats;
        }

        public async Task<IEnumerable<RoleWithPermissionsDto>> GetRolesWithPermissionsAsync()
        {
            var roles = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_context.Roles);
            var rolePermissions = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_context.RolePermissions);
            var permissions = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_context.Permissions);

            var permMap = permissions.ToDictionary(p => p.PermissionID, p => p.PermissionKey);

            return roles.Select(r => new RoleWithPermissionsDto
            {
                RoleID = r.RoleID,
                RoleName = r.RoleName,
                Description = r.Description,
                Permissions = rolePermissions
                    .Where(rp => rp.RoleID == r.RoleID && permMap.ContainsKey(rp.PermissionID))
                    .Select(rp => permMap[rp.PermissionID])
                    .Distinct()
                    .ToList()
            });
        }
    }

    public class DashboardStatsDto
    {
        public int TotalCases { get; set; }
        public int ActiveCases { get; set; }
        public Dictionary<string, int> CasesByType { get; set; }
        public Dictionary<string, int> CasesByStatus { get; set; }
    }

    public class RoleWithPermissionsDto
    {
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Permissions { get; set; } = new();
    }
}
