using System;

namespace FMDDS.Data.Entities
{
    /// <summary>
    /// Case data entity matching the PostgreSQL schema.
    /// Tags: #database #backend
    /// </summary>
    public class Case
    {
        public int CaseID { get; set; }
        public int PatientID { get; set; }
        public string CaseNumber { get; set; }
        public string CaseType { get; set; }
        public DateTime RegistrationDate { get; set; }
        public string Status { get; set; }
        public int? AssignedOfficerID { get; set; }
        public int? HospitalID { get; set; }
        public int? WardID { get; set; }
        public int? ReferralSourceTypeID { get; set; }

        // Navigation Properties
        public Patient Patient { get; set; }
        public User AssignedOfficer { get; set; }
        public Hospital Hospital { get; set; }
        public Ward Ward { get; set; }
        public ReferralSourceType ReferralSourceType { get; set; }
        public System.Collections.Generic.ICollection<Attachment> Attachments { get; set; }
    }

    public class Attachment
    {
        public int AttachmentID { get; set; }
        public int CaseID { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int UploadedByID { get; set; }
        public DateTime UploadDate { get; set; }
        public string Description { get; set; }

        public Case Case { get; set; }
        public User UploadedBy { get; set; }
    }

    // Stub definitions for related models to avoid compilation errors in IDE
    public class Patient
    {
        public int PatientID { get; set; }
        public string NIC { get; set; }
        public string FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string? Address { get; set; }
        public string? Telephone { get; set; }
    }

    public class User
    {
        public int UserID { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string FullName { get; set; }
        public string? Email { get; set; }
        public bool IsActive { get; set; } = true;
        public int FailedLoginCount { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }
    }

    public class Hospital
    {
        public int HospitalID { get; set; }
        public string HospitalName { get; set; }
    }

    public class Ward
    {
        public int WardID { get; set; }
        public int HospitalID { get; set; }
        public string WardName { get; set; }
        public Hospital Hospital { get; set; }
    }

    public class ReferralSourceType
    {
        public int ReferralSourceTypeID { get; set; }
        public string TypeName { get; set; }
    }
}
