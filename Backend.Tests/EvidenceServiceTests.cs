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
    public class EvidenceServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task RegisterEvidence_And_TransferCustody_UpdatesLocationAndCreatesLedger()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var c = new Case { CaseNumber = "COL/2026/CL/0001", CaseType = "Clinical Forensic", Status = "Registered" };
            context.Cases.Add(c);
            await context.SaveChangesAsync();

            var service = new EvidenceService(
                new Repository<Evidence>(context),
                new Repository<ChainOfCustody>(context),
                new CaseRepository(context),
                new Repository<AuditLog>(context));

            // Act 1: Register evidence
            var evidence = await service.RegisterEvidenceAsync(c.CaseID, 1, "Blood Sample", "Vial containing 5ml blood", "Locker A1");
            Assert.NotNull(evidence);
            Assert.Equal("Locker A1", evidence.StorageLocation);

            // Act 2: Transfer custody
            var custody = await service.TransferCustodyAsync(evidence.EvidenceID, 1, 2, "Lab Vault B", "Transfer for Toxicology Analysis");

            // Assert
            Assert.NotNull(custody);
            Assert.Equal("Lab Vault B", custody.Location);
            Assert.Equal(1, custody.TransferringOfficerID);
            Assert.Equal(2, custody.ReceivingOfficerID);

            // Verify evidence entity location updated
            var updatedEvidence = await context.Evidence.FindAsync(evidence.EvidenceID);
            Assert.Equal("Lab Vault B", updatedEvidence!.StorageLocation);
        }
    }
}
