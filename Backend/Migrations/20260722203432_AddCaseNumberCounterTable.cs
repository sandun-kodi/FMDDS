using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseNumberCounterTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CaseNumberCounters",
                columns: table => new
                {
                    BranchCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    CaseTypeCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    NextSequence = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseNumberCounters", x => new { x.BranchCode, x.Year, x.CaseTypeCode });
                });

            migrationBuilder.Sql(@"
INSERT INTO ""CaseNumberCounters"" (""BranchCode"", ""Year"", ""CaseTypeCode"", ""NextSequence"")
SELECT 
    split_part(""CaseNumber"", '/', 1) AS ""BranchCode"",
    CAST(split_part(""CaseNumber"", '/', 2) AS INTEGER) AS ""Year"",
    split_part(""CaseNumber"", '/', 3) AS ""CaseTypeCode"",
    MAX(CAST(split_part(""CaseNumber"", '/', 4) AS INTEGER)) AS ""NextSequence""
FROM ""Case""
WHERE ""CaseNumber"" ~ '^[A-Z]{3,5}/[0-9]{4}/[A-Z]{2}/[0-9]{4}$'
GROUP BY 1, 2, 3
ON CONFLICT (""BranchCode"", ""Year"", ""CaseTypeCode"")
DO UPDATE SET ""NextSequence"" = GREATEST(""CaseNumberCounters"".""NextSequence"", EXCLUDED.""NextSequence"");
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaseNumberCounters");
        }
    }
}
