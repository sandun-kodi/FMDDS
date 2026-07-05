using System;

namespace FMDDS.Data.Entities
{
    public class MedicoLegalReport
    {
        public int ReportID { get; set; }
        public int CaseID { get; set; }
        public string ReportType { get; set; } // 'Clinical', 'Postmortem', etc.
        public string ApprovalStatus { get; set; } // 'Draft', 'Approved'
        public int? ApprovedByID { get; set; }
        public DateTime? ApprovalDate { get; set; }

        public Case Case { get; set; }
        public User ApprovedBy { get; set; }
    }
}
