# Use Cases

This document describes the primary functional interactions between user roles (actors) and the Forensic Medicine Department Database System (FMDDS), in accordance with Section 7.1 of the SRS.

---

## 1. Actors Registry

* **ACT-001: Judicial Medical Officer (JMO)**: Conducts clinical and postmortem examinations, reviews lab investigations, and signs/approves medico-legal reports.
* **ACT-002: Medical Officer**: Performs clinical examinations, registers cases, and drafts medico-legal reports.
* **ACT-003: Forensic Officer**: Registers evidence, scans police files, and coordinates chain of custody.
* **ACT-004: Laboratory Staff**: Records specimen reception and registers toxicological or other laboratory test results.
* **ACT-005: Clerical Staff**: Inputs patient and case intake records and coordinates report issuance.
* **ACT-006: System Administrator**: Configures roles, accounts, metadata tables, and system parameters.

---

## 2. High-Level Use Case Map

```mermaid
usecaseDiagram
    actor JMO
    actor MedicalOfficer
    actor ForensicOfficer
    actor LabStaff
    actor ClericalStaff
    actor Admin

    ClericalStaff --> (UC-003: Register Medico-Legal Case)
    ClericalStaff --> (UC-004: Search Cases)

    MedicalOfficer --> (UC-004: Search Cases)
    MedicalOfficer --> (UC-005: Update Case Information)
    MedicalOfficer --> (UC-006: Record Clinical Examination)
    MedicalOfficer --> (UC-009: Request Laboratory Investigation)

    JMO --> (UC-004: Search Cases)
    JMO --> (UC-005: Update Case Information)
    JMO --> (UC-007: Record Postmortem Examination)
    JMO --> (UC-009: Request Laboratory Investigation)
    JMO --> (UC-011: Generate Medico-Legal Report)
    JMO --> (UC-012: Print Reports)

    ForensicOfficer --> (UC-004: Search Cases)
    ForensicOfficer --> (UC-008: Manage Evidence)

    LabStaff --> (UC-010: Record Laboratory Results)

    Admin --> (UC-013: Manage Users and Roles)
    Admin --> (UC-014: Review Audit Logs)
    Admin --> (UC-015: Backup and Restore System)
```

---

## 3. Detailed Use Case Specifications

### UC-001: Authenticate User
* **Primary Actor**: All Users
* **Goal**: Enable users to securely log into the system and access their dashboard.
* **Preconditions**:
  * User account exists.
  * User account is active.
* **Postconditions**:
  * An authenticated, secure session is established.
  * Role-specific dashboard is displayed based on user permissions.

### UC-003: Register Medico-Legal Case
* **Primary Actor**: Clerical Staff
* **Goal**: Create a new case file and link it to a patient or deceased person.
* **Preconditions**:
  * User is authenticated.
  * Patient/Deceased demographic information is registered.
* **Postconditions**:
  * New case record created in the database.
  * A unique Case Number is generated.
  * Security audit log is updated.

### UC-006: Record Clinical Examination
* **Primary Actor**: Medical Officer
* **Goal**: Log clinical findings, measurements, trauma classifications, and photographs for living patient examinations.
* **Preconditions**:
  * Case has status of `Assigned` or `Examination In Progress`.
  * User is authenticated as Medical Officer or JMO.
* **Postconditions**:
  * Detailed clinical examination records are saved.
  * Case status progresses to `Examination In Progress` or `Report Preparation`.
  * Audit trail records the transaction.

### UC-007: Record Postmortem Examination
* **Primary Actor**: Judicial Medical Officer (JMO)
* **Goal**: Log autopsy findings, anatomical descriptions, organ weights, manner of death, and causes of death (COD) for deceased cases.
* **Preconditions**:
  * Case is registered as a Postmortem case type.
  * User is authenticated as JMO.
* **Postconditions**:
  * Complete postmortem findings and COD fields are stored.
  * Status progresses.
  * Audit log records the autopsy details.

### UC-011: Generate Medico-Legal Report
* **Primary Actor**: Judicial Medical Officer (JMO)
* **Goal**: Automatically compile stored examination details, demographics, and lab results into a standard template (MLR or PMR) and finalize it.
* **Preconditions**:
  * All examination findings and laboratory results are completed and validated.
* **Postconditions**:
  * Final report PDF is generated and locked.
  * Report status transitions to `Approved` (Read-Only).
  * System records report metadata and updates the case audit trail.

### UC-013: Manage Users and Roles
* **Primary Actor**: System Administrator
* **Goal**: Create new accounts, adjust security permissions, or deactivate users.
* **Preconditions**:
  * Administrator is authenticated.
* **Postconditions**:
  * User database updated with modified permissions, credentials, or statuses.
  * Administrative audit log is written to DB.

---

## 4. Use Case Relationships & Flows

* **Includes**:
  * *UC-001 (Authenticate User)* **includes** credential validation.
  * *UC-011 (Generate Medico-Legal Report)* **includes** case and patient detail queries.
* **Extensions**:
  * *UC-008 (Manage Evidence)* is **extended by** uploading physical evidence photos or custody receipts.
  * *UC-003 (Register Case)* is **extended by** uploading digital scanned police documents.
* **Generalizations**:
  * *UC-011 (Generate Report)* generalized into **Clinical Report (MLR)** and **Postmortem Report (PMR)** creation.
