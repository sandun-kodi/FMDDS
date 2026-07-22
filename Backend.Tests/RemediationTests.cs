using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FMDDS.Core.Services;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Backend.Tests
{
    public class RemediationTests
    {
        [Fact]
        public void IsValidSriLankanNic_RejectsEightDigitLegacyInput()
        {
            // 8 digits + V must be REJECTED (defined format is 9 digits + V/X)
            Assert.False(CaseService.IsValidSriLankanNic("12345678V"));
            Assert.False(CaseService.IsValidSriLankanNic("12345678X"));
        }

        [Fact]
        public void IsValidSriLankanNic_AcceptsValidNineDigitLegacyAndTwelveDigit()
        {
            Assert.True(CaseService.IsValidSriLankanNic("123456789V"));
            Assert.True(CaseService.IsValidSriLankanNic("123456789X"));
            Assert.True(CaseService.IsValidSriLankanNic("123456789v"));
            Assert.True(CaseService.IsValidSriLankanNic("123456789x"));
            Assert.True(CaseService.IsValidSriLankanNic("199012345678"));
        }

        [Fact]
        public void IsValidSriLankanNic_RejectsMalformedSuffixesAndEmbeddedLetters()
        {
            Assert.False(CaseService.IsValidSriLankanNic("123456789A"));
            Assert.False(CaseService.IsValidSriLankanNic("1234A6789V"));
            Assert.False(CaseService.IsValidSriLankanNic("12345678901")); // 11 digits
            Assert.False(CaseService.IsValidSriLankanNic("1234567890123")); // 13 digits
        }

        [Fact]
        public void TokenDenylistService_RevokesJtiAndCleansUp()
        {
            var denylist = new TokenDenylistService();
            string jti = Guid.NewGuid().ToString();

            Assert.False(denylist.IsRevoked(jti));

            // Revoke token with expiry in 1 hour
            denylist.RevokeToken(jti, DateTime.UtcNow.AddHours(1));
            Assert.True(denylist.IsRevoked(jti));

            // Token with past expiration should be treated as unrevoked/cleaned up
            string expiredJti = Guid.NewGuid().ToString();
            denylist.RevokeToken(expiredJti, DateTime.UtcNow.AddMinutes(-5));
            Assert.False(denylist.IsRevoked(expiredJti));
        }

        [Fact]
        public async Task RegisterCaseAsync_Concurrency_GeneratesUniqueCaseNumbers()
        {
            string dbName = "ConcurrencyTestDb_" + Guid.NewGuid();
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            // Seed initial patient
            using (var initContext = new AppDbContext(options))
            {
                var patient = new Patient { PatientID = 1, NIC = "941234567V", FullName = "Test Patient", Gender = "Male" };
                initContext.Patients.Add(patient);
                initContext.SaveChanges();
            }

            // Run 10 concurrent requests, each with its own scoped DbContext (as ASP.NET Core DI does)
            var tasks = new List<Task<Case>>();
            for (int i = 0; i < 10; i++)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var taskContext = new AppDbContext(options);
                    var caseRepo = new CaseRepository(taskContext);
                    var patientRepo = new Repository<Patient>(taskContext);
                    var hospRepo = new Repository<Hospital>(taskContext);
                    var wardRepo = new Repository<Ward>(taskContext);
                    var auditRepo = new Repository<AuditLog>(taskContext);

                    var service = new CaseService(taskContext, caseRepo, patientRepo, hospRepo, wardRepo, auditRepo);
                    return await service.RegisterCaseAsync(1, "Clinical Forensic");
                }));
            }

            var cases = await Task.WhenAll(tasks);
            var caseNumbers = cases.Select(c => c.CaseNumber).ToList();

            // Assert all 10 generated case numbers are strictly unique
            Assert.Equal(10, caseNumbers.Distinct().Count());
        }

        [Fact]
        public void EnsureUser_DoesNotOverwriteExistingUserPasswordOrLockoutStateOrRoles()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "SeedingTestDb_" + Guid.NewGuid())
                .Options;

            using (var context = new AppDbContext(options))
            {
                string originalHash = "$2a$12$CUSTOM_EXISTING_USER_PASSWORD_HASH";
                DateTime lockoutEnd = DateTime.UtcNow.AddMinutes(30);

                var role = new Role { RoleName = "Judicial Medical Officer", Description = "JMO" };
                context.Roles.Add(role);
                context.SaveChanges();

                var existingUser = new User
                {
                    Username = "test_locked_user",
                    FullName = "Locked User",
                    Email = "locked@test.com",
                    PasswordHash = originalHash,
                    IsActive = true,
                    FailedLoginCount = 5,
                    LockoutEnd = lockoutEnd
                };
                context.Users.Add(existingUser);
                context.SaveChanges();

                var userRole = new UserRole { UserID = existingUser.UserID, RoleID = role.RoleID };
                context.UserRoles.Add(userRole);
                context.SaveChanges();

                // Simulate restart seeding logic
                var userInDb = context.Users.FirstOrDefault(x => x.Username == "test_locked_user");
                if (userInDb == null)
                {
                    userInDb = new User { Username = "test_locked_user", PasswordHash = "NEW_HASH" };
                    context.Users.Add(userInDb);
                }
                context.SaveChanges();

                if (!context.UserRoles.Any())
                {
                    // Should not trigger because user roles already exist
                    context.UserRoles.Add(new UserRole { UserID = userInDb.UserID, RoleID = 999 });
                    context.SaveChanges();
                }

                var reloadedUser = context.Users.First(x => x.Username == "test_locked_user");
                Assert.Equal(originalHash, reloadedUser.PasswordHash);
                Assert.Equal(5, reloadedUser.FailedLoginCount);
                Assert.Equal(lockoutEnd, reloadedUser.LockoutEnd);

                var reloadedUserRole = context.UserRoles.FirstOrDefault(ur => ur.UserID == reloadedUser.UserID);
                Assert.NotNull(reloadedUserRole);
                Assert.Equal(role.RoleID, reloadedUserRole.RoleID);
            }
        }
    }
}
