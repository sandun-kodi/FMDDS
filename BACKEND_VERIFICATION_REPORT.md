# Forensic Medicine Department Database System (FMDDS) — Final Backend Security, Audit & Counter Backfill Verification Report

## Executive Summary

* **Project**: Forensic Medicine Department Database System (FMDDS)
* **Date**: 2026-07-23
* **Environment**: Development & Testing
* **Final Readiness Decision**: **READY FOR FRONTEND INTEGRATION — NOT YET PRODUCTION READY**

This report documents the completion and verification of all backend security, database-integrity, atomic concurrency, secret-management, and case-number counter backfill directives for the FMDDS backend. 

The backend has been verified locally, committed as a single clean commit ahead of `main` on the clean branch `backend-security-clean`, and pushed to `origin/backend-security-clean`. The original `pasan` workspace remained untouched.

---

## 1. Clean Branch & Workspace Review

### Clean Worktree State
* **Repository Worktree**: `%USERPROFILE%\Documents\GitHub\FMDDS-backend-security-clean`
* **Clean Branch**: `backend-security-clean`
* **Clean Commit**: One clean commit ahead of `origin/main`
* **Remote Ref**: `origin/backend-security-clean`
* **Working Tree**: Clean (0 uncommitted files)

### Key Modified and New Files in Clean Branch
* **Tracked Core Modifications**:
  * `Backend/Program.cs`: Fail-fast JWT validation; `Database.Migrate()` replacement for `EnsureCreated()`; startup seed protection (`EnsureUser()` creates missing users only, preserving existing `PasswordHash`, `FailedLoginCount`, `LockoutEnd`, and role mappings).
  * `Backend/src/api/controllers/AuthController.cs`: `[Authorize]` attribute on `POST /api/v1/auth/logout`; JTI-based token denylisting.
  * `Backend/src/api/controllers/CaseController.cs`: Refactored case registration call site.
  * `Backend/src/core/services/CaseService.cs`: Enforces strict Sri Lankan NIC validation; atomic PostgreSQL `CaseNumberCounters` sequence allocation.
  * `Backend/src/core/services/TokenDenylistService.cs`: Thread-safe `(jti, expirationTime)` denylist service.
  * `Backend/src/core/services/TokenService.cs`: Includes standard `jti` (JWT ID) claim in token generation.
  * `Backend/src/data/db/AppDbContext.cs`: Added `DbSet<CaseNumberCounter>`, configured composite primary key `(BranchCode, Year, CaseTypeCode)` and unique constraint `UQ_Case_CaseNumber`.
  * `tests/integration-tests.js` & `tests/smoke-test.js`: Configured dynamic `BACKEND_URL`; fixed NIC generation to 9-digit legacy format.
  * `tests/run-tests.js`: Portable test launcher enforcing `_test` database safety check, EF Core migrations, backend process management, Node integration tests, dual smoke test runs, and C# unit/integration test execution.
* **New Entities & Services**:
  * `Backend/src/data/entities/CaseNumberCounter.cs`: Entity for database sequence counter tracking.
  * `Backend/src/core/services/CaseCounterInitializer.cs`: Idempotent service for populating sequence counters from historical database cases.
  * `Backend/Migrations/20260722203432_AddCaseNumberCounterTable.cs`: EF Core migration creating `CaseNumberCounters` table with SQL backfill execution.
  * `Backend.Tests/RemediationTests.cs`: Automated unit tests verifying NIC validation rules, JTI token denylist, concurrent case sequence generation, and startup seed user preservation.
  * `Backend.Tests/PostgresConcurrencyTests.cs`: Real PostgreSQL integration concurrency test suite submitting 25 parallel case registration requests to `fmdds_test`.
  * `Backend.Tests/PostgresBackfillTests.cs`: Real PostgreSQL integration test suite covering historical counter backfill Scenarios A-F.

---

## 2. Historical Credential Exposure & Password Rotation

1. **Credential Sanitization**: Removed all real development, database, administrator, and production secrets from tracked files. Clearly labelled test-only values may remain where they are not used outside the Testing environment.
2. **`fmdds_app` Password Rotation**: Rotated `fmdds_app` password in PostgreSQL using interactive command input. Updated ASP.NET Core User Secrets (`dotnet user-secrets set "ConnectionStrings:DefaultConnection"`).
3. **`postgres` Superuser Password Rotation**: Rotated `postgres` administrator password away from `admin` using interactive command input.
4. **Seed Secret Rotation**: Replaced `SeedData:InitialPassword` in User Secrets with a cryptographically strong random value (replacing default development initial password).
5. **Credential Invalidation Verification**:
   * Previously exposed application credential A: **REJECTED** (`FATAL: password authentication failed for user "fmdds_app"`).
   * Previously exposed application credential B: **REJECTED** (`FATAL: password authentication failed for user "fmdds_app"`).
   * Rotated `fmdds_app` password connection attempt: **SUCCESS** (`SELECT 1;`).
