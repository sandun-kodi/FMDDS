using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using FMDDS.Data.Entities;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Service to construct and sign secure JWT Bearer tokens for FMDDS clients.
    /// Tags: #backend #security
    /// </summary>
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user, string roleName, IEnumerable<string> permissions)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            var secretKey = _config["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is required.");
            var key = Encoding.UTF8.GetBytes(secretKey);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("username", user.Username),
                new Claim(ClaimTypes.Role, roleName)
            };

            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permissions", permission));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _config["JwtSettings:Issuer"] ?? "FMDDS_API",
                Audience = _config["JwtSettings:Audience"] ?? "FMDDS_CLIENTS",
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
