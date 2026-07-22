using Microsoft.EntityFrameworkCore;
using FMDDS.Data.Entities;

namespace FMDDS.Data.Db
{
    /// <summary>
    /// EF Core database context configuring mappings to PostgreSQL schema.
    /// Tags: #database #backend
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Core Entities
        public DbSet<Case> Cases { get; set; }
        public DbSet<CaseNumberCounter> CaseNumberCounters { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Hospital> Hospitals { get; set; }
        public DbSet<Ward> Wards { get; set; }
        public DbSet<ReferralSourceType> ReferralSourceTypes { get; set; }

        // Examination Entities
        public DbSet<ClinicalExamination> ClinicalExaminations { get; set; }
        public DbSet<PostmortemExamination> PostmortemExaminations { get; set; }

        // Laboratory Entities
        public DbSet<LaboratoryRequest> LaboratoryRequests { get; set; }
        public DbSet<LaboratoryResult> LaboratoryResults { get; set; }

        // Evidence Entities
        public DbSet<Evidence> Evidence { get; set; }
        public DbSet<ChainOfCustody> ChainOfCustody { get; set; }

        // Report Entities
        public DbSet<MedicoLegalReport> MedicoLegalReports { get; set; }

        // Audit & Settings
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<LoginAttempt> LoginAttempts { get; set; }
        public DbSet<LaboratoryTestType> LaboratoryTestTypes { get; set; }
        public DbSet<CauseOfDeathRecord> CauseOfDeathRecords { get; set; }
        public DbSet<Attachment> Attachments { get; set; }

        // Security and Extras
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure CaseNumberCounter
            modelBuilder.Entity<CaseNumberCounter>(entity =>
            {
                entity.ToTable("CaseNumberCounters");
                entity.HasKey(e => new { e.BranchCode, e.Year, e.CaseTypeCode });
                entity.Property(e => e.BranchCode).HasMaxLength(10);
                entity.Property(e => e.CaseTypeCode).HasMaxLength(10);
                entity.Property(e => e.NextSequence).IsRequired();
            });

            // Configure Case mapping
            modelBuilder.Entity<Case>(entity =>
            {
                entity.ToTable("Case");
                entity.HasKey(e => e.CaseID);
                entity.HasIndex(e => e.CaseNumber).IsUnique().HasDatabaseName("UQ_Case_CaseNumber");

                entity.Property(e => e.CaseNumber).IsRequired().HasMaxLength(30);
                entity.Property(e => e.CaseType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(30);

                // Configure Relationships (Cascade Restricts)
                entity.HasOne(d => d.Patient)
                    .WithMany()
                    .HasForeignKey(d => d.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.AssignedOfficer)
                    .WithMany()
                    .HasForeignKey(d => d.AssignedOfficerID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Hospital)
                    .WithMany()
                    .HasForeignKey(d => d.HospitalID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Ward)
                    .WithMany()
                    .HasForeignKey(d => d.WardID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.ReferralSourceType)
                    .WithMany()
                    .HasForeignKey(d => d.ReferralSourceTypeID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Ward mapping
            modelBuilder.Entity<Ward>(entity =>
            {
                entity.ToTable("Ward");
                entity.HasKey(e => e.WardID);

                entity.HasOne(d => d.Hospital)
                    .WithMany()
                    .HasForeignKey(d => d.HospitalID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure User
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("User");
                entity.HasKey(e => e.UserID);
                entity.HasIndex(e => e.Username).IsUnique();
            });

            // Configure Patient
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.ToTable("Patient");
                entity.HasKey(e => e.PatientID);
                entity.Property(e => e.Address).IsRequired(false);
                entity.Property(e => e.Telephone).IsRequired(false);
            });

            // Configure Hospital
            modelBuilder.Entity<Hospital>(entity =>
            {
                entity.ToTable("Hospital");
                entity.HasKey(e => e.HospitalID);
            });

            // Configure ClinicalExamination
            modelBuilder.Entity<ClinicalExamination>(entity =>
            {
                entity.ToTable("ClinicalExamination");
                entity.HasKey(e => e.ClinicalExamID);
            });

            // Configure PostmortemExamination
            modelBuilder.Entity<PostmortemExamination>(entity =>
            {
                entity.ToTable("PostmortemExamination");
                entity.HasKey(e => e.PostmortemExamID);
            });

            // Configure LaboratoryRequest
            modelBuilder.Entity<LaboratoryRequest>(entity =>
            {
                entity.ToTable("LaboratoryRequest");
                entity.HasKey(e => e.LabRequestID);
            });

            // Configure LaboratoryResult
            modelBuilder.Entity<LaboratoryResult>(entity =>
            {
                entity.ToTable("LaboratoryResult");
                entity.HasKey(e => e.LabResultID);
            });

            // Configure Evidence
            modelBuilder.Entity<Evidence>(entity =>
            {
                entity.ToTable("Evidence");
                entity.HasKey(e => e.EvidenceID);
            });

            // Configure ChainOfCustody
            modelBuilder.Entity<ChainOfCustody>(entity =>
            {
                entity.ToTable("ChainOfCustody");
                entity.HasKey(e => e.CustodyID);
                entity.HasOne(d => d.TransferringOfficer).WithMany().HasForeignKey(d => d.TransferringOfficerID).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(d => d.ReceivingOfficer).WithMany().HasForeignKey(d => d.ReceivingOfficerID).OnDelete(DeleteBehavior.Restrict);
            });

            // Configure MedicoLegalReport
            modelBuilder.Entity<MedicoLegalReport>(entity =>
            {
                entity.ToTable("MedicoLegalReport");
                entity.HasKey(e => e.ReportID);
            });

            // Configure AuditLog
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AuditLog");
                entity.HasKey(e => e.AuditLogID);
            });

            // Configure SystemSetting
            modelBuilder.Entity<SystemSetting>(entity =>
            {
                entity.ToTable("SystemSetting");
                entity.HasKey(e => e.SettingID);
                entity.HasIndex(e => e.SettingKey).IsUnique();
            });

            // Configure LoginAttempt
            modelBuilder.Entity<LoginAttempt>(entity =>
            {
                entity.ToTable("LoginAttempt");
                entity.HasKey(e => e.AttemptID);
            });

            // Configure LaboratoryTestType
            modelBuilder.Entity<LaboratoryTestType>(entity =>
            {
                entity.ToTable("LaboratoryTestType");
                entity.HasKey(e => e.TestTypeID);
                entity.HasIndex(e => e.TestName).IsUnique();
            });

            // Configure CauseOfDeathRecord
            modelBuilder.Entity<CauseOfDeathRecord>(entity =>
            {
                entity.ToTable("CauseOfDeathRecord");
                entity.HasKey(e => e.CauseID);
            });

            // Configure Attachment
            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.ToTable("Attachment");
                entity.HasKey(e => e.AttachmentID);
            });

            base.OnModelCreating(modelBuilder);

            // Configure Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Role");
                entity.HasKey(e => e.RoleID);
                entity.HasIndex(e => e.RoleName).IsUnique();
            });

            // Configure Permission
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.ToTable("Permission");
                entity.HasKey(e => e.PermissionID);
                entity.HasIndex(e => e.PermissionKey).IsUnique();
            });

            // Configure UserRole
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("UserRole");
                entity.HasKey(e => new { e.UserID, e.RoleID });

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Role)
                    .WithMany()
                    .HasForeignKey(d => d.RoleID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure RolePermission
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("RolePermission");
                entity.HasKey(e => new { e.RoleID, e.PermissionID });

                entity.HasOne(d => d.Role)
                    .WithMany()
                    .HasForeignKey(d => d.RoleID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Permission)
                    .WithMany()
                    .HasForeignKey(d => d.PermissionID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Department
            modelBuilder.Entity<Department>(entity =>
            {
                entity.ToTable("Department");
                entity.HasKey(e => e.DepartmentID);
            });

            // Configure Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("Notification");
                entity.HasKey(e => e.NotificationID);

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
