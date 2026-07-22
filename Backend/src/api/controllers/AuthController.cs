using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using FMDDS.Core.Services;

namespace FMDDS.API.Controllers
{
    /// <summary>
    /// API Controller exposing authentication and session endpoints.
    /// Tags: #backend #security
    /// </summary>
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly ITokenService _tokenService;
        private readonly ITokenDenylistService _denylistService;

        public AuthController(AppDbContext dbContext, ITokenService tokenService, ITokenDenylistService denylistService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
            _denylistService = denylistService;
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
                return Unauthorized(new { code = "ERR_AUTH_FAILED", message = "Invalid username or password." });
            }

            // Check Lockout
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
            {
                return StatusCode(423, new { code = "ERR_ACCOUNT_LOCKED", message = "Account locked due to too many failed attempts. Please try again later." });
            }

            // Verify Password using BCrypt hash check with test credential fallback
            bool isValidPassword = false;
            try
            {
                if (!string.IsNullOrEmpty(user.PasswordHash))
                {
                    isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                }
            }
            catch (Exception)
            {
                isValidPassword = false;
            }


            var attempt = new LoginAttempt
            {
                Username = request.Username,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                AttemptDate = DateTime.UtcNow,
                IsSuccess = isValidPassword
            };
            _dbContext.LoginAttempts.Add(attempt);

            if (!isValidPassword)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= 5)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                }
                await _dbContext.SaveChangesAsync();
                return Unauthorized(new { code = "ERR_AUTH_FAILED", message = "Invalid username or password." });
            }

            // Reset lockout counters on success
            user.FailedLoginCount = 0;
            user.LockoutEnd = null;
            await _dbContext.SaveChangesAsync();

            // Load role and permissions dynamically from the database
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

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            var jti = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
            if (!string.IsNullOrWhiteSpace(jti))
            {
                _denylistService.RevokeToken(jti);
            }
            return Ok(new { message = "Logout successful. Token invalidated." });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
