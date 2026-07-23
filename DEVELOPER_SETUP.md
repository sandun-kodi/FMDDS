# FMDDS Developer Setup Guide

This guide details local environment setup, user secret configuration, database initialization, and automated testing instructions for the Forensic Medicine Department Database System (FMDDS).

---

## 1. Local Environment Configuration (ASP.NET Core User Secrets)

For local development, sensitive settings (database connection strings, JWT signing keys, and initial seed passwords) **must** be stored securely in ASP.NET Core User Secrets rather than tracked configuration files like `appsettings.json`.

Execute the following PowerShell commands from the repository root:

```powershell
$dotnet = "$env:USERPROFILE\.dotnet\dotnet.exe"

# 1. Set Local Application Database Connection String
& $dotnet user-secrets set `
  "ConnectionStrings:DefaultConnection" `
  "Host=localhost;Port=5432;Database=fmdds_db;Username=fmdds_app;Password=<LOCAL_FMDDS_APP_PASSWORD>" `
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

### Security Rules:
* **Never commit User Secrets** or real connection strings to Git.
* **Never use the PostgreSQL `postgres` superuser** for application connectivity. The application must connect using the dedicated `fmdds_app` database role.
* **Never use fixed seeded passwords** outside a disposable local development environment.
* **Change initial seeded account passwords** after first login.

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
