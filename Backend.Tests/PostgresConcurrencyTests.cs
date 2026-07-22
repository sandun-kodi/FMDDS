using System;
using System.Collections.Generic;
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
    public class PostgresConcurrencyTests
    {
        private string GetTestConnectionString()
        {
            var config = new ConfigurationBuilder()
                .AddUserSecrets<PostgresConcurrencyTests>(optional: true)
                .AddEnvironmentVariables()
                .Build();

            string connStr = config.GetConnectionString("TestConnection")
                             ?? config.GetConnectionString("DefaultConnection")
                             ?? Environment.GetEnvironmentVariable("TEST_CONNECTION_STRING")
                             ?? "";

            if (string.IsNullOrWhiteSpace(connStr))
            {
                // Fallback attempt to read User Secrets from Backend project directory
                throw new InvalidOperationException("DefaultConnection connection string is missing from Configuration.");
            }

            // Guarantee connection strictly targets fmdds_test database
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

        [Fact]
        public async Task RegisterCaseAsync_RealPostgres_SubmitsTwentyConcurrentRequests_GeneratesUniqueSequentialNumbers()
        {
            string connectionString = GetTestConnectionString();

            // Safety Assertions: Refuse execution if target DB is fmdds_db or does not contain fmdds_test
            Assert.True(connectionString.Contains("fmdds_test"), "Target database MUST be fmdds_test!");
            Assert.False(connectionString.Contains("Database=fmdds_db"), "Target database MUST NOT be fmdds_db!");

            // 1. Ensure migrations applied to fmdds_test
            using (var initContext = CreatePostgresDbContext(connectionString))
            {
                await initContext.Database.MigrateAsync();

                // Seed test patient if missing
                var patient = await initContext.Patients.FirstOrDefaultAsync(p => p.NIC == "949999999V");
                if (patient == null)
                {
                    patient = new Patient
                    {
                        NIC = "949999999V",
                        FullName = "Real Postgres Concurrency Patient",
                        Gender = "Male"
                    };
                    initContext.Patients.Add(patient);
                    await initContext.SaveChangesAsync();
                }
            }

            // Fetch patient ID using fresh context
            int patientId;
            using (var fetchContext = CreatePostgresDbContext(connectionString))
            {
                var patient = await fetchContext.Patients.FirstAsync(p => p.NIC == "949999999V");
                patientId = patient.PatientID;
            }

            int concurrentRequestCount = 25;
            var tasks = new List<Task<Case>>();

            // 2. Submit 25 concurrent case registration requests across parallel threads
            for (int i = 0; i < concurrentRequestCount; i++)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var taskContext = CreatePostgresDbContext(connectionString);
                    var caseRepo = new CaseRepository(taskContext);
                    var patientRepo = new Repository<Patient>(taskContext);
                    var hospRepo = new Repository<Hospital>(taskContext);
                    var wardRepo = new Repository<Ward>(taskContext);
                    var auditRepo = new Repository<AuditLog>(taskContext);

                    var service = new CaseService(taskContext, caseRepo, patientRepo, hospRepo, wardRepo, auditRepo);
                    return await service.RegisterCaseAsync(patientId, "Clinical Forensic");
                }));
            }

            var createdCases = await Task.WhenAll(tasks);

            // 3. Verifications
            Assert.Equal(concurrentRequestCount, createdCases.Length);

            var caseNumbers = createdCases.Select(c => c.CaseNumber).ToList();

            // Verification A: All returned case numbers are strictly unique
            int uniqueCount = caseNumbers.Distinct().Count();
            Assert.Equal(concurrentRequestCount, uniqueCount);

            // Verification B: Query fmdds_test database directly to verify zero duplicates exist in PostgreSQL
            using (var verifyContext = CreatePostgresDbContext(connectionString))
            {
                var dbCaseNumbers = await verifyContext.Cases
                    .Where(c => caseNumbers.Contains(c.CaseNumber))
                    .Select(c => c.CaseNumber)
                    .ToListAsync();

                Assert.Equal(concurrentRequestCount, dbCaseNumbers.Distinct().Count());
            }

            // Verification C: Parse numeric sequences and verify sequence uniqueness & non-repetition
            var sequences = caseNumbers.Select(cn =>
            {
                var parts = cn.Split('/');
                return int.Parse(parts[3]);
            }).ToList();

            Assert.Equal(concurrentRequestCount, sequences.Distinct().Count());
        }
    }
}
