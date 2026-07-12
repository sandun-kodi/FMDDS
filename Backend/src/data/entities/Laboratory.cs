using System;

namespace FMDDS.Data.Entities
{
    public class LaboratoryRequest
    {
        public int LabRequestID { get; set; }
        public int CaseID { get; set; }
        public int? TestTypeID { get; set; }
        public DateTime RequestDate { get; set; }
        public string Status { get; set; } // 'Pending', 'Processing', 'Completed'

        public Case Case { get; set; }
        public LaboratoryTestType TestType { get; set; }
        public LaboratoryResult Result { get; set; }
    }

    public class LaboratoryResult
    {
        public int LabResultID { get; set; }
        public int LabRequestID { get; set; }
        public string Result { get; set; }
        public DateTime? CompletionDate { get; set; }

        public LaboratoryRequest LabRequest { get; set; }
    }
}
