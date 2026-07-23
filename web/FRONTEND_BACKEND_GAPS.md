# FMDDS Frontend-Backend API Contract & Feature Gaps Document

This document records the exact API contract discrepancies, missing backend list endpoints, and configuration gaps identified during frontend integration testing against the ASP.NET Core backend.

---

## 1. Case Management & Intake Gaps

* **`referralSource` Text Field Not Persisted**:
  * **Endpoint**: `POST /api/v1/cases`
  * **DTO**: `CreateCaseRequest` contains `public string ReferralSource { get; set; }`.
  * **Defect**: `CaseController` passes only `request.ReferralSourceTypeID` to `CaseService.RegisterCaseAsync`. The free-text string `ReferralSource` is ignored and not persisted to PostgreSQL.
  * **Frontend Mitigation**: Text input is rendered for SRS compliance, but frontend documents that text storage requires backend service parameter binding.

---

## 2. Laboratory Investigation Gaps

* **Missing Test Type Selection in Request Creation**:
  * **Endpoint**: `POST /api/v1/cases/{caseId}/lab-requests`
  * **DTO**: `CreateLabRequestDto` accepts only `public int RequesterID { get; set; }`.
  * **Defect**: The DTO does not accept `TestTypeID` or `TestType`. Lab request records are inserted into database without associating the test type requested by the medical officer.
  * **Missing Global Queue Endpoint**: `GET /api/v1/lab-requests` does not exist on `LaboratoryController`.
  * **Frontend Mitigation**: `LabQueueView` provides case-specific request creation and lab result entry per request ID.

---

## 3. Evidence & Custody Ledger Gaps

* **Missing Global Evidence Directory Endpoint**:
  * **Existing Routes**: `POST /api/v1/cases/{caseId}/evidence`, `POST /api/v1/evidence/{evidenceId}/transfer`, `GET /api/v1/evidence/{evidenceId}/custody-log`.
  * **Missing Route**: `GET /api/v1/evidence` (Global evidence listing across all cases).
  * **Frontend Mitigation**: Evidence item registration requires specifying a valid Case ID, and custody logs are fetched per Evidence ID.

---

## 4. Report Management Gaps

* **Missing Global Reports Listing Endpoint**:
  * **Existing Routes**: `POST /api/v1/cases/{caseId}/reports`, `POST /api/v1/cases/{caseId}/reports/approve`, `PUT /api/v1/reports/{reportId}/approve`, `GET /api/v1/cases/{caseId}/reports/download`.
  * **Missing Route**: `GET /api/v1/reports` (Global reports queue for JMO review).
  * **Approval Status Return Code**: `POST /api/v1/cases/{caseId}/reports/approve` returns HTTP status `201 Created` instead of `200 OK`.

---

## 5. Administration & User Management Gaps

* **Missing User Management Endpoints**:
  * **Missing Routes**: `GET /api/v1/admin/users`, `POST /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/roles`.
  * **Frontend Mitigation**: `UserAdminView` renders an honest pending endpoint banner without browser mock storage.
* **Integrated Admin Endpoints**:
  * `GET /api/v1/admin/audit-logs?page=1&pageSize=100` (Fully integrated into `AuditLogView`).
  * `GET /api/v1/admin/dashboard-stats` (Fully integrated into `DashboardView`).
  * `GET /api/v1/settings` and `PUT /api/v1/settings/bulk` (Fully integrated into `SystemSettingsView`).

---

## 6. Seeded Roles & Permissions Alignment

* **Seeded Administrator Permissions**:
  * The backend `System Administrator` role is seeded with `user:manage`, `admin:audit`, `admin:stats`, and `case:view_all`.
  * Administrator accounts do NOT have `case:create`, `exam:record_clinical`, `exam:record_postmortem`, `lab:request`, `lab:result_write`, `evidence:manage`, or `report:approve`.
  * **Frontend Enforcement**: UI action controls and route guards check JWT `permissions` claims directly.
* **Unseeded Documented Roles**: `Forensic Officer` and `Research User` are defined in documentation but not seeded in PostgreSQL.
