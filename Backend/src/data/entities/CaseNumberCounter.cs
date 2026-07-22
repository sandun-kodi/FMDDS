using System;

namespace FMDDS.Data.Entities
{
    /// <summary>
    /// Entity for atomic database-backed case number sequence counters per branch, year, and case type.
    /// Tags: #database #concurrency
    /// </summary>
    public class CaseNumberCounter
    {
        public string BranchCode { get; set; } = "COL";
        public int Year { get; set; }
        public string CaseTypeCode { get; set; } = "CL";
        public int NextSequence { get; set; } = 1;
    }
}