6. **Zero Plaintext Secrets**: Confirmed zero real credentials, database passwords, administrator passwords, User Secrets values, or production signing keys exist in tracked files.
7. **Test-Only JWT Signing Key**: The test launcher (`tests/run-tests.js`) provides a clearly labelled fallback JWT signing key used strictly when `ASPNETCORE_ENVIRONMENT=Testing`. It can be overridden via the `TEST_JWT_SECRET` environment variable and MUST NEVER be reused in Development or Production environments.

---

## 3. Database Authentication (`pg_hba.conf`)

Verified active configuration in PostgreSQL data directory `pg_hba.conf`:

```text
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
local   replication     all                                     scram-sha-256
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             ::1/128                 scram-sha-256
```

* **Security Result**: Confirmed zero active `trust` rules exist in `pg_hba.conf`. All local and network client connections strictly enforce `scram-sha-256`.

---

## 4. Development User Seeding & Startup Preservation

1. **Environment Isolation**: User seeding in `Backend/Program.cs` `EnsureUser()` runs ONLY when `app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing")`.
2. **Preservation of Existing Users**: `EnsureUser()` inspects `if (u == null)` and creates missing users ONLY.
   * Existing `PasswordHash`, `FailedLoginCount`, `LockoutEnd`, and `UserRole` mappings are preserved across application restarts.
3. **Automated Verification**: Verified via `RemediationTests.EnsureUser_DoesNotOverwriteExistingUserPasswordOrLockoutStateOrRoles()` in `Backend.Tests/RemediationTests.cs`.

---

## 5. PostgreSQL Case-Number Counter Backfill Design & Migration

1. **Database Schema & Key Structure**: Counter primary key maps to `(BranchCode, Year, CaseTypeCode)`.
2. **PostgreSQL Atomic Strategy**: Implemented atomic upsert query in `Backend/src/core/services/CaseService.cs`:
   ```sql
   INSERT INTO "CaseNumberCounters" ("BranchCode", "Year", "CaseTypeCode", "NextSequence")
   VALUES (@p0, @p1, @p2, 1)
   ON CONFLICT ("BranchCode", "Year", "CaseTypeCode")
   DO UPDATE SET "NextSequence" = "CaseNumberCounters"."NextSequence" + 1
   RETURNING "NextSequence";
   ```
3. **Historical Counter Backfill**:
   * Migration `Backend/Migrations/20260722203432_AddCaseNumberCounterTable.cs` includes an idempotent PostgreSQL backfill query in `Up()`:
     ```sql
     INSERT INTO "CaseNumberCounters" ("BranchCode", "Year", "CaseTypeCode", "NextSequence")
     SELECT 
         split_part("CaseNumber", '/', 1) AS "BranchCode",
         CAST(split_part("CaseNumber", '/', 2) AS INTEGER) AS "Year",
         split_part("CaseNumber", '/', 3) AS "CaseTypeCode",
         MAX(CAST(split_part("CaseNumber", '/', 4) AS INTEGER)) AS "NextSequence"
     FROM "Case"
     WHERE "CaseNumber" ~ '^[A-Z]{3,5}/[0-9]{4}/[A-Z]{2}/[0-9]{4}$'
     GROUP BY 1, 2, 3
     ON CONFLICT ("BranchCode", "Year", "CaseTypeCode")
     DO UPDATE SET "NextSequence" = GREATEST("CaseNumberCounters"."NextSequence", EXCLUDED."NextSequence");
     ```
   * C# helper service `Backend/src/core/services/CaseCounterInitializer.cs` provides equivalent programmatic backfilling for EF Core InMemory and relational providers.
4. **Idempotency & Safety**:
   * Running backfill multiple times preserves highest counter values (`GREATEST(...)`) without creating duplicate rows or lowering values.
   * Existing cases are never modified, renumbered, or deleted.
   * Malformed historical case numbers are safely ignored using regex filtering (`^[A-Z]{3,5}/[0-9]{4}/[A-Z]{2}/[0-9]{4}$`).

---

## 6. Real PostgreSQL Backfill Integration Test Results (`Backend.Tests/PostgresBackfillTests.cs`)

All 6 backfill test scenarios executed against PostgreSQL `fmdds_test`:

* **Scenario A (Existing cases, missing counter)**: Seeded `0001`, `0002`, `0007`. Backfilled counter. Registered next case -> Generated `0008` (**PASSED**).
* **Scenario B (Counter already ahead)**: Seeded `0007`, manually set counter to `12`. Backfilled counter -> Value remained `12`. Registered next case -> Generated `0013` (**PASSED**).
* **Scenario C (Multiple case types)**: Seeded Clinical (`0005`) and Postmortem (`0010`). Backfilled counter -> Clinical generated `0006`, Postmortem generated `0011` independently (**PASSED**).
* **Scenario D (Multiple years)**: Seeded 2025 case `0050`. Backfilled counter -> 2025 counter set to `50` independently from 2026 (**PASSED**).
* **Scenario E (Idempotency)**: Executed backfill twice consecutively -> Zero duplicate counter rows, sequence values remained unchanged (**PASSED**).
* **Scenario F (Malformed historical case number)**: Seeded malformed record `MALFORMED/123/CASE`. Backfilled counter -> Migration executed without error, malformed record safely ignored, valid counters initialized cleanly (**PASSED**).

