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

// 4. Authentication (JWT)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "a_very_long_secret_key_that_needs_to_be_secure";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

// 5. Authorization
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

builder.Services.AddControllers();
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
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Please insert JWT with Bearer into field",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement {
    {
        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Reference = new Microsoft.OpenApi.Models.OpenApiReference
            {
                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        new string[] { }
    }});
});

var app = builder.Build();

// Initialize and Seed Database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // context.Database.Migrate(); // Optional: Automatically apply migrations if needed

    // 1. Seed Roles if empty
    Role adminRole = null, jmoRole = null, moRole = null, forensicRole = null, labRole = null, clerkRole = null;
    if (!context.Roles.Any())
    {
        adminRole = new Role { RoleName = "System Administrator", Description = "Manages users, permissions, backups, and configurations" };
        jmoRole = new Role { RoleName = "Judicial Medical Officer", Description = "Performs examinations, postmortems, and approves final reports" };
        moRole = new Role { RoleName = "Medical Officer", Description = "Assists JMO, conducts clinical examinations, and drafts reports" };
        forensicRole = new Role { RoleName = "Forensic Officer", Description = "Manages case registration, evidence logging, and custody logs" };
        labRole = new Role { RoleName = "Laboratory Staff", Description = "Receives test requests and records laboratory investigation results" };
        clerkRole = new Role { RoleName = "Clerical Staff", Description = "Enters patient/case demographics and tracks report issuance" };

        context.Roles.AddRange(adminRole, jmoRole, moRole, forensicRole, labRole, clerkRole);
        context.SaveChanges();
    }
    else
    {
        adminRole = context.Roles.FirstOrDefault(r => r.RoleName == "System Administrator");
        jmoRole = context.Roles.FirstOrDefault(r => r.RoleName == "Judicial Medical Officer");
        moRole = context.Roles.FirstOrDefault(r => r.RoleName == "Medical Officer");
        forensicRole = context.Roles.FirstOrDefault(r => r.RoleName == "Forensic Officer");
        labRole = context.Roles.FirstOrDefault(r => r.RoleName == "Laboratory Staff");
        clerkRole = context.Roles.FirstOrDefault(r => r.RoleName == "Clerical Staff");
    }

    // 2. Seed Permissions if empty
    Permission userManagePerm = null, caseCreatePerm = null, caseViewAllPerm = null, caseViewRestrictedPerm = null,
               caseEditPerm = null, examClinicalPerm = null, examPostmortemPerm = null, evidenceManagePerm = null,
               labRequestPerm = null, labResultWritePerm = null, reportApprovePerm = null, reportPrintPerm = null,
               auditViewPerm = null;

    if (!context.Permissions.Any())
    {
        userManagePerm = new Permission { PermissionKey = "user:manage", Description = "Create, update, and deactivate user accounts" };
        caseCreatePerm = new Permission { PermissionKey = "case:create", Description = "Create new case files and register patients" };
        caseViewAllPerm = new Permission { PermissionKey = "case:view_all", Description = "View case files and details across the department" };
        caseViewRestrictedPerm = new Permission { PermissionKey = "case:view_restricted", Description = "View basic case metadata without medical details" };
        caseEditPerm = new Permission { PermissionKey = "case:edit", Description = "Modify general case info and demographics" };
        examClinicalPerm = new Permission { PermissionKey = "exam:record_clinical", Description = "Record and save living patient examinations" };
        examPostmortemPerm = new Permission { PermissionKey = "exam:record_postmortem", Description = "Record and save autopsy findings and cause of death" };
        evidenceManagePerm = new Permission { PermissionKey = "evidence:manage", Description = "Register evidence and transfer custody" };
        labRequestPerm = new Permission { PermissionKey = "lab:request", Description = "Create laboratory investigation requests" };
        labResultWritePerm = new Permission { PermissionKey = "lab:result_write", Description = "Enter laboratory test results" };
        reportApprovePerm = new Permission { PermissionKey = "report:approve", Description = "Approve and lock medico-legal reports" };
        reportPrintPerm = new Permission { PermissionKey = "report:print", Description = "Print and export reports" };
        auditViewPerm = new Permission { PermissionKey = "audit:view", Description = "Access administrative audit trail logs" };

        context.Permissions.AddRange(
            userManagePerm, caseCreatePerm, caseViewAllPerm, caseViewRestrictedPerm, caseEditPerm,
            examClinicalPerm, examPostmortemPerm, evidenceManagePerm, labRequestPerm, labResultWritePerm,
            reportApprovePerm, reportPrintPerm, auditViewPerm
        );
        context.SaveChanges();
    }
    else
    {
        userManagePerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "user:manage");
        caseCreatePerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "case:create");
        caseViewAllPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "case:view_all");
        caseViewRestrictedPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "case:view_restricted");
        caseEditPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "case:edit");
        examClinicalPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "exam:record_clinical");
        examPostmortemPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "exam:record_postmortem");
        evidenceManagePerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "evidence:manage");
        labRequestPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "lab:request");
        labResultWritePerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "lab:result_write");
        reportApprovePerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "report:approve");
        reportPrintPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "report:print");
        auditViewPerm = context.Permissions.FirstOrDefault(p => p.PermissionKey == "audit:view");
    }

    // 3. Seed Role-Permissions if empty
    if (!context.RolePermissions.Any())
    {
        // Admin
        context.RolePermissions.AddRange(
            new RolePermission { RoleID = adminRole.RoleID, PermissionID = userManagePerm.PermissionID },
            new RolePermission { RoleID = adminRole.RoleID, PermissionID = caseViewAllPerm.PermissionID },
            new RolePermission { RoleID = adminRole.RoleID, PermissionID = auditViewPerm.PermissionID }
        );

        // JMO
        context.RolePermissions.AddRange(
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = caseCreatePerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = caseViewAllPerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = caseEditPerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = examClinicalPerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = examPostmortemPerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = labRequestPerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = reportApprovePerm.PermissionID },
            new RolePermission { RoleID = jmoRole.RoleID, PermissionID = reportPrintPerm.PermissionID }
        );

        // MO
        context.RolePermissions.AddRange(
            new RolePermission { RoleID = moRole.RoleID, PermissionID = caseViewAllPerm.PermissionID },
            new RolePermission { RoleID = moRole.RoleID, PermissionID = examClinicalPerm.PermissionID },
            new RolePermission { RoleID = moRole.RoleID, PermissionID = labRequestPerm.PermissionID },
            new RolePermission { RoleID = moRole.RoleID, PermissionID = reportPrintPerm.PermissionID }
        );

        // Laboratory Staff
        context.RolePermissions.AddRange(
            new RolePermission { RoleID = labRole.RoleID, PermissionID = caseViewAllPerm.PermissionID },
            new RolePermission { RoleID = labRole.RoleID, PermissionID = labResultWritePerm.PermissionID }
        );

        // Clerical Staff
        context.RolePermissions.AddRange(
            new RolePermission { RoleID = clerkRole.RoleID, PermissionID = caseCreatePerm.PermissionID },
            new RolePermission { RoleID = clerkRole.RoleID, PermissionID = caseViewAllPerm.PermissionID },
            new RolePermission { RoleID = clerkRole.RoleID, PermissionID = caseEditPerm.PermissionID },
            new RolePermission { RoleID = clerkRole.RoleID, PermissionID = reportPrintPerm.PermissionID }
        );

        context.SaveChanges();
    }

    // 4. Seed Users and link UserRoles
    var admin = context.Users.FirstOrDefault(u => u.Username == "admin");
    var jmo = context.Users.FirstOrDefault(u => u.Username == "jmo_perera");
    var mo = context.Users.FirstOrDefault(u => u.Username == "mo_silva");
    var lab = context.Users.FirstOrDefault(u => u.Username == "lab_fernando");
    var clerk = context.Users.FirstOrDefault(u => u.Username == "clerk_jayasuriya");

    if (admin == null)
    {
        admin = new User { Username = "admin", FullName = "System Admin", PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y", IsActive = true };
        context.Users.Add(admin);
    }
    else
    {
        admin.PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y";
        admin.IsActive = true;
    }

    if (jmo == null)
    {
        jmo = new User { Username = "jmo_perera", FullName = "Dr. Perera (JMO)", PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y", IsActive = true };
        context.Users.Add(jmo);
    }
    else
    {
        jmo.PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y";
        jmo.IsActive = true;
    }

    if (mo == null)
    {
        mo = new User { Username = "mo_silva", FullName = "Dr. Silva (MO)", PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y", IsActive = true };
        context.Users.Add(mo);
    }
    else
    {
        mo.PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y";
        mo.IsActive = true;
    }

    if (lab == null)
    {
        lab = new User { Username = "lab_fernando", FullName = "Mr. Fernando (Lab)", PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y", IsActive = true };
        context.Users.Add(lab);
    }
    else
    {
        lab.PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y";
        lab.IsActive = true;
    }

    if (clerk == null)
    {
        clerk = new User { Username = "clerk_jayasuriya", FullName = "Mrs. Jayasuriya (Clerk)", PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y", IsActive = true };
        context.Users.Add(clerk);
    }
    else
    {
        clerk.PasswordHash = "$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y";
        clerk.IsActive = true;
    }

    context.SaveChanges();

    // 5. Connect Users to Roles if UserRoles is empty
    if (!context.UserRoles.Any())
    {
        context.UserRoles.AddRange(
            new UserRole { UserID = admin.UserID, RoleID = adminRole.RoleID },
            new UserRole { UserID = jmo.UserID, RoleID = jmoRole.RoleID },
            new UserRole { UserID = mo.UserID, RoleID = moRole.RoleID },
            new UserRole { UserID = lab.UserID, RoleID = labRole.RoleID },
            new UserRole { UserID = clerk.UserID, RoleID = clerkRole.RoleID }
        );
        context.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
