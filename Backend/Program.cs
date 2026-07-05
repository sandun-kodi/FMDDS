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
    
    if (!context.Users.Any())
    {
        // Add test users matching the roles specified in AuthController
        context.Users.AddRange(
            new User { Username = "admin", FullName = "System Admin" },
            new User { Username = "jmo_perera", FullName = "Dr. Perera (JMO)" },
            new User { Username = "mo_silva", FullName = "Dr. Silva (MO)" },
            new User { Username = "lab_fernando", FullName = "Mr. Fernando (Lab)" },
            new User { Username = "clerk_jayasuriya", FullName = "Mrs. Jayasuriya (Clerk)" }
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
