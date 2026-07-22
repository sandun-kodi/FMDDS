using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FMDDS.Core.Services;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;

namespace Backend.Tests
{
    public class CaseServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Theory]
        [InlineData("941234567V", true)]
        [InlineData("941234567v", true)]
        [InlineData("941234567X", true)]
        [InlineData("199412345678", true)]
        [InlineData("12345", false)]
        [InlineData("ABCDEFGHIJK", false)]
        [InlineData("", false)]
        public void ValidateNicFormat_EvaluatesSriLankanNics(string nic, bool expectedValid)
        {
            // Act
            bool isValid = CaseService.IsValidSriLankanNic(nic);

            // Assert
            Assert.Equal(expectedValid, isValid);
        }

        [Fact]
        public async Task RegisterPatient_WithValidNic_Succeeds()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var caseRepo = new CaseRepository(context);
            var patientRepo = new Repository<Patient>(context);
            var hospitalRepo = new Repository<Hospital>(context);
            var wardRepo = new Repository<Ward>(context);
            var referralRepo = new Repository<ReferralSourceType>(context);
            var auditRepo = new Repository<AuditLog>(context);

            var service = new CaseService(caseRepo, patientRepo, hospitalRepo, wardRepo, auditRepo);

            // Act
            var patient = await service.RegisterPatientAsync("941234567V", "Sunil Perera", DateTime.UtcNow.AddYears(-30), "Male", "Colombo", "0771234567");

            // Assert
            Assert.NotNull(patient);
            Assert.Equal("941234567V", patient.NIC);
            Assert.Equal("Sunil Perera", patient.FullName);
        }

        [Fact]
        public async Task RegisterPatient_WithInvalidNic_ThrowsArgumentException()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CaseService(
                new CaseRepository(context),
                new Repository<Patient>(context),
                new Repository<Hospital>(context),
                new Repository<Ward>(context),
                new Repository<AuditLog>(context));

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                service.RegisterPatientAsync("INVALID_NIC", "Test", null, "Male", null, null));
        }

        [Fact]
        public async Task UpdateCaseStatus_ClosedCase_ThrowsInvalidOperationException()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var c = new Case { CaseNumber = "COL/2026/CL/0001", CaseType = "Clinical Forensic", Status = "Closed" };
            context.Cases.Add(c);
            await context.SaveChangesAsync();

            var service = new CaseService(
                new CaseRepository(context),
                new Repository<Patient>(context),
                new Repository<Hospital>(context),
                new Repository<Ward>(context),
                new Repository<AuditLog>(context));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.UpdateCaseStatusAsync(c.CaseID, "Report Preparation"));
        }
    }
}
