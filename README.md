# Forensic Medicine Department Database System (FMDDS)

A secure, centralized web application for managing forensic medicine department operations — including patient registration, medico-legal case management, autopsy records, laboratory investigations, evidence tracking, and report generation.

---

## Features

- **Patient Registration** — Register patients with demographic and identification details (NIC validation included).
- **Medico-Legal Case Management** — Create and manage clinical and postmortem cases with auto-generated case numbers.
- **Clinical & Postmortem Examination** — Record detailed examination findings with structured forms and file attachments.
- **Laboratory Module** — Submit lab investigation requests and record results.
- **Evidence Management** — Track physical evidence items with custody chain records.
- **Report Generation** — Generate and approve medico-legal reports (PDF-ready).
- **Role-Based Access Control (RBAC)** — Granular permission system with seeded roles (JMO, MO, Lab Technician, Clerk, Admin).
- **Audit Logging** — Automatic audit trail for all data mutations.
- **Administrator Dashboard** — User management, role assignment, permission configuration, and audit log viewer.
- **JWT Authentication** — Stateless token authentication with server-side token denylist on logout.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Backend | ASP.NET Core 8 Web API (C#) |
| ORM | Entity Framework Core 8 |
| Database | PostgreSQL (via Npgsql) |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | BCrypt.Net |
| Frontend Testing | Vitest, React Testing Library |
| E2E Testing | Playwright |
| Backend Testing | xUnit |

---

## Repository Structure

```text
FMDDS/
├── Backend/                    # ASP.NET Core Web API
│   ├── Migrations/             # EF Core migration history
│   ├── Properties/             # Launch settings
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/    # API controllers
│   │   │   └── middlewares/    # Auth, RBAC, exception middleware
│   │   ├── core/
│   │   │   └── services/       # Business logic services
│   │   └── data/
│   │       ├── db/             # AppDbContext
│   │       ├── entities/       # EF Core entity models
│   │       └── repositories/   # Data access layer
│   ├── appsettings.json        # Non-secret configuration
│   ├── appsettings.Development.json
│   └── backend.csproj
│
├── Backend.Tests/              # xUnit test project
│   └── *.cs                    # Unit and integration tests
│
├── Database/
│   ├── schema.sql              # Full database schema (reference)
│   ├── seeds.sql               # Seed data reference
│   └── verify_views.sql        # SQL view verification script
│
├── tests/                      # Node.js integration and E2E runners
│   ├── integration-tests.js
│   ├── run-tests.js
│   ├── secret-scan.js
│   ├── setup-test-database.example.sql
│   └── smoke-test.js
│
└── web/                        # React + Vite frontend
    ├── e2e/                    # Playwright E2E tests
    ├── public/                 # Static assets
    ├── src/
    │   ├── components/         # Shared UI components and layout
    │   ├── context/            # React context (Auth, Notifications)
    │   ├── services/           # Axios API service clients
    │   ├── tests/              # Vitest unit and integration tests
    │   ├── utils/              # Utility helpers (JWT, NIC validator)
    │   └── views/              # Page-level view components
    ├── tests/                  # Isolated E2E and integration runners
    ├── .env.example            # Environment variable template
    ├── package.json
    ├── playwright.config.js
    └── vite.config.js
```

---

## Prerequisites

Verify the following are installed before proceeding.

| Requirement | Minimum Version | Check Command |
|---|---|---|
| .NET SDK | 8.0 | `dotnet --version` |
| Node.js | 18.0 | `node --version` |
| npm | 9.0 | `npm --version` |
| PostgreSQL | 14.0 | `psql --version` |
| Git | any | `git --version` |

> **Windows note** — Ensure PostgreSQL `bin` directory (e.g. `C:\Program Files\PostgreSQL\15\bin`) is on your `PATH` so that `psql` and `pg_dump` are available from any terminal.

---

## Setup: Clone the Repository

```powershell
git clone https://github.com/sandun-kodi/FMDDS.git
Set-Location FMDDS
```

---

## Setup: PostgreSQL Database

### 1. Verify PostgreSQL is running

```powershell
# Windows — check service status
Get-Service postgresql*
```

Start the service if it is stopped:

```powershell
Start-Service postgresql-x64-15   # adjust version suffix as needed
```

### 2. Create the application database

```powershell
$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) { $psql = "C:\Program Files\PostgreSQL\15\bin\psql.exe" }

$dbExists = & $psql -U postgres -d postgres -tAc `
    "SELECT 1 FROM pg_database WHERE datname = 'fmdds_db'"

if ($dbExists -ne "1") {
    & $psql -U postgres -d postgres -c "CREATE DATABASE fmdds_db;"
    Write-Host "Database fmdds_db created."
} else {
    Write-Host "Database fmdds_db already exists."
}
```

---

## Setup: Backend (.NET)

### 3. Restore NuGet dependencies

```powershell
dotnet restore .\Backend\backend.csproj
```

### 4. Install the EF Core CLI tool

```powershell
dotnet tool install --global dotnet-ef --version 8.0.4
```

If already installed, update it:

```powershell
dotnet tool update --global dotnet-ef --version 8.0.4
```

Verify:

```powershell
dotnet ef --version
```

### 5. Configure ASP.NET Core User Secrets

FMDDS uses the .NET User Secrets system so that no credentials are ever written to files tracked by Git.

#### 5a. PostgreSQL connection string

This is the password for the local PostgreSQL `postgres` user — **not** the FMDDS web login password.

```powershell
$project = ".\Backend\backend.csproj"

$securePgPassword = Read-Host "Enter your local PostgreSQL password" -AsSecureString  # Do NOT commit
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePgPassword)

