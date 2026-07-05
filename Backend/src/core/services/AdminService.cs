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

        public AdminService(
            IRepository<AuditLog> auditRepo,
            ICaseRepository caseRepo)
        {
            _auditRepo = auditRepo;
            _caseRepo = caseRepo;
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
    }

    public class DashboardStatsDto
    {
        public int TotalCases { get; set; }
        public int ActiveCases { get; set; }
        public Dictionary<string, int> CasesByType { get; set; }
        public Dictionary<string, int> CasesByStatus { get; set; }
    }
}
