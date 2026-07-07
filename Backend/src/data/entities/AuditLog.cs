using System;

namespace FMDDS.Data.Entities
{
    public class AuditLog
    {
        public int AuditLogID { get; set; }
        public string Action { get; set; }
        public DateTime Timestamp { get; set; }
        public int? UserID { get; set; }
        public string? IPAddress { get; set; }

        public User User { get; set; }
    }
}
