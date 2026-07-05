# Implementation Task Breakdown

This document provides a granular task checklist for each of the 10 development steps required to implement the FMDDS, helping coordinate coding tasks, database schema deployments, and front-end interface integrations.

---

## Step Checklists

### Step 1: Database Schema & Seed Data
- [x] Write SQL DDL schemas for all tables (`User`, `Role`, `Permission`, `Patient`, `Case`, `Hospital`, `Ward`, `ReferralSourceType`, etc.).
- [x] Enforce Primary Key, Foreign Key, and Unique constraints (including nested ward checks).
- [x] Implement CHECK constraints (e.g., status values aligned to `BRL-003`, gender options).
- [x] Deploy standard Views (`VW_OpenCases`, `VW_CaseSummary`, etc.).
- [x] Write initialization seed scripts containing default roles, permissions, hospitals, wards, and referral categories.
- [ ] Create database connection accounts (`fmdds_app`, `fmdds_backup`).

### Step 2: Data Access Layer (DAL) & ORM
- [x] Configure database context parameters in the backend config files.
- [x] Generate ORM entity classes matching database schemas.
- [x] Implement generic repository patterns and unit of work contexts.
- [x] Code custom queries for complex data retrievals (e.g. case search index lookups).
- [ ] Write unit tests verifying database transactions (CRUD operations).

### Step 3: User Authentication & Security Middleware
- [ ] Set up bcrypt configuration for password hashing (work factor = 12).
- [ ] Code the login API endpoint (`POST /auth/login`) with error handlers for locked accounts.
- [x] Code the token signing service (JWT payload claim fields).
- [x] Create the authentication middleware verifying JWT signatures in headers.
- [x] Build the authorization middleware parsing permission strings from claims.
- [ ] Build frontend Login screen component (`SCR-001`) and route guards.
- [ ] Implement inactivity tracking timer on the frontend (15 minutes).

### Step 4: Patient & Case Intake Module
- [x] Code Patient validation service (validating name ranges, NIC regex formats).
- [x] Create API routes: `POST /patients`, `POST /cases`, `GET /cases` (with filters).
- [ ] Build Patient Registration (`SCR-003`) and Case Registration (`SCR-004`) front-end forms.
- [ ] Enforce unique constraints validations and display warning alerts.

### Step 5: Clinical Examination Module
- [x] Create clinical observations schemas and API endpoint (`POST /cases/{id}/clinical-exam`).
- [x] Implement examiner role checks (`BRL-008`).
- [ ] Configure local file storage directory for photographic attachments.
- [ ] Build `SCR-005` (Clinical Examination Form) containing physical findings tabs and file uploaders.

### Step 6: Postmortem Autopsy Module
- [x] Create postmortem examination schemas and API route (`POST /cases/{id}/postmortem-exam`).
- [x] Code Cause of Death (COD) input validations.
- [ ] Build `SCR-006` (Postmortem Examination Form) with external and internal findings sections.

### Step 7: Laboratory Module
- [x] Code laboratory request and result entities.
- [x] Create API routes: `POST /cases/{id}/lab-requests`, `PUT /lab-requests/{id}/results`.
- [ ] Build Lab technician queue views and results entries form (`SCR-007`).
- [ ] Implement notification triggers when results are uploaded.

### Step 8: Evidence Tracking Module
- [x] Create `Evidence` and `ChainOfCustody` schemas.
- [x] Code the transfer API route (`POST /evidence/{id}/transfer`) validating custody ownership rules (`BRL-012`).
- [ ] Build `SCR-008` (Evidence Management Form) detailing transfer logs tables.

### Step 9: Medico-Legal Reports Engine
- [x] Set up PDF generation library dependencies (e.g. iTextSharp, PDFKit).
- [x] Code compile service aggregating case data, clinical notes, and lab details.
- [x] Create API route `PUT /reports/{id}/approve` locking report state to Approved (`BRL-017`).
- [ ] Build `SCR-011` (Report Approval Screen) with PDF side-by-side preview panels.

### Step 10: Admin Auditing & Dashboards
- [x] Create global filter logging database modifications to `AuditLog`.
- [ ] Build `SCR-013` (Audit Log Viewer Grid) restricted to administrators.
- [x] Code aggregation queries mapping case counts and lab status counts.
- [ ] Build `SCR-002` (Main Dashboard Screen) showing summary graphs and notifications.
