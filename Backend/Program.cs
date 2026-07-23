using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FMDDS.Data.Db;
using FMDDS.Data.Repositories;
using FMDDS.Core.Services;
using FMDDS.API.Middlewares;
using Microsoft.AspNetCore.Authorization;
using FMDDS.Data.Entities;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// 1. Configure PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<ICaseRepository, CaseRepository>();

// 3. Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<CaseService>();
builder.Services.AddScoped<ClinicalExamService>();
builder.Services.AddScoped<PostmortemExamService>();
builder.Services.AddScoped<LaboratoryService>();
builder.Services.AddScoped<EvidenceService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<AdminService>();

builder.Services.AddSingleton<ITokenDenylistService, TokenDenylistService>();

// 4. Fail-Fast JWT Validation & Authentication Setup
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

if (string.IsNullOrWhiteSpace(secretKey) ||
    secretKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) ||
    secretKey.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
    secretKey.Length < 32)
{
    throw new InvalidOperationException("FATAL: JwtSettings:SecretKey must be configured in User Secrets or Environment Variables and be at least 32 characters long.");
}

if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
{
    throw new InvalidOperationException("FATAL: JwtSettings:Issuer and JwtSettings:Audience must be configured in application settings.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                var denylist = context.HttpContext.RequestServices.GetRequiredService<ITokenDenylistService>();
                var jtiClaim = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (!string.IsNullOrEmpty(jtiClaim) && denylist.IsRevoked(jtiClaim))
                {
                    context.Fail("Token has been revoked.");
                }
                return Task.CompletedTask;
            }
        };
    });

// 5. Authorization
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();

// Configure CORS for Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen(c =>
{
    var securityScheme = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Reference = new Microsoft.OpenApi.Models.OpenApiReference
        {
            Id = "Bearer",
            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme
        }
    };
    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        { securityScheme, new string[] { } }
    });
});

var app = builder.Build();

