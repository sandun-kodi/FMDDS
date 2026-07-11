using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityAndLabTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "User",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FailedLoginCount",
                table: "User",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "User",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockoutEnd",
                table: "User",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "User",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TestTypeID",
                table: "LaboratoryRequest",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Attachment",
                columns: table => new
                {
                    AttachmentID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CaseID = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    UploadedByID = table.Column<int>(type: "integer", nullable: false),
                    UploadDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachment", x => x.AttachmentID);
                    table.ForeignKey(
                        name: "FK_Attachment_Case_CaseID",
                        column: x => x.CaseID,
                        principalTable: "Case",
                        principalColumn: "CaseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attachment_User_UploadedByID",
                        column: x => x.UploadedByID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CauseOfDeathRecord",
                columns: table => new
                {
                    CauseID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PostmortemID = table.Column<int>(type: "integer", nullable: false),
                    RecordType = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CauseOfDeathRecord", x => x.CauseID);
                    table.ForeignKey(
                        name: "FK_CauseOfDeathRecord_PostmortemExamination_PostmortemID",
                        column: x => x.PostmortemID,
                        principalTable: "PostmortemExamination",
                        principalColumn: "PostmortemExamID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LaboratoryTestType",
                columns: table => new
                {
                    TestTypeID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TestName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaboratoryTestType", x => x.TestTypeID);
                });

            migrationBuilder.CreateTable(
                name: "LoginAttempt",
                columns: table => new
                {
                    AttemptID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    IPAddress = table.Column<string>(type: "text", nullable: true),
                    AttemptDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsSuccess = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginAttempt", x => x.AttemptID);
                });

            migrationBuilder.CreateTable(
                name: "SystemSetting",
                columns: table => new
                {
                    SettingID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SettingKey = table.Column<string>(type: "text", nullable: false),
                    SettingValue = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    LastUpdatedByID = table.Column<int>(type: "integer", nullable: true),
                    LastUpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSetting", x => x.SettingID);
                    table.ForeignKey(
                        name: "FK_SystemSetting_User_LastUpdatedByID",
                        column: x => x.LastUpdatedByID,
                        principalTable: "User",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_LaboratoryRequest_TestTypeID",
                table: "LaboratoryRequest",
                column: "TestTypeID");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_CaseID",
                table: "Attachment",
                column: "CaseID");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_UploadedByID",
                table: "Attachment",
                column: "UploadedByID");

            migrationBuilder.CreateIndex(
                name: "IX_CauseOfDeathRecord_PostmortemID",
                table: "CauseOfDeathRecord",
                column: "PostmortemID");

            migrationBuilder.CreateIndex(
                name: "IX_LaboratoryTestType_TestName",
                table: "LaboratoryTestType",
                column: "TestName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemSetting_LastUpdatedByID",
                table: "SystemSetting",
                column: "LastUpdatedByID");

            migrationBuilder.CreateIndex(
                name: "IX_SystemSetting_SettingKey",
                table: "SystemSetting",
                column: "SettingKey",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LaboratoryRequest_LaboratoryTestType_TestTypeID",
                table: "LaboratoryRequest",
                column: "TestTypeID",
                principalTable: "LaboratoryTestType",
                principalColumn: "TestTypeID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LaboratoryRequest_LaboratoryTestType_TestTypeID",
                table: "LaboratoryRequest");

            migrationBuilder.DropTable(
                name: "Attachment");

            migrationBuilder.DropTable(
                name: "CauseOfDeathRecord");

            migrationBuilder.DropTable(
                name: "LaboratoryTestType");

            migrationBuilder.DropTable(
                name: "LoginAttempt");

            migrationBuilder.DropTable(
                name: "SystemSetting");

            migrationBuilder.DropIndex(
                name: "IX_LaboratoryRequest_TestTypeID",
                table: "LaboratoryRequest");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "User");

            migrationBuilder.DropColumn(
                name: "FailedLoginCount",
                table: "User");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "User");

            migrationBuilder.DropColumn(
                name: "LockoutEnd",
                table: "User");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "User");

            migrationBuilder.DropColumn(
                name: "TestTypeID",
                table: "LaboratoryRequest");
        }
    }
}
