using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMDDS.Data.Entities;

namespace FMDDS.Data.Repositories
{
    /// <summary>
    /// Case-specific repository contract for optimized queries.
    /// Tags: #database #backend
    /// </summary>
    public interface ICaseRepository : IRepository<Case>
    {
        Task<Case> GetCaseWithDetailsAsync(int id);
        Task<IEnumerable<Case>> SearchCasesAsync(string caseNumber, string patientName, string status, string caseType);
        Task<bool> CaseNumberExistsAsync(string caseNumber);
    }
}
