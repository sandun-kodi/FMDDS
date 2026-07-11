using System;

namespace FMDDS.Data.Entities
{
    public class SystemSetting
    {
        public int SettingID { get; set; }
        public string SettingKey { get; set; }
        public string SettingValue { get; set; }
        public string? Description { get; set; }
        public int? LastUpdatedByID { get; set; }
        public DateTime LastUpdatedDate { get; set; }

        public User? LastUpdatedBy { get; set; }
    }

    public class LoginAttempt
    {
        public int AttemptID { get; set; }
        public string Username { get; set; }
        public string? IPAddress { get; set; }
        public DateTime AttemptDate { get; set; }
        public bool IsSuccess { get; set; }
    }

    public class LaboratoryTestType
    {
        public int TestTypeID { get; set; }
        public string TestName { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
