# FMDDS Developer Setup Guide

This guide details local environment setup, user secret configuration, database initialization, and automated testing instructions for the Forensic Medicine Department Database System (FMDDS).

---

## 1. Local Environment Configuration (ASP.NET Core User Secrets)

For local development, sensitive settings (database connection strings, JWT signing keys, and initial seed passwords) **must** be stored securely in ASP.NET Core User Secrets rather than tracked configuration files like `appsettings.json`.

Local developers use:
- **Database**: `fmdds_db`
- **Username**: `postgres`
- **Password**: Each developer's own local PostgreSQL password

Execute the following PowerShell commands from the repository root:

```powershell
$dotnet = "$env:USERPROFILE\.dotnet\dotnet.exe"

# 1. Set Local Application Database Connection String (Using local postgres user)
& $dotnet user-secrets set `
  "ConnectionStrings:DefaultConnection" `
  "Host=localhost;Port=5432;Database=fmdds_db;Username=postgres;Password=<YOUR_LOCAL_POSTGRES_PASSWORD>" `
  --project .\Backend\backend.csproj

# 2. Set Local Cryptographically Random JWT Secret (Minimum 32 Characters)
& $dotnet user-secrets set `
  "JwtSettings:SecretKey" `
  "<GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_BYTES>" `
  --project .\Backend\backend.csproj

# 3. Set Local Initial Seed User Password
& $dotnet user-secrets set `
  "SeedData:InitialPassword" `
  "<LOCAL_INITIAL_PASSWORD>" `
  --project .\Backend\backend.csproj
```

### Local Database & Seeding Information:
* **GitHub Code vs. Database Rows**: GitHub transfers source code and EF Core migrations, but does **not** transfer PostgreSQL database rows. Each teammate must create or migrate their own local `fmdds_db` database.
* **Automatic Seeding**: The backend database seeding code creates missing application roles, permissions, and initial seeded users when the application starts up.
* **Preserving Existing Accounts**: Existing seeded application users must not have their passwords or lockout state reset on every startup.
* **Database User vs Application Users**: The database login user (`postgres`) authenticates the backend to PostgreSQL. Seeded application users (`admin`, `jmo_perera`, `mo_silva`, `lab_fernando`, `clerk_jayasuriya`) authenticate people to the FMDDS web application.

---

## 2. Automated Isolated Testing Environment

Automated tests execute against an isolated test database (`fmdds_test`) using a dedicated non-superuser test role (`fmdds_test_runner`).

### Step A: Initialize Local Test Role & Database
Refer to `tests/setup-test-database.example.sql` for the SQL template to create `fmdds_test_runner` and `fmdds_test`.

### Step B: Execute Automated Test Suite
Run the test runner with the test connection string provided via shell environment:

```powershell
$env:TEST_CONNECTION_STRING = "Host=localhost;Port=5432;Database=fmdds_test;Username=fmdds_test_runner;Password=<LOCAL_TEST_PASSWORD>"

node tests/run-tests.js
```

### Secret Regression Scan:
```powershell
node tests/secret-scan.js
```
