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
    public class ReportServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task ApproveAndLockReport_ValidStatus_ApprovesAndLocksCase()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var c = new Case { CaseNumber = "COL/2026/CL/0001", CaseType = "Clinical Forensic", Status = "Report Preparation" };
            context.Cases.Add(c);
            await context.SaveChangesAsync();

            var service = new ReportService(
                new Repository<MedicoLegalReport>(context),
                new CaseRepository(context),
                new Repository<AuditLog>(context));

            // Act
            var report = await service.ApproveAndLockReportAsync(c.CaseID, 1);

            // Assert
            Assert.NotNull(report);
            Assert.Equal("Approved", report.ApprovalStatus);
            Assert.Equal(1, report.ApprovedByID);

            var updatedCase = await context.Cases.FindAsync(c.CaseID);
            Assert.Equal("Report Approved", updatedCase!.Status);
        }

        [Fact]
        public async Task ApproveReport_InvalidStatus_ThrowsInvalidOperationException()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var c = new Case { CaseNumber = "COL/2026/CL/0001", CaseType = "Clinical Forensic", Status = "Registered" };
            context.Cases.Add(c);
            await context.SaveChangesAsync();

            var service = new ReportService(
                new Repository<MedicoLegalReport>(context),
                new CaseRepository(context),
                new Repository<AuditLog>(context));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.ApproveAndLockReportAsync(c.CaseID, 1));
        }
    }
}
