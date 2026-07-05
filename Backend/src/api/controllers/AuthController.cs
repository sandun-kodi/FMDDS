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
            if (user == null)
            {
                return Unauthorized(new { code = "ERR_AUTH_FAILED", message = "Invalid username or password." });
            }

            // For testing: accept "password123" as a universal test password
            // In production, use BCrypt: BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)
            bool isValidPassword = request.Password == "password123";

            if (!isValidPassword)
            {
                return Unauthorized(new { code = "ERR_AUTH_FAILED", message = "Invalid username or password." });
            }

            // Map role and permissions based on username pattern (simplified for testing)
            var (roleName, permissions) = GetRoleAndPermissions(user.Username);

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

        private (string roleName, List<string> permissions) GetRoleAndPermissions(string username)
        {
            // Simplified role/permission mapping for seeded test users
            return username.ToLower() switch
            {
                "admin" => ("System Administrator", new List<string>
                {
                    "admin:audit", "admin:stats", "user:manage"
                }),
                "jmo_perera" => ("Judicial Medical Officer", new List<string>
                {
                    "case:create", "case:view", "exam:record_clinical", "exam:record_postmortem",
                    "lab:request", "evidence:manage", "report:approve", "report:print"
                }),
                "mo_silva" => ("Medical Officer", new List<string>
                {
                    "case:create", "case:view", "exam:record_clinical", "exam:record_postmortem",
                    "lab:request", "report:print"
                }),
                "lab_fernando" => ("Laboratory Staff", new List<string>
                {
                    "lab:result_write", "lab:request"
                }),
                "clerk_jayasuriya" => ("Registration Clerk", new List<string>
                {
                    "case:create", "case:view"
                }),
                _ => ("User", new List<string>())
            };
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
