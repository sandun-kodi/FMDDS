# Developer Setup & Collaboration Guide

Welcome to the Forensic Medicine Department Database System (FMDDS) project. This guide explains how to set up the codebase, replicate the database, run integration tests, and run the application locally.

---

## 1. Prerequisites
Before getting started, make sure you have the following installed on your local machine:
* **.NET 8 SDK** (to run the backend API)
* **Node.js (v18+) & npm** (to run the frontend client)
* **PostgreSQL (v14+)** (local database server running on port `5432`)
* **Entity Framework Core CLI** (for database migrations)

To install EF Core tools globally, run:
```bash
dotnet tool install --global dotnet-ef
```

---

## 2. Local Database Setup (PostgreSQL)

You do **not** need to connect directly to the original developer's computer. You will run a local instance of PostgreSQL and replicate the schema using Entity Framework migrations:

1. **Install PostgreSQL** and create a user (standard username: `postgres`).
2. **Update Connection String:** 
   * Open `backend/appsettings.json`.
   * Locate `ConnectionStrings.DefaultConnection` and update the password to match your local PostgreSQL credentials:
     ```json
     "DefaultConnection": "Host=localhost;Port=5432;Database=fmdds_db;Username=postgres;Password=YOUR_LOCAL_PASSWORD"
     ```
3. **Replicate Schema & Tables:**
   Open your terminal in the `backend/` directory and run:
   ```bash
   dotnet ef database update
   ```
   This will automatically read our migration history files and create all necessary tables (such as `Patient`, `Case`, `User`, `AuditLog`, etc.) on your local PostgreSQL server.

4. **Seeded Test Credentials:**
   The backend auto-seeds the following test accounts on first run (with the default password `"password123"`):
   
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
cd backend
dotnet run
```
* Swagger documentation is available at `http://localhost:5200/swagger`.

### Start the Frontend React Client (Port 5173)
```bash
cd web
npm install
npm run dev
```
* Open `http://localhost:5173` to access the application UI.

---

## 4. Running Regression Tests
To verify that your local changes do not break existing backend features, run the standalone regression test suite:
```bash
node tests/integration-tests.js
```
This suite tests JWT Authentication, JMO role validation, patient registration, duplicate NIC prevention, and search lookup services. All tests must pass before pushing changes.
