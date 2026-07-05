# Implemented Workflows & Reference Guide

This document records the completed and fully tested components, configurations, and workflows of the Forensic Medicine Department Database System (FMDDS) for your reference.

---

## 1. Backend Architecture & API Layer
The backend is built on **.NET 8 Web API** and is located in the `backend/` directory.

### Database Configuration (PostgreSQL)
* **Server Address:** `localhost:5432`
* **Database Name:** `fmdds_db`
* **Username/Password:** `postgres` / `admin` (updated)
* **Migrations:** Generated and applied via Entity Framework Core (`InitialCreate`).
* **Seeded Test Users & Credentials:**
  
  | Role / User Type | Username | Password | Full Name |
  | :--- | :--- | :--- | :--- |
  | **System Administrator** | `admin` | `password123` | System Admin |
  | **Judicial Medical Officer** | `jmo_perera` | `password123` | Dr. Perera (JMO) |
  | **Medical Officer** | `mo_silva` | `password123` | Dr. Silva (MO) |
  | **Laboratory Staff** | `lab_fernando` | `password123` | Mr. Fernando (Lab) |
  | **Clerical Staff** | `clerk_jayasuriya` | `password123` | Mrs. Jayasuriya (Clerk) |

### Services & Controllers
* **Authentication Service (`AuthController.cs`):** Generates JWT tokens containing role permissions.
* **CORS Policy:** Enabled to allow communication from the frontend origin `http://localhost:5173`.
* **Database Schema:** Full support for `Case`, `User`, `AuditLog`, `ClinicalExamination`, `PostmortemExamination`, `ChainOfCustody`, `Evidence`, `LaboratoryRequest`, `LaboratoryResult`, and `MedicoLegalReport`.

---

## 2. Frontend Client Layer
The frontend is a **Vite + React** Single Page Application, styled with **Vanilla CSS**, located in the `web/` directory.

### Implemented Screens
1. **SCR-001: Login Screen (`web/src/Login.jsx`)**
   * Centered glassmorphism login form with robust input validation.
   * Connects to `/auth/login` endpoint on port `5200`.
   * Securely saves JWT token to `localStorage` and redirects to the Dashboard.
2. **SCR-002: Dashboard Screen (`web/src/Dashboard.jsx`)**
   * Multi-column grid interface showcasing telemetry metrics (Active Cases, Pending Clinical/Postmortem Exams, and Lab Reports).
   * **Quick Launch Action Items** providing navigation routing.
   * **Recent Alerts Panel** for live system events (e.g. new police requests or lab uploads).
3. **Global Layout (`web/src/Layout.jsx`):** 
   * A unified header displaying current user and roles, breadcrumbs, sidebar panel navigation, main content wrapper, and status footer.

### Local Ports Configuration
* **Frontend Port:** `http://localhost:5173`
* **Backend Port:** `http://localhost:5200`

---

## 3. How to Launch & Run Locally
To run the full stack on your local machine:

1. **Database:** Make sure PostgreSQL is running on port `5432`.
2. **Start Backend:**
   ```bash
   cd backend
   dotnet run
   ```
3. **Start Frontend:**
   ```bash
   cd web
   npm run dev
   ```
4. **Access in Browser:** Open `http://localhost:5173`

---

## 4. Regression Testing
To ensure new modifications do not break previously implemented backend features, a regression test suite has been created at **`tests/integration-tests.js`**. This script runs without any external npm packages using Node's native `fetch`.

### Running the Test Suite:
1. Make sure your backend API is running (`http://localhost:5200`).
2. Run the following command in your terminal:
   ```bash
   node tests/integration-tests.js
   ```
3. It will verify:
   * **Authentication API:** Correct credential validation, JWT token return, and JMO role mapping.
   * **Patient Registration API:** Normal creation, validation, and database storage.
   * **Duplicate Prevention:** Asserts that registering duplicate NICs fails with `400 Bad Request`.
   * **Search API:** Asserts that looking up valid/invalid NICs returns correct status codes.

---

## 5. Next Steps / Pending Implementation
When you resume development, the next planned components to implement are:

1. **SCR-004: Case Registration Screen (Frontend & Backend)**
   * **Backend:** Expose `POST /api/v1/cases` (using `CaseService.CreateCaseAsync`) and add a lookup query for referring authorities (e.g. Police stations, Hospitals, Wards).
   * **Frontend:** Create `web/src/CaseRegistration.jsx` with input lookups linking to the newly registered patient profile (from `SCR-003`).
2. **SCR-005: Clinical Examination Screen**
   * Multi-section form capturing living patient physical findings and diagnoses.
3. **SCR-006: Postmortem Examination Screen**
   * Autopsy recording panel for JMOs, allowing external/internal anatomical annotations.
