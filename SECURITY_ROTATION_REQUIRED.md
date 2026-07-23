# Critical Security Credential Rotation Required

This document details mandatory security rotation steps for the FMDDS environment following credential remediation.

---

## 1. Exposed Credentials Requiring Rotation

The following credential items were previously committed, logged, or exposed in shell execution history and MUST be treated as compromised:

1. **PostgreSQL Superuser (`postgres`) Password**: Exposed in shell transcripts.
2. **JWT Signing Key**: Hardcoded development secrets previously committed to `appsettings.json`.
3. **Initial User Seed Password**: Static fallback seed password (`password123`).
4. **Active JWT Session Tokens**: Tokens issued using the former committed JWT secret.

> [!NOTE]
> The custom database role `fmdds_app` has been removed from local database setup in favor of standardizing local development on each developer's local `postgres` user.

---

## 2. Interactive PostgreSQL Superuser Password Rotation Procedure

To avoid recording the superuser password in shell history files (`ConsoleHost_history.txt`), execute the rotation interactively using `psql` password prompts:

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

### Step C: Local User Secrets Configuration
Set the local development connection string using ASP.NET Core User Secrets (with your rotated local `postgres` password):

```powershell
$dotnet = "$env:USERPROFILE\.dotnet\dotnet.exe"

& $dotnet user-secrets set `
  "ConnectionStrings:DefaultConnection" `
  "Host=localhost;Port=5432;Database=fmdds_db;Username=postgres;Password=<YOUR_LOCAL_POSTGRES_PASSWORD>" `
  --project .\Backend\backend.csproj
```

---

## 3. JWT Key and Initial Seed Password Configuration

```powershell
$dotnet = "$env:USERPROFILE\.dotnet\dotnet.exe"

& $dotnet user-secrets set `
  "JwtSettings:SecretKey" `
  "<GENERATE_RANDOM_32_BYTE_STRING>" `
  --project .\Backend\backend.csproj

& $dotnet user-secrets set `
  "SeedData:InitialPassword" `
  "<GENERATE_SECURE_INITIAL_SEED_PASSWORD>" `
  --project .\Backend\backend.csproj
```
