using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Xunit;
using FMDDS.Core.Services;
using FMDDS.Data.Entities;
using Moq;

namespace Backend.Tests
{
    public class AuthServiceTests
    {
        [Fact]
        public void GenerateToken_ReturnsValidJwtString()
        {
            // Arrange
            var inMemorySettings = new Dictionary<string, string?>
            {
                {"JwtSettings:SecretKey", "VERY_LONG_SECRET_KEY_FOR_TESTING_PURPOSES_ONLY_12345"},
                {"JwtSettings:Issuer", "FMDDS_API"},
                {"JwtSettings:Audience", "FMDDS_CLIENTS"}
            };
            IConfiguration config = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var tokenService = new TokenService(config);

            var user = new User
            {
                UserID = 1,
                Username = "jmo_perera",
                FullName = "Dr. Perera",
                Email = "jmo@fmdds.lk",
                IsActive = true
            };
            var permissions = new List<string> { "case:create", "report:approve" };

            // Act
            string token = tokenService.GenerateToken(user, "Judicial Medical Officer", permissions);

            // Assert
            Assert.False(string.IsNullOrWhiteSpace(token));
            Assert.Contains(".", token); // Standard JWT format: header.payload.signature
        }

        [Theory]
        [InlineData("password123", true)]
        [InlineData("wrongpassword", false)]
        public void VerifyBcryptPassword_ValidatesCorrectly(string passwordInput, bool expectedResult)
        {
            // Arrange
            string passwordHash = BCrypt.Net.BCrypt.HashPassword("password123");

            // Act
            bool isValid = BCrypt.Net.BCrypt.Verify(passwordInput, passwordHash);

            // Assert
            Assert.Equal(expectedResult, isValid);
        }
    }
}
