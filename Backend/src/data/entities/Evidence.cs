using System;

namespace FMDDS.Data.Entities
{
    public class Evidence
    {
        public int EvidenceID { get; set; }
        public int CaseID { get; set; }
        public string EvidenceType { get; set; }
        public string Description { get; set; }
        public string StorageLocation { get; set; }

        public Case Case { get; set; }
    }

    public class ChainOfCustody
    {
        public int CustodyID { get; set; }
        public int EvidenceID { get; set; }
        public int TransferringOfficerID { get; set; }
        public int ReceivingOfficerID { get; set; }
        public DateTime TransferTimestamp { get; set; }
        public string Location { get; set; }
        public string ReasonForTransfer { get; set; }

        public Evidence Evidence { get; set; }
        public User TransferringOfficer { get; set; }
        public User ReceivingOfficer { get; set; }
    }
}
