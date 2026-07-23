# Critical Security Credential Rotation Required

This document details mandatory security rotation steps for the FMDDS environment following credential remediation.

---

## 1. Exposed Credentials Requiring Rotation

The following credential items were previously committed, logged, or exposed in shell execution history and MUST be treated as compromised:

1. **PostgreSQL Superuser (`postgres`) Password**: Exposed in shell transcripts.
2. **Application Database Role (`fmdds_app`) Password**: Exposed in plain text configuration files.
3. **JWT Signing Key**: Hardcoded development secrets previously committed to `appsettings.json`.
4. **Initial User Seed Password**: Static fallback seed password (`password123`).
5. **Active JWT Session Tokens**: Tokens issued using the former committed JWT secret.

---

## 2. Interactive PostgreSQL Superuser Password Rotation Procedure

To avoid recording the new superuser password in shell history files (`ConsoleHost_history.txt`), execute the rotation interactively using `psql` password prompts:

### Step A: Connect Interactively
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -h localhost
```

### Step B: Change Password via Interactive Prompt
Inside the `psql` interactive console, execute:
```sql
\password postgres
```

* `psql` will prompt for the new password twice without displaying characters on screen.
* **Do NOT** execute `ALTER ROLE postgres WITH PASSWORD 'literal_secret'` directly in shell scripts.

### Step C: Secure Storage
Store the newly created `postgres` superuser password strictly in an encrypted password manager.  
**Do NOT** place the `postgres` superuser credentials in ASP.NET Core User Secrets or application configuration files. The application backend must connect using the dedicated `fmdds_app` role.

---

## 3. Application Database Role (`fmdds_app`) Configuration

Set the rotated `fmdds_app` connection string locally using ASP.NET Core User Secrets:

```powershell
$dotnet = "$env:USERPROFILE\.dotnet\dotnet.exe"

& $dotnet user-secrets set `
  "ConnectionStrings:DefaultConnection" `
  "Host=localhost;Port=5432;Database=fmdds_db;Username=fmdds_app;Password=<LOCAL_FMDDS_APP_PASSWORD>" `
  --project .\Backend\backend.csproj
```

---

## 4. JWT Key and Initial Seed Password Configuration

```powershell
& $dotnet user-secrets set `
  "JwtSettings:SecretKey" `
  "<GENERATE_RANDOM_32_BYTE_STRING>" `
  --project .\Backend\backend.csproj

& $dotnet user-secrets set `
  "SeedData:InitialPassword" `
  "<GENERATE_SECURE_INITIAL_SEED_PASSWORD>" `
  --project .\Backend\backend.csproj
```
