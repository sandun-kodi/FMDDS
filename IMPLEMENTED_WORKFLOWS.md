# Implemented Workflows & Reference Guide

This document records the completed and fully tested components, configurations, and workflows of the Forensic Medicine Department Database System (FMDDS) for your reference.

---

## 1. Backend Architecture & API Layer
The backend is built on **.NET 8 Web API** and is located in the `Backend/` directory.

### Database Configuration (PostgreSQL)
* **Server Address:** `localhost:5432`
* **Database Name:** `fmdds_db`
* **Username:** `fmdds_app` (configured locally via ASP.NET Core User Secrets)
* **Migrations:** Generated and applied via Entity Framework Core (`InitialCreate`).
* **Seeded Test Users:**

  | Role / User Type | Username | Password Setting | Full Name |
  | :--- | :--- | :--- | :--- |
  | **System Administrator** | `admin` | `<LOCAL_INITIAL_PASSWORD>` | System Admin |
  | **Judicial Medical Officer** | `jmo_perera` | `<LOCAL_INITIAL_PASSWORD>` | Dr. Perera (JMO) |
  | **Medical Officer** | `mo_silva` | `<LOCAL_INITIAL_PASSWORD>` | Dr. Silva (MO) |
  | **Laboratory Staff** | `lab_fernando` | `<LOCAL_INITIAL_PASSWORD>` | Mr. Fernando (Lab) |
  | **Clerical Staff** | `clerk_jayasuriya` | `<LOCAL_INITIAL_PASSWORD>` | Mrs. Jayasuriya (Clerk) |

### Services & Controllers
* **Authentication Service (`AuthController.cs`):** Generates JWT tokens containing role permissions.
* **CORS Policy:** Enabled to allow communication from the frontend origin `http://localhost:5173`.
* **Database Schema:** Full support for `Case`, `User`, `AuditLog`, `ClinicalExamination`, `PostmortemExamination`, `ChainOfCustody`, `Evidence`, `LaboratoryRequest`, `LaboratoryResult`, and `MedicoLegalReport`.

---

## 2. Security & Test Isolation Standards

* **User Secrets:** All local development credentials (connection strings, JWT signing keys, seed user passwords) are managed via ASP.NET Core User Secrets (`dotnet user-secrets`).
* **Test Isolation:** Automated integration testing executes against `fmdds_test` using a dedicated non-superuser role (`fmdds_test_runner`).