// Global Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// Database Schema Migrations and Seed Logic (Development & Testing Environments Only)
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // EF Core Migrations (No EnsureCreated!)
        try
        {
            context.Database.Migrate();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration Info: {ex.Message}");
        }

        // 1. Seed Roles
        if (!context.Roles.Any())
        {
            context.Roles.AddRange(
                new Role { RoleName = "System Administrator", Description = "Full system access" },
                new Role { RoleName = "Judicial Medical Officer", Description = "Senior forensic officer" },
                new Role { RoleName = "Medical Officer", Description = "Clinical examinations" },
                new Role { RoleName = "Laboratory Staff", Description = "Lab result entry" },
                new Role { RoleName = "Clerical Staff", Description = "Case registration and admin" }
            );
            context.SaveChanges();
        }

        var adminRole  = context.Roles.First(r => r.RoleName == "System Administrator");
        var jmoRole    = context.Roles.First(r => r.RoleName == "Judicial Medical Officer");
        var moRole     = context.Roles.First(r => r.RoleName == "Medical Officer");
        var labRole    = context.Roles.First(r => r.RoleName == "Laboratory Staff");
        var clerkRole  = context.Roles.First(r => r.RoleName == "Clerical Staff");

        // 2. Seed Permissions
        if (!context.Permissions.Any())
        {
            context.Permissions.AddRange(
                new Permission { PermissionKey = "user:manage",              Description = "Manage users" },
                new Permission { PermissionKey = "admin:audit",              Description = "View audit logs" },
                new Permission { PermissionKey = "admin:stats",              Description = "View system statistics" },
                new Permission { PermissionKey = "case:create",              Description = "Create cases" },
                new Permission { PermissionKey = "case:view_all",            Description = "View all cases" },
                new Permission { PermissionKey = "case:edit",                Description = "Edit cases" },
                new Permission { PermissionKey = "exam:record_clinical",     Description = "Record clinical exams" },
                new Permission { PermissionKey = "exam:record_postmortem",   Description = "Record postmortem exams" },
                new Permission { PermissionKey = "lab:request",              Description = "Request lab tests" },
                new Permission { PermissionKey = "lab:result_write",         Description = "Write lab results" },
                new Permission { PermissionKey = "evidence:manage",          Description = "Manage evidence" },
                new Permission { PermissionKey = "report:approve",           Description = "Approve reports" },
                new Permission { PermissionKey = "report:print",             Description = "Print reports" }
            );
            context.SaveChanges();
        }

        // 3. Seed RolePermissions
        if (!context.RolePermissions.Any())
        {
            Permission P(string key) => context.Permissions.First(p => p.PermissionKey == key);

            // System Administrator
            context.RolePermissions.AddRange(
                new RolePermission { RoleID = adminRole.RoleID, PermissionID = P("user:manage").PermissionID },
                new RolePermission { RoleID = adminRole.RoleID, PermissionID = P("admin:audit").PermissionID },
                new RolePermission { RoleID = adminRole.RoleID, PermissionID = P("admin:stats").PermissionID },
                new RolePermission { RoleID = adminRole.RoleID, PermissionID = P("case:view_all").PermissionID }
            );
            // Judicial Medical Officer
            context.RolePermissions.AddRange(
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("case:create").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("case:view_all").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("case:edit").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("exam:record_clinical").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("exam:record_postmortem").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("lab:request").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("evidence:manage").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("report:approve").PermissionID },
                new RolePermission { RoleID = jmoRole.RoleID, PermissionID = P("report:print").PermissionID }
            );
            // Medical Officer
            context.RolePermissions.AddRange(
                new RolePermission { RoleID = moRole.RoleID, PermissionID = P("case:view_all").PermissionID },
                new RolePermission { RoleID = moRole.RoleID, PermissionID = P("exam:record_clinical").PermissionID },
                new RolePermission { RoleID = moRole.RoleID, PermissionID = P("lab:request").PermissionID },
                new RolePermission { RoleID = moRole.RoleID, PermissionID = P("report:print").PermissionID }
            );
            // Laboratory Staff
            context.RolePermissions.AddRange(
                new RolePermission { RoleID = labRole.RoleID, PermissionID = P("case:view_all").PermissionID },
                new RolePermission { RoleID = labRole.RoleID, PermissionID = P("lab:result_write").PermissionID }
            );
            // Clerical Staff
            context.RolePermissions.AddRange(
                new RolePermission { RoleID = clerkRole.RoleID, PermissionID = P("case:create").PermissionID },
                new RolePermission { RoleID = clerkRole.RoleID, PermissionID = P("case:view_all").PermissionID },
                new RolePermission { RoleID = clerkRole.RoleID, PermissionID = P("case:edit").PermissionID },
                new RolePermission { RoleID = clerkRole.RoleID, PermissionID = P("report:print").PermissionID }
            );
            context.SaveChanges();
        }

        // 4. Seed Users (Safe Seeding: Creates MISSING development users only; NEVER resets existing password hash, FailedLoginCount, or LockoutEnd)
        string initPassword = builder.Configuration["SeedData:InitialPassword"]
                              ?? builder.Configuration["DEV_INITIAL_PASSWORD"]
                              ?? "password123";
        string initialHash = BCrypt.Net.BCrypt.HashPassword(initPassword);

        User EnsureUser(string username, string fullName, string email)
        {
            var u = context.Users.FirstOrDefault(x => x.Username == username);
            if (u == null)
            {
                u = new User
                {
                    Username = username,
                    FullName = fullName,
                    Email = email,
                    PasswordHash = initialHash,
                    IsActive = true,
                    FailedLoginCount = 0,
                    LockoutEnd = null
                };
                context.Users.Add(u);
            }
            return u;
        }
        var uAdmin = EnsureUser("admin",            "System Admin",           "admin@fmdds.lk");
        var uJmo   = EnsureUser("jmo_perera",       "Dr. Perera (JMO)",       "jmo@fmdds.lk");
        var uMo    = EnsureUser("mo_silva",         "Dr. Silva (MO)",         "mo@fmdds.lk");
        var uLab   = EnsureUser("lab_fernando",     "Mr. Fernando (Lab)",     "lab@fmdds.lk");
        var uClerk = EnsureUser("clerk_jayasuriya", "Mrs. Jayasuriya (Clerk)","clerk@fmdds.lk");
        context.SaveChanges();

        // 5. Seed UserRoles
        if (!context.UserRoles.Any())
        {
            context.UserRoles.AddRange(
                new UserRole { UserID = uAdmin.UserID, RoleID = adminRole.RoleID },
                new UserRole { UserID = uJmo.UserID,   RoleID = jmoRole.RoleID   },
                new UserRole { UserID = uMo.UserID,    RoleID = moRole.RoleID    },
                new UserRole { UserID = uLab.UserID,   RoleID = labRole.RoleID   },
                new UserRole { UserID = uClerk.UserID, RoleID = clerkRole.RoleID }
            );
            context.SaveChanges();
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
