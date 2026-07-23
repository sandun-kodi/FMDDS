# Developer Setup & Collaboration Guide

Welcome to the Forensic Medicine Department Database System (FMDDS) project. This guide explains how to set up the codebase, replicate the database, run integration tests, and run the application locally.

---

## 1. Prerequisites
Before getting started, make sure you have the following installed on your local machine:
* **.NET 8 SDK** (to run the backend API)
* **Node.js (v18+) & npm** (to run the frontend client)
* **PostgreSQL (v14+)** (local database server running on port `5432`)

---

## 2. Local Database Setup (PostgreSQL)

You do **not** need to connect directly to the original developer's computer. You will run a local instance of PostgreSQL and replicate the schema using Entity Framework migrations.

1. **Install PostgreSQL** and ensure the default superuser `postgres` exists.

2. **Update Connection String:**
   * Open `Backend/appsettings.json`.
   * Locate `ConnectionStrings.DefaultConnection` and update the password to match your local PostgreSQL credentials:
     ```json
     "DefaultConnection": "Host=localhost;Port=5432;Database=fmdds_db;Username=postgres;Password=YOUR_LOCAL_PASSWORD"
     ```

3. **Clear any stale User Secrets (important after first pull):**

   The project uses .NET User Secrets (`UserSecretsId: fmdds-backend-secrets-2026`). Previous developers may have stored connection strings in their local secrets store that override `appsettings.json`. To avoid "password authentication failed for user fmdds_app" errors, **clear any existing user secrets**:

   ```bash
   cd Backend
   dotnet user-secrets clear
   ```

   > **Why?** User Secrets are stored locally on each developer's machine (not in git). If a previous session set a connection string pointing to a different PostgreSQL user (e.g., `fmdds_app`), it will override your `appsettings.json` and cause authentication failures. Clearing them ensures `appsettings.json` is used.

4. **Database Migration & Seeding (Automatic):**

   You do **not** need to run `dotnet ef database update` manually. When you start the backend with `dotnet run`, the application **automatically**:
   - Applies any pending EF Core migrations (creates all tables: `Patient`, `Case`, `User`, `AuditLog`, etc.)
   - Seeds the default roles, permissions, and test user accounts

5. **Seeded Test Credentials:**
   The backend auto-seeds the following test accounts on first run (default password: `password123`):

   | Role / User Type | Username | Password | Full Name |
   | :--- | :--- | :--- | :--- |
   | **System Administrator** | `admin` | `password123` | System Admin |
   | **Judicial Medical Officer** | `jmo_perera` | `password123` | Dr. Perera (JMO) |
   | **Medical Officer** | `mo_silva` | `password123` | Dr. Silva (MO) |
   | **Laboratory Staff** | `lab_fernando` | `password123` | Mr. Fernando (Lab) |
   | **Clerical Staff** | `clerk_jayasuriya` | `password123` | Mrs. Jayasuriya (Clerk) |

---

## 3. How to Run the Application

### Start the Backend API (Port 5200)
```bash
cd Backend
dotnet run
```
* Swagger documentation is available at `http://localhost:5200/swagger`.
* On first run the database will be created, migrated, and seeded automatically.

### Start the Frontend React Client (Port 5173)
```bash
cd web
npm install
npm run dev
```
* Open `http://localhost:5173` to access the application UI.

---

## 4. Troubleshooting

### "password authentication failed for user fmdds_app"
This means a stale User Secret is overriding your `appsettings.json` connection string. Fix it by running:
```bash
cd Backend
dotnet user-secrets clear
```
Then restart the backend with `dotnet run`.

### Database does not exist
If PostgreSQL reports that `fmdds_db` does not exist, create it manually:
```bash
psql -U postgres -c "CREATE DATABASE fmdds_db;"
```
Then run `dotnet run` again — migrations will be applied automatically.

---

## 5. Running Regression Tests
To verify that your local changes do not break existing backend features, run the standalone regression test suite:
```bash
node tests/integration-tests.js
```
This suite tests JWT Authentication, JMO role validation, patient registration, duplicate NIC prevention, and search lookup services. All tests must pass before pushing changes.