try {
    $pgPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)            # Do NOT commit
    # Build connection string in memory only — value is written to User Secrets, not to any file
    $cs = "Host=localhost;Port=5432;Database=fmdds_db;Username=postgres;Password=" + $pgPassword  # Do NOT commit
    dotnet user-secrets set "ConnectionStrings:DefaultConnection" $cs --project $project
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Variable pgPassword, connectionString -ErrorAction SilentlyContinue
}
```

#### 5b. JWT signing secret

This key signs every JWT issued by the backend. Generate a random 48-byte key — do not use a fixed string.

```powershell
$jwtBytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($jwtBytes)
$jwtSecret = [Convert]::ToBase64String($jwtBytes)

dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret --project .\Backend\backend.csproj

Remove-Variable jwtSecret -ErrorAction SilentlyContinue
```

#### 5c. Seeded FMDDS application-user password

This is the password assigned to system users when they are first created by the database seeder. It is used **only** when a seeded user row does not yet exist. Changing this value after the database has already been seeded does **not** reset existing users — their BCrypt hashes in the database are not altered.

Choose a strong password for local use. Do not commit it and do not use `password123`.

Seeded usernames: `admin`, `jmo_perera`, `mo_silva`, `lab_fernando`, `clerk_jayasuriya`.

```powershell
$securePass = Read-Host "Enter initial password for seeded FMDDS users" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)

try {
    $seedPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    dotnet user-secrets set "SeedData:InitialPassword" $seedPassword --project .\Backend\backend.csproj
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Variable seedPassword -ErrorAction SilentlyContinue
}
```

### 6. Apply EF Core migrations

```powershell
dotnet ef database update --project .\Backend\backend.csproj
```

This creates all tables, views, indexes, and seeds the initial role/permission data.

---

## Running the Application

### Startup order

```
PostgreSQL → Backend → Frontend → Browser
```

### Terminal 1 — Start the backend

```powershell
dotnet run --project .\Backend\backend.csproj --urls "http://localhost:5200"
```

### Verify the backend is healthy

```powershell
Invoke-WebRequest -Uri "http://localhost:5200/api/v1/health" -UseBasicParsing
```

Expected: `StatusCode: 200`

Swagger UI (development only):

```
http://localhost:5200/swagger
```

### Terminal 2 — Install frontend dependencies

```powershell
Set-Location .\web
npm ci
```

### Start the frontend

```powershell
$env:VITE_API_BASE_URL = "http://localhost:5200/api/v1"

npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

### Open the application in your browser

```
http://127.0.0.1:5173
```

Log in with a seeded username and the password you configured in step 5c.

### Stopping the servers

Press `Ctrl+C` in each terminal window. PostgreSQL continues running as a system service.

---

## Troubleshooting

### `dotnet ef: command not found`

The global tools directory is not on your PATH. Run:

```powershell
$env:PATH += ";$env:USERPROFILE\.dotnet\tools"
dotnet ef --version
```

Add the path permanently via System → Advanced System Settings → Environment Variables.

### `FATAL: password authentication failed for user "postgres"`

The connection string password does not match the PostgreSQL user password set during installation. Re-run step 5a with the correct password.

### `bind: address already in use` on port 5200

Find and stop the process occupying the port:

```powershell
netstat -ano | findstr :5200
Stop-Process -Id <PID> -Force
```

### `VITE_API_BASE_URL is not set` warning in console

You started the frontend without setting the environment variable. Stop the dev server and re-run with the `$env:VITE_API_BASE_URL` line shown in the startup section above.

### EF migration fails with `relation does not exist`

The database may have been partially seeded. Reset and reapply:

```powershell
dotnet ef database drop --project .\Backend\backend.csproj --force
dotnet ef database update --project .\Backend\backend.csproj
```

---

## Running Tests

### Backend unit and integration tests

```powershell
dotnet test .\Backend.Tests\Backend.Tests.csproj --configuration Release
```

### Frontend unit tests

```powershell
Set-Location .\web
npm run test:unit
```

### Frontend integration tests (requires running backend)

```powershell
npm run test:integration:isolated
```

### End-to-end tests (requires running backend and frontend)

```powershell
npm run test:e2e:isolated
```

Or run Playwright directly:

```powershell
npx playwright test --project=chromium
```

### Secret scan

```powershell
Set-Location ..   # return to repo root if inside web/
node tests/secret-scan.js
```

---

## Production Build

### Frontend

```powershell
Set-Location .\web
npm ci
npm run build
```

The production bundle is output to `web/dist/`.

### Backend

```powershell
dotnet publish .\Backend\backend.csproj `
    --configuration Release `
    --output .\publish\backend
```

---

## Security Notes

- **Never commit** connection strings, JWT secrets, or passwords to Git.
- All credentials are stored in ASP.NET Core User Secrets (scoped to your machine), not in `appsettings.json`.
- The `appsettings.json` file contains only non-sensitive defaults (e.g. JWT issuer/audience, allowed origins).
- The backend enforces RBAC on every protected endpoint using a custom `PermissionAuthorize` attribute.
- Passwords are hashed with BCrypt (cost factor 12) and never stored in plaintext.
- JWTs are validated on every request; logged-out tokens are tracked in a server-side denylist.
- CORS is restricted to the configured frontend origin in production configuration.
