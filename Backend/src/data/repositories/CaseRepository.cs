using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FMDDS.Data.Entities;
using FMDDS.Data.Db;

namespace FMDDS.Data.Repositories
{
    /// <summary>
    /// CaseRepository implementing ICaseRepository using EF Core DbContext.
    /// Tags: #database #backend
    /// </summary>
    public class CaseRepository : ICaseRepository
    {
        protected readonly AppDbContext _context;

        public CaseRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Case> GetByIdAsync(int id)
        {
            return await _context.Cases.FindAsync(id);
        }

        public async Task<IEnumerable<Case>> GetAllAsync()
        {
            return await _context.Cases.ToListAsync();
        }

        public async Task<IEnumerable<Case>> FindAsync(Expression<Func<Case, bool>> predicate)
        {
            return await _context.Cases.Where(predicate).ToListAsync();
        }

        public async Task AddAsync(Case entity)
        {
            await _context.Cases.AddAsync(entity);
        }

        public async Task AddRangeAsync(IEnumerable<Case> entities)
        {
            await _context.Cases.AddRangeAsync(entities);
        }

        public void Update(Case entity)
        {
            _context.Cases.Update(entity);
        }

        public void Remove(Case entity)
        {
            _context.Cases.Remove(entity);
        }

        // Custom Optimized Searches
        public async Task<Case> GetCaseWithDetailsAsync(int id)
        {
            return await _context.Cases
                .Include(c => c.Patient)
                .Include(c => c.AssignedOfficer)
                .Include(c => c.Hospital)
                .Include(c => c.Ward)
                .Include(c => c.ReferralSourceType)
                .FirstOrDefaultAsync(c => c.CaseID == id);
        }

        public async Task<IEnumerable<Case>> SearchCasesAsync(string caseNumber, string patientName, string status, string caseType)
        {
            var query = _context.Cases
                .Include(c => c.Patient)
                .Include(c => c.AssignedOfficer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(caseNumber))
            {
                query = query.Where(c => c.CaseNumber.Contains(caseNumber));
            }

            if (!string.IsNullOrWhiteSpace(patientName))
            {
                query = query.Where(c => c.Patient.FullName.Contains(patientName));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(caseType))
            {
                query = query.Where(c => c.CaseType == caseType);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> CaseNumberExistsAsync(string caseNumber)
        {
            return await _context.Cases.AnyAsync(c => c.CaseNumber == caseNumber);
        }
    }
}
