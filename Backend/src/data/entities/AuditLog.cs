using System;

namespace FMDDS.Data.Entities
{
    public class AuditLog
    {
        public int AuditLogID { get; set; }
        public string Action { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public int? UserID { get; set; }

        public User? User { get; set; }
    }
}
