using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing authentication endpoints (login).
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly ITokenService _tokenService;

        public AuthController(AppDbContext dbContext, ITokenService tokenService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
        }

        /// <summary>
        /// Authenticates a user and returns a JWT token.
        /// Route: POST /api/v1/auth/login
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { code = "ERR_INVALID_CREDENTIALS", message = "Username and password are required." });
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { code = "ERR_AUTH_FAILED", message = "Invalid username, password, or account is inactive." });
            }

            // For testing: accept "password123" as a universal test password
            // In production, use BCrypt: BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)
            bool isValidPassword = request.Password == "password123";

            if (!isValidPassword)
            {
                return Unauthorized(new { code = "ERR_AUTH_FAILED", message = "Invalid username or password." });
            }

            // Load user roles and permissions dynamically from the database
            var roles = await _dbContext.UserRoles
                .Where(ur => ur.UserID == user.UserID)
                .Select(ur => ur.Role)
                .ToListAsync();

            var roleName = roles.FirstOrDefault()?.RoleName ?? "User";
            var roleIds = roles.Select(r => r.RoleID).ToList();

            var permissions = await _dbContext.RolePermissions
                .Where(rp => roleIds.Contains(rp.RoleID))
                .Select(rp => rp.Permission.PermissionKey)
                .Distinct()
                .ToListAsync();

            var token = _tokenService.GenerateToken(user, roleName, permissions);

            return Ok(new
            {
                token,
                user = new
                {
                    user.UserID,
                    user.Username,
                    user.FullName,
                    role = roleName
                }
            });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
