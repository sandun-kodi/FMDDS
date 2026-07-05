using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Hospital",
                columns: table => new
                {
                    HospitalID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HospitalName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hospital", x => x.HospitalID);
                });

            migrationBuilder.CreateTable(
                name: "Patient",
                columns: table => new
                {
                    PatientID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NIC = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Gender = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patient", x => x.PatientID);
                });

            migrationBuilder.CreateTable(
                name: "ReferralSourceTypes",
                columns: table => new
                {
                    ReferralSourceTypeID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TypeName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralSourceTypes", x => x.ReferralSourceTypeID);
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserID);
                });

            migrationBuilder.CreateTable(
                name: "Ward",
                columns: table => new
                {
                    WardID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HospitalID = table.Column<int>(type: "integer", nullable: false),
                    WardName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ward", x => x.WardID);
                    table.ForeignKey(
                        name: "FK_Ward_Hospital_HospitalID",
                        column: x => x.HospitalID,
                        principalTable: "Hospital",
                        principalColumn: "HospitalID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLog",
                columns: table => new
                {
                    AuditLogID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLog", x => x.AuditLogID);
                    table.ForeignKey(
                        name: "FK_AuditLog_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Case",
                columns: table => new
                {
                    CaseID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PatientID = table.Column<int>(type: "integer", nullable: false),
                    CaseNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CaseType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RegistrationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    AssignedOfficerID = table.Column<int>(type: "integer", nullable: true),
                    HospitalID = table.Column<int>(type: "integer", nullable: true),
                    WardID = table.Column<int>(type: "integer", nullable: true),
                    ReferralSourceTypeID = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Case", x => x.CaseID);
                    table.ForeignKey(
                        name: "FK_Case_Hospital_HospitalID",
                        column: x => x.HospitalID,
                        principalTable: "Hospital",
                        principalColumn: "HospitalID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Case_Patient_PatientID",
                        column: x => x.PatientID,
                        principalTable: "Patient",
                        principalColumn: "PatientID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Case_ReferralSourceTypes_ReferralSourceTypeID",
                        column: x => x.ReferralSourceTypeID,
                        principalTable: "ReferralSourceTypes",
                        principalColumn: "ReferralSourceTypeID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Case_User_AssignedOfficerID",
                        column: x => x.AssignedOfficerID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Case_Ward_WardID",
                        column: x => x.WardID,
                        principalTable: "Ward",
                        principalColumn: "WardID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClinicalExamination",
                columns: table => new
                {
                    ClinicalExamID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CaseID = table.Column<int>(type: "integer", nullable: false),
                    ExaminerID = table.Column<int>(type: "integer", nullable: false),
                    Observations = table.Column<string>(type: "text", nullable: false),
                    Diagnosis = table.Column<string>(type: "text", nullable: false),
                    ExamDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicalExamination", x => x.ClinicalExamID);
                    table.ForeignKey(
                        name: "FK_ClinicalExamination_Case_CaseID",
                        column: x => x.CaseID,
                        principalTable: "Case",
                        principalColumn: "CaseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClinicalExamination_User_ExaminerID",
                        column: x => x.ExaminerID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Evidence",
                columns: table => new
                {
                    EvidenceID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CaseID = table.Column<int>(type: "integer", nullable: false),
                    EvidenceType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    StorageLocation = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Evidence", x => x.EvidenceID);
                    table.ForeignKey(
                        name: "FK_Evidence_Case_CaseID",
                        column: x => x.CaseID,
                        principalTable: "Case",
                        principalColumn: "CaseID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LaboratoryRequest",
                columns: table => new
                {
                    LabRequestID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CaseID = table.Column<int>(type: "integer", nullable: false),
                    RequestDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaboratoryRequest", x => x.LabRequestID);
                    table.ForeignKey(
                        name: "FK_LaboratoryRequest_Case_CaseID",
                        column: x => x.CaseID,
                        principalTable: "Case",
                        principalColumn: "CaseID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedicoLegalReport",
                columns: table => new
                {
                    ReportID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CaseID = table.Column<int>(type: "integer", nullable: false),
                    ReportType = table.Column<string>(type: "text", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "text", nullable: false),
                    ApprovedByID = table.Column<int>(type: "integer", nullable: true),
                    ApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicoLegalReport", x => x.ReportID);
                    table.ForeignKey(
                        name: "FK_MedicoLegalReport_Case_CaseID",
                        column: x => x.CaseID,
                        principalTable: "Case",
                        principalColumn: "CaseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedicoLegalReport_User_ApprovedByID",
                        column: x => x.ApprovedByID,
                        principalTable: "User",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "PostmortemExamination",
                columns: table => new
                {
                    PostmortemExamID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CaseID = table.Column<int>(type: "integer", nullable: false),
                    ExaminerID = table.Column<int>(type: "integer", nullable: false),
                    Findings = table.Column<string>(type: "text", nullable: false),
                    CauseOfDeath = table.Column<string>(type: "text", nullable: false),
                    ExamDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostmortemExamination", x => x.PostmortemExamID);
                    table.ForeignKey(
                        name: "FK_PostmortemExamination_Case_CaseID",
                        column: x => x.CaseID,
                        principalTable: "Case",
                        principalColumn: "CaseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PostmortemExamination_User_ExaminerID",
                        column: x => x.ExaminerID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChainOfCustody",
                columns: table => new
                {
                    CustodyID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EvidenceID = table.Column<int>(type: "integer", nullable: false),
                    TransferringOfficerID = table.Column<int>(type: "integer", nullable: false),
                    ReceivingOfficerID = table.Column<int>(type: "integer", nullable: false),
                    TransferTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    ReasonForTransfer = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChainOfCustody", x => x.CustodyID);
                    table.ForeignKey(
                        name: "FK_ChainOfCustody_Evidence_EvidenceID",
                        column: x => x.EvidenceID,
                        principalTable: "Evidence",
                        principalColumn: "EvidenceID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChainOfCustody_User_ReceivingOfficerID",
                        column: x => x.ReceivingOfficerID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChainOfCustody_User_TransferringOfficerID",
                        column: x => x.TransferringOfficerID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LaboratoryResult",
                columns: table => new
                {
                    LabResultID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LabRequestID = table.Column<int>(type: "integer", nullable: false),
                    Result = table.Column<string>(type: "text", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaboratoryResult", x => x.LabResultID);
                    table.ForeignKey(
                        name: "FK_LaboratoryResult_LaboratoryRequest_LabRequestID",
                        column: x => x.LabRequestID,
                        principalTable: "LaboratoryRequest",
                        principalColumn: "LabRequestID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_UserID",
                table: "AuditLog",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Case_AssignedOfficerID",
                table: "Case",
                column: "AssignedOfficerID");

            migrationBuilder.CreateIndex(
                name: "IX_Case_HospitalID",
                table: "Case",
                column: "HospitalID");

            migrationBuilder.CreateIndex(
                name: "IX_Case_PatientID",
                table: "Case",
                column: "PatientID");

            migrationBuilder.CreateIndex(
                name: "IX_Case_ReferralSourceTypeID",
                table: "Case",
                column: "ReferralSourceTypeID");

            migrationBuilder.CreateIndex(
                name: "IX_Case_WardID",
                table: "Case",
                column: "WardID");

            migrationBuilder.CreateIndex(
                name: "UQ_Case_CaseNumber",
                table: "Case",
                column: "CaseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChainOfCustody_EvidenceID",
                table: "ChainOfCustody",
                column: "EvidenceID");

            migrationBuilder.CreateIndex(
                name: "IX_ChainOfCustody_ReceivingOfficerID",
                table: "ChainOfCustody",
                column: "ReceivingOfficerID");

            migrationBuilder.CreateIndex(
                name: "IX_ChainOfCustody_TransferringOfficerID",
                table: "ChainOfCustody",
                column: "TransferringOfficerID");

            migrationBuilder.CreateIndex(
                name: "IX_ClinicalExamination_CaseID",
                table: "ClinicalExamination",
                column: "CaseID");

            migrationBuilder.CreateIndex(
                name: "IX_ClinicalExamination_ExaminerID",
                table: "ClinicalExamination",
                column: "ExaminerID");

            migrationBuilder.CreateIndex(
                name: "IX_Evidence_CaseID",
                table: "Evidence",
                column: "CaseID");

            migrationBuilder.CreateIndex(
                name: "IX_LaboratoryRequest_CaseID",
                table: "LaboratoryRequest",
                column: "CaseID");

            migrationBuilder.CreateIndex(
                name: "IX_LaboratoryResult_LabRequestID",
                table: "LaboratoryResult",
                column: "LabRequestID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedicoLegalReport_ApprovedByID",
                table: "MedicoLegalReport",
                column: "ApprovedByID");

            migrationBuilder.CreateIndex(
                name: "IX_MedicoLegalReport_CaseID",
                table: "MedicoLegalReport",
                column: "CaseID");

            migrationBuilder.CreateIndex(
                name: "IX_PostmortemExamination_CaseID",
                table: "PostmortemExamination",
                column: "CaseID");

            migrationBuilder.CreateIndex(
                name: "IX_PostmortemExamination_ExaminerID",
                table: "PostmortemExamination",
                column: "ExaminerID");

            migrationBuilder.CreateIndex(
                name: "IX_User_Username",
                table: "User",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ward_HospitalID",
                table: "Ward",
                column: "HospitalID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLog");

            migrationBuilder.DropTable(
                name: "ChainOfCustody");

            migrationBuilder.DropTable(
                name: "ClinicalExamination");

            migrationBuilder.DropTable(
                name: "LaboratoryResult");

            migrationBuilder.DropTable(
                name: "MedicoLegalReport");

            migrationBuilder.DropTable(
                name: "PostmortemExamination");

            migrationBuilder.DropTable(
                name: "Evidence");

            migrationBuilder.DropTable(
                name: "LaboratoryRequest");

            migrationBuilder.DropTable(
                name: "Case");

            migrationBuilder.DropTable(
                name: "Patient");

            migrationBuilder.DropTable(
                name: "ReferralSourceTypes");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "Ward");

            migrationBuilder.DropTable(
                name: "Hospital");
        }
    }
}
