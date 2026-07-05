using System;

namespace FMDDS.Data.Entities
{
    public class ClinicalExamination
    {
        public int ClinicalExamID { get; set; }
        public int CaseID { get; set; }
        public int ExaminerID { get; set; }
        public string Observations { get; set; }
        public string Diagnosis { get; set; }
        public DateTime ExamDate { get; set; }

        public Case Case { get; set; }
        public User Examiner { get; set; }
    }

    public class PostmortemExamination
    {
        public int PostmortemExamID { get; set; }
        public int CaseID { get; set; }
        public int ExaminerID { get; set; }
        public string Findings { get; set; }
        public string CauseOfDeath { get; set; }
        public DateTime ExamDate { get; set; }

        public Case Case { get; set; }
        public User Examiner { get; set; }
    }
}
