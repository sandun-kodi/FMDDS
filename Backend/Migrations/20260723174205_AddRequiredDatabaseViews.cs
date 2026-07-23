using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRequiredDatabaseViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE OR REPLACE VIEW ""VW_OpenCases"" AS
SELECT 
    c.""CaseID"",
    c.""CaseNumber"",
    c.""CaseType"",
    c.""RegistrationDate"",
    c.""Status"",
    p.""PatientID"",
    p.""FullName"" AS ""PatientName"",
    p.""NIC"" AS ""PatientNIC"",
    u.""UserID"" AS ""AssignedOfficerID"",
    u.""FullName"" AS ""AssignedOfficerName""
FROM ""Case"" c
INNER JOIN ""Patient"" p ON c.""PatientID"" = p.""PatientID""
LEFT JOIN ""User"" u ON c.""AssignedOfficerID"" = u.""UserID""
WHERE c.""Status"" NOT IN ('Closed', 'Archived');

CREATE OR REPLACE VIEW ""VW_CaseSummary"" AS
SELECT 
    c.""CaseID"",
    c.""CaseNumber"",
    c.""CaseType"",
    c.""Status"",
    c.""RegistrationDate"",
    p.""FullName"" AS ""PatientName"",
    p.""Gender"",
    p.""NIC"" AS ""PatientNIC"",
    ce.""ExamDate"" AS ""ClinicalExamDate"",
    ce.""Diagnosis"" AS ""ClinicalDiagnosis"",
    pe.""ExamDate"" AS ""AutopsyDate"",
    pe.""CauseOfDeath"" AS ""AutopsyCauseOfDeath""
FROM ""Case"" c
INNER JOIN ""Patient"" p ON c.""PatientID"" = p.""PatientID""
LEFT JOIN ""ClinicalExamination"" ce ON c.""CaseID"" = ce.""CaseID""
LEFT JOIN ""PostmortemExamination"" pe ON c.""CaseID"" = pe.""CaseID"";

CREATE OR REPLACE VIEW ""VW_LaboratoryStatus"" AS
SELECT 
    lr.""LabRequestID"",
    lr.""CaseID"",
    c.""CaseNumber"",
    lr.""RequestDate"",
    lr.""Status"" AS ""RequestStatus"",
    res.""LabResultID"",
    res.""CompletionDate"",
    CASE 
        WHEN res.""LabResultID"" IS NULL THEN 'Awaiting Analysis'
        ELSE 'Results Finalized'
    END AS ""ResultState""
FROM ""LaboratoryRequest"" lr
INNER JOIN ""Case"" c ON lr.""CaseID"" = c.""CaseID""
LEFT JOIN ""LaboratoryResult"" res ON lr.""LabRequestID"" = res.""LabRequestID"";

CREATE OR REPLACE VIEW ""VW_ReportSummary"" AS
SELECT 
    r.""ReportID"",
    r.""CaseID"",
    c.""CaseNumber"",
    r.""ReportType"",
    r.""ApprovalStatus"",
    r.""ApprovalDate"",
    u.""UserID"" AS ""ApproverID"",
    u.""FullName"" AS ""ApproverName""
FROM ""MedicoLegalReport"" r
INNER JOIN ""Case"" c ON r.""CaseID"" = c.""CaseID""
LEFT JOIN ""User"" u ON r.""ApprovedByID"" = u.""UserID"";

CREATE OR REPLACE VIEW ""VW_UserRoles"" AS
SELECT 
    u.""UserID"",
    u.""Username"",
    u.""FullName"" AS ""UserFullName"",
    u.""IsActive"",
    r.""RoleID"",
    r.""RoleName"",
    r.""Description"" AS ""RoleDescription""
FROM ""User"" u
INNER JOIN ""UserRole"" ur ON u.""UserID"" = ur.""UserID""
INNER JOIN ""Role"" r ON ur.""RoleID"" = r.""RoleID"";
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP VIEW IF EXISTS ""VW_UserRoles"";
DROP VIEW IF EXISTS ""VW_ReportSummary"";
DROP VIEW IF EXISTS ""VW_LaboratoryStatus"";
DROP VIEW IF EXISTS ""VW_CaseSummary"";
DROP VIEW IF EXISTS ""VW_OpenCases"";
");
        }
    }
}
