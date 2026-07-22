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
    public class LaboratoryServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateLabRequest_And_PostLabResult_TransitionsCaseStatus()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var c = new Case { CaseNumber = "COL/2026/CL/0001", CaseType = "Clinical Forensic", Status = "Examination In Progress" };
            context.Cases.Add(c);
            await context.SaveChangesAsync();

            var service = new LaboratoryService(
                new Repository<LaboratoryRequest>(context),
                new Repository<LaboratoryResult>(context),
                new CaseRepository(context),
                new Repository<AuditLog>(context));

            // Act 1: Request lab test
            var labReq = await service.CreateLabRequestAsync(c.CaseID, 1);
            Assert.Equal("Pending", labReq.Status);

            var updatedCase1 = await context.Cases.FindAsync(c.CaseID);
            Assert.Equal("Laboratory Pending", updatedCase1!.Status);

            // Act 2: Post lab result
            var result = await service.PostLabResultAsync(labReq.LabRequestID, 3, "Toxicology Screen: Negative for blood alcohol.");
            Assert.NotNull(result);

            // Assert: All lab requests finished -> Case transitions to 'Report Preparation'
            var updatedCase2 = await context.Cases.FindAsync(c.CaseID);
            Assert.Equal("Report Preparation", updatedCase2!.Status);
        }
    }
}