---

## 7. Real PostgreSQL Concurrency Test Results (`Backend.Tests/PostgresConcurrencyTests.cs`)

* **Test Suite**: `Backend.Tests/PostgresConcurrencyTests.cs`
* **Target Database**: `fmdds_test` (PostgreSQL)
* **Concurrent Load**: 25 concurrent case registration requests submitted simultaneously across parallel tasks.
* **Results**:
  1. **Returned Case Number Uniqueness**: `25 / 25` case numbers strictly unique (**PASSED**).
  2. **PostgreSQL Database Storage**: `25 / 25` records inserted cleanly with zero unique constraint violations (**PASSED**).
  3. **Sequence Monotonicity**: Sequential numeric portions incremented monotonically without missing or repeating values (**PASSED**).
  4. **Database Isolation**: `fmdds_db` remained 100% untouched (**PASSED**).

---

## 8. Portable Test Runner (`tests/run-tests.js`) & Execution Workflow

The automated test runner (`tests/run-tests.js`) was updated for cross-platform portability:
* Resolves `dotnet` dynamically via `process.env.DOTNET_EXE` or system `PATH` (no hardcoded machine paths).
* Invokes `dotnet ef database update` via `dotnet ef` CLI.
* Obtains connection string via `TEST_CONNECTION_STRING` or environment settings.
* Parses and asserts that target database ends with `_test`.
* Probes `/api/v1/health` until `200 OK`.
* Guarantees process termination in `finally` block with zero orphaned `dotnet` processes.

### Example Portable Test Execution Workflow (PowerShell)

```powershell
# Optional: Select user-installed .NET SDK if dotnet is not in system PATH
$env:DOTNET_ROOT = "$env:USERPROFILE\.dotnet"
$env:PATH = "$env:DOTNET_ROOT;$env:USERPROFILE\.dotnet\tools;$env:PATH"

# Configure test environment variables
$env:TEST_CONNECTION_STRING = "Host=localhost;Port=5432;Database=fmdds_test;Username=fmdds_app;Password=<password>"
$env:TEST_JWT_SECRET = "TEST_SUITE_JWT_SECRET_KEY_FOR_AUTOMATED_TESTS_2026!"

# Run full build, unit, integration, and smoke test suites
dotnet clean Backend\backend.csproj
dotnet restore Backend\backend.csproj
dotnet build Backend\backend.csproj --configuration Release
dotnet test Backend.Tests\Backend.Tests.csproj --configuration Release
node tests/run-tests.js
```

### Execution Summary

| Test Suite | Execution Command | Total Tests | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Integration Regression Suite** | `node tests/integration-tests.js` | 4 | 4 | 0 | **PASSED** |
| **End-to-End Smoke Test (Run 1)** | `node tests/smoke-test.js` | 6 | 6 | 0 | **PASSED** |
| **End-to-End Smoke Test (Run 2)** | `node tests/smoke-test.js` | 6 | 6 | 0 | **PASSED** |
| **Unit, Backfill & Concurrency Suite** | `dotnet test Backend.Tests\Backend.Tests.csproj` | 30 | 30 | 0 | **PASSED** |

---

## 9. Git Branch History & Merging Strategy

* **Clean Branch**: `backend-security-clean` created directly from `main`.
* **Clean History**: Contains exactly 1 clean commit ahead of `main` containing all sanitized backend remediation work.
* **Dirty Workspace Preservation**: The original `pasan` workspace (`%USERPROFILE%\Documents\GitHub\FMDDS`) was preserved completely untouched.
* **`pasan` Branch Invalidation**: The original `pasan` branch contains an exposed database credential in its historical commit diff (`01a5959`) and **MUST NOT** be merged into `main`.

---

## 10. Remaining Production Limitations

1. **In-Memory JWT Denylist**: `TokenDenylistService` is an in-memory singleton suitable for single-instance development/testing. Production deployments across multi-node clusters require backing by a distributed key-value cache (e.g., Redis).
2. **Production Key Vault Injection**: Secrets in production environment must be injected via environment variables or secret vaults (e.g. Azure Key Vault / AWS Secrets Manager).

---

## 11. Final Clean Worktree Status (`git status --short`)

```text
Working tree clean (0 uncommitted files)
Branch: backend-security-clean
Commit: One clean commit ahead of origin/main
```

---

## 12. Final Readiness Classifications

```text
Dirty pasan workspace:
PRESERVED — NOT MODIFIED

Clean backend branch:
SANITIZED AND VERIFIED

Pull request:
READY TO CREATE AS DRAFT

Frontend integration:
READY FOR REVIEW — NOT YET PRODUCTION READY
```
