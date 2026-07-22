using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Idempotent service for populating and synchronizing case number sequence counters
    /// from existing historical case records.
    /// Tags: #backend #database #concurrency
    /// </summary>
    public static class CaseCounterInitializer
    {
        public static async Task BackfillCaseCountersAsync(AppDbContext context)
        {
            if (context == null) return;

            if (context.Database.IsRelational())
            {
                await context.Database.ExecuteSqlRawAsync(@"
INSERT INTO ""CaseNumberCounters"" (""BranchCode"", ""Year"", ""CaseTypeCode"", ""NextSequence"")
SELECT 
    split_part(""CaseNumber"", '/', 1) AS ""BranchCode"",
    CAST(split_part(""CaseNumber"", '/', 2) AS INTEGER) AS ""Year"",
    split_part(""CaseNumber"", '/', 3) AS ""CaseTypeCode"",
    MAX(CAST(split_part(""CaseNumber"", '/', 4) AS INTEGER)) AS ""NextSequence""
FROM ""Case""
WHERE ""CaseNumber"" ~ '^[A-Z]{{3,5}}/[0-9]{{4}}/[A-Z]{{2}}/[0-9]{{4}}$'
GROUP BY 1, 2, 3
ON CONFLICT (""BranchCode"", ""Year"", ""CaseTypeCode"")
DO UPDATE SET ""NextSequence"" = GREATEST(""CaseNumberCounters"".""NextSequence"", EXCLUDED.""NextSequence"");
");
            }
            else
            {
                // Programmatic backfill for InMemory database provider (testing)
                var allCases = await context.Cases.ToListAsync();
                var validCaseRegex = new Regex(@"^([A-Z]{3,5})/(\d{4})/([A-Z]{2})/(\d{4})$");

                var grouped = allCases
                    .Select(c => new { Case = c, Match = c.CaseNumber != null ? validCaseRegex.Match(c.CaseNumber) : null })
                    .Where(x => x.Match != null && x.Match.Success)
                    .Select(x => new
                    {
                        BranchCode = x.Match!.Groups[1].Value,
                        Year = int.Parse(x.Match.Groups[2].Value),
                        CaseTypeCode = x.Match.Groups[3].Value,
                        Sequence = int.Parse(x.Match.Groups[4].Value)
                    })
                    .GroupBy(x => new { x.BranchCode, x.Year, x.CaseTypeCode });

                foreach (var group in grouped)
                {
                    int maxSeq = group.Max(x => x.Sequence);
                    var counter = await context.CaseNumberCounters.FirstOrDefaultAsync(c =>
                        c.BranchCode == group.Key.BranchCode &&
                        c.Year == group.Key.Year &&
                        c.CaseTypeCode == group.Key.CaseTypeCode);

                    if (counter == null)
                    {
                        context.CaseNumberCounters.Add(new CaseNumberCounter
                        {
                            BranchCode = group.Key.BranchCode,
                            Year = group.Key.Year,
                            CaseTypeCode = group.Key.CaseTypeCode,
                            NextSequence = maxSeq
                        });
                    }
                    else
                    {
                        counter.NextSequence = Math.Max(counter.NextSequence, maxSeq);
                    }
                }
                await context.SaveChangesAsync();
            }
        }
    }
}
