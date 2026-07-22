using System;
using System.Linq;
using System.Threading.Tasks;
using FMDDS.Core.Services;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Backend.Tests
{
    [Collection("PostgresDatabaseCollection")]
    public class PostgresBackfillTests
    {
        private string GetTestConnectionString()
        {
            var config = new ConfigurationBuilder()
                .AddUserSecrets<PostgresBackfillTests>(optional: true)
                .AddEnvironmentVariables()
                .Build();

            string connStr = config.GetConnectionString("TestConnection")
                             ?? config.GetConnectionString("DefaultConnection")
                             ?? Environment.GetEnvironmentVariable("TEST_CONNECTION_STRING")
                             ?? "";

            if (string.IsNullOrWhiteSpace(connStr))
            {
                throw new InvalidOperationException("DefaultConnection connection string is missing from Configuration.");
            }

            if (connStr.Contains("Database=fmdds_db"))
            {
                connStr = connStr.Replace("Database=fmdds_db", "Database=fmdds_test");
            }

            return connStr;
        }

        private AppDbContext CreatePostgresDbContext(string connectionString)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionString)
                .Options;
            return new AppDbContext(options);
        }

        private async Task ClearTestCasesAndCountersAsync(AppDbContext context)
        {
            context.CaseNumberCounters.RemoveRange(context.CaseNumberCounters);
            var testCases = await context.Cases.ToListAsync();
            context.Cases.RemoveRange(testCases);
            await context.SaveChangesAsync();
        }

        private async Task<int> EnsureTestPatientExistsAsync(AppDbContext context, string nic = "948888888V")
        {
            var patient = await context.Patients.FirstOrDefaultAsync(p => p.NIC == nic);
            if (patient == null)
            {
                patient = new Patient
                {
                    NIC = nic,
                    FullName = "Backfill Test Patient",
                    Gender = "Female"
                };
                context.Patients.Add(patient);
                await context.SaveChangesAsync();
            }
            return patient.PatientID;
        }

        [Fact]
        public async Task ScenarioA_ExistingCasesMissingCounter_BackfillsCounterToHighestSequence()
        {
            string connectionString = GetTestConnectionString();
            Assert.True(connectionString.Contains("fmdds_test"), "Target database MUST be fmdds_test!");

            int year = DateTime.UtcNow.Year;
            using (var context = CreatePostgresDbContext(connectionString))
            {
                await context.Database.MigrateAsync();
                await ClearTestCasesAndCountersAsync(context);
                int patientId = await EnsureTestPatientExistsAsync(context);

                // Insert existing cases: 0001, 0002, 0007
                string[] historicalNumbers = new[]
                {
                    $"COL/{year}/CL/0001",
                    $"COL/{year}/CL/0002",
                    $"COL/{year}/CL/0007"
                };

                foreach (var num in historicalNumbers)
                {
                    context.Cases.Add(new Case
                    {
                        PatientID = patientId,
                        CaseNumber = num,
                        CaseType = "Clinical Forensic",
                        RegistrationDate = DateTime.UtcNow,
                        Status = "Registered"
                    });
                }
                await context.SaveChangesAsync();

                // Execute backfill
                await CaseCounterInitializer.BackfillCaseCountersAsync(context);

                // Create new clinical case
                var caseRepo = new CaseRepository(context);
                var patientRepo = new Repository<Patient>(context);
                var hospRepo = new Repository<Hospital>(context);
                var wardRepo = new Repository<Ward>(context);
                var auditRepo = new Repository<AuditLog>(context);

                var service = new CaseService(context, caseRepo, patientRepo, hospRepo, wardRepo, auditRepo);
                var newCase = await service.RegisterCaseAsync(patientId, "Clinical Forensic");

                // Verify new case ends in 0008
                Assert.NotNull(newCase);
                Assert.EndsWith("/0008", newCase.CaseNumber);
            }
        }

        [Fact]
        public async Task ScenarioB_CounterAlreadyAhead_BackfillPreservesHigherCounterValue()
        {
            string connectionString = GetTestConnectionString();
            int year = DateTime.UtcNow.Year;

            using (var context = CreatePostgresDbContext(connectionString))
            {
                await context.Database.MigrateAsync();
                await ClearTestCasesAndCountersAsync(context);
                int patientId = await EnsureTestPatientExistsAsync(context);

                // Insert case 0007
                string c7 = $"COL/{year}/CL/0007";
                context.Cases.Add(new Case
                {
                    PatientID = patientId,
                    CaseNumber = c7,
                    CaseType = "Clinical Forensic",
                    RegistrationDate = DateTime.UtcNow,
                    Status = "Registered"
                });
                await context.SaveChangesAsync();

                // Explicitly set counter to 12
                context.CaseNumberCounters.Add(new CaseNumberCounter
                {
                    BranchCode = "COL",
                    Year = year,
                    CaseTypeCode = "CL",
                    NextSequence = 12
                });
                await context.SaveChangesAsync();

                // Run backfill
                await CaseCounterInitializer.BackfillCaseCountersAsync(context);

                // Verify counter remains 12
                var reloadedCounter = await context.CaseNumberCounters.FirstAsync(c =>
                    c.BranchCode == "COL" && c.Year == year && c.CaseTypeCode == "CL");
                Assert.Equal(12, reloadedCounter.NextSequence);

                // Create new case -> should end in 0013
                var service = new CaseService(context, new CaseRepository(context), new Repository<Patient>(context), new Repository<Hospital>(context), new Repository<Ward>(context), new Repository<AuditLog>(context));
                var newCase = await service.RegisterCaseAsync(patientId, "Clinical Forensic");

                Assert.EndsWith("/0013", newCase.CaseNumber);
            }
        }

        [Fact]
        public async Task ScenarioC_MultipleCaseTypes_MaintainsIndependentCounters()
        {
            string connectionString = GetTestConnectionString();
            int year = DateTime.UtcNow.Year;

            using (var context = CreatePostgresDbContext(connectionString))
            {
                await context.Database.MigrateAsync();
                await ClearTestCasesAndCountersAsync(context);
                int patientId = await EnsureTestPatientExistsAsync(context);

                // Seed Clinical (CL) case 0005 and Postmortem (PM) case 0010
                string clNum = $"COL/{year}/CL/0005";
                string pmNum = $"COL/{year}/PM/0010";

                context.Cases.Add(new Case { PatientID = patientId, CaseNumber = clNum, CaseType = "Clinical Forensic", Status = "Registered" });
                context.Cases.Add(new Case { PatientID = patientId, CaseNumber = pmNum, CaseType = "Postmortem", Status = "Registered" });
                await context.SaveChangesAsync();

                await CaseCounterInitializer.BackfillCaseCountersAsync(context);

                var service = new CaseService(context, new CaseRepository(context), new Repository<Patient>(context), new Repository<Hospital>(context), new Repository<Ward>(context), new Repository<AuditLog>(context));
                var nextCl = await service.RegisterCaseAsync(patientId, "Clinical Forensic");
                var nextPm = await service.RegisterCaseAsync(patientId, "Postmortem");

                Assert.EndsWith("/0006", nextCl.CaseNumber);
                Assert.EndsWith("/0011", nextPm.CaseNumber);
            }
        }

        [Fact]
        public async Task ScenarioD_MultipleYears_MaintainsIndependentYearCounters()
        {
            string connectionString = GetTestConnectionString();

            using (var context = CreatePostgresDbContext(connectionString))
            {
                await context.Database.MigrateAsync();
                await ClearTestCasesAndCountersAsync(context);
                int patientId = await EnsureTestPatientExistsAsync(context);

                string c2025 = "COL/2025/CL/0050";
                context.Cases.Add(new Case { PatientID = patientId, CaseNumber = c2025, CaseType = "Clinical Forensic", Status = "Registered" });
                await context.SaveChangesAsync();

                await CaseCounterInitializer.BackfillCaseCountersAsync(context);

                var counter2025 = await context.CaseNumberCounters.FirstOrDefaultAsync(c =>
                    c.BranchCode == "COL" && c.Year == 2025 && c.CaseTypeCode == "CL");

                Assert.NotNull(counter2025);
                Assert.Equal(50, counter2025.NextSequence);
            }
        }

        [Fact]
        public async Task ScenarioE_Idempotency_MultipleBackfillRunsPreserveCorrectState()
        {
            string connectionString = GetTestConnectionString();

            using (var context = CreatePostgresDbContext(connectionString))
            {
                await context.Database.MigrateAsync();
                await ClearTestCasesAndCountersAsync(context);

                // Run backfill twice consecutive
                await CaseCounterInitializer.BackfillCaseCountersAsync(context);
                int countRun1 = await context.CaseNumberCounters.CountAsync();

                await CaseCounterInitializer.BackfillCaseCountersAsync(context);
                int countRun2 = await context.CaseNumberCounters.CountAsync();

                Assert.Equal(countRun1, countRun2);
            }
        }

        [Fact]
        public async Task ScenarioF_MalformedCaseNumber_SafelyIgnoredWithoutCrashing()
        {
            string connectionString = GetTestConnectionString();

            using (var context = CreatePostgresDbContext(connectionString))
            {
                await context.Database.MigrateAsync();
                await ClearTestCasesAndCountersAsync(context);
                int patientId = await EnsureTestPatientExistsAsync(context);

                string malformed = "MALFORMED/123/CASE";
                context.Cases.Add(new Case { PatientID = patientId, CaseNumber = malformed, CaseType = "Clinical Forensic", Status = "Registered" });
                await context.SaveChangesAsync();

                // Backfill must complete without throwing exceptions
                var exception = await Record.ExceptionAsync(() => CaseCounterInitializer.BackfillCaseCountersAsync(context));
                Assert.Null(exception);
            }
        }
    }
}
