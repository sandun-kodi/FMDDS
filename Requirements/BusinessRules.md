# Business Rules

This document registers and defines all formal Business Rules (BRL) governing the operation of the Forensic Medicine Department Database System (FMDDS) based on Section 8.5 of the SRS.

---

## 1. Business Rules Catalog

### 1.1 Case Management Rules

#### BRL-001: Unique Case Number
* **Rule**: Each medico-legal case shall be assigned a unique system-generated Case Number.
* **Related BR**: BR-001
* **Related FR**: FR-005
* **Priority**: Critical
* **Verification Method**: Database Constraint Validation / Functional Testing

#### BRL-002: Mandatory Case Registration
* **Rule**: A case shall not be created unless all mandatory registration fields have been completed successfully.
* **Priority**: Critical
* **Verification Method**: Functional Testing

#### BRL-003: Case Status Progression
* **Rule**: Case status transitions shall follow the approved workflow. Invalid transitions shall be rejected by the system.
  * **Status Lifecycle**: `Registered` ➔ `Assigned` ➔ `Examination In Progress` ➔ `Laboratory Pending` (Optional) ➔ `Report Preparation` ➔ `Report Approved` ➔ `Closed` ➔ `Archived`
* **Related BR**: BR-001
* **Related FR**: FR-008
* **Priority**: Critical
* **Verification Method**: State Transition Testing

#### BRL-004: Case Closure
* **Rule**: A case may only be closed after:
  1. Required examinations are completed.
  2. Mandatory reports are approved.
  3. Outstanding laboratory requests are resolved.
  4. Required evidence records are finalized.
* **Priority**: Critical
* **Verification Method**: Workflow Validation Testing

---

### 1.2 Patient Information Rules

#### BRL-005: Patient Identification
* **Rule**: Patient records (and deceased person records) shall contain sufficient identifying information (e.g., National Identity Card / NIC number, biographic details, fingerprints/demographics) to uniquely distinguish individuals.
* **Priority**: High
* **Verification Method**: Inspection / Data Constraints

#### BRL-006: Duplicate Patient Detection
* **Rule**: The system shall warn users when new patient information appears to match an existing record (e.g., based on NIC, Full Name & DOB combination).
* **Priority**: High
* **Verification Method**: Functional Testing

---

### 1.3 Clinical Examination Rules

#### BRL-007: Mandatory Examination Data
* **Rule**: Clinical examination records (MLEF entries) shall not be saved without mandatory observations, injuries detail, and examiner identification.
* **Priority**: Critical
* **Verification Method**: Functional Validation Testing

#### BRL-008: Authorized Examiner
* **Rule**: Only authorized Medical Officers (MO) or Judicial Medical Officers (JMO) may record clinical forensic examination findings.
* **Priority**: Critical
* **Verification Method**: Security Role Testing

---

### 1.4 Postmortem Examination Rules

#### BRL-009: Cause of Death
* **Rule**: The system shall support recording provisional and final causes of death separately where applicable.
* **Priority**: Critical
* **Verification Method**: Functional Testing

#### BRL-010: Report Dependency
* **Rule**: Final medico-legal reports (PMRs) shall not be approved until required postmortem findings and Causes of Death (COD) have been completed.
* **Priority**: Critical
* **Verification Method**: Workflow Integration Testing

---

### 1.5 Evidence Management Rules

#### BRL-011: Evidence Registration
* **Rule**: Every evidence item or specimen collected must be associated with exactly one registered medico-legal case.
* **Priority**: Critical
* **Verification Method**: Referential Integrity Validation

#### BRL-012: Chain of Custody
* **Rule**: Every transfer of an evidence item shall generate a new chain-of-custody record containing:
  * Date and Time of transfer.
  * Transferring Officer.
  * Receiving Officer.
  * Location.
  * Reason for transfer.
* **Related BR**: BR-005
* **Related FR**: FR-016
* **Priority**: Critical
* **Verification Method**: Integration / Audit Log Testing

#### BRL-013: Evidence Disposal
* **Rule**: Evidence shall only be disposed of after legal authorization and completion of the required retention period.
* **Priority**: High
* **Verification Method**: System Testing / Role-Based Access Testing

---

### 1.6 Laboratory Rules

#### BRL-014: Laboratory Requests
* **Rule**: Laboratory requests (e.g., toxicological, histopathological, DNA tests) shall only be created for registered cases.
* **Priority**: High
* **Verification Method**: Referential Integrity Validation

#### BRL-015: Laboratory Result Validation
* **Rule**: Laboratory results shall not be finalized until reviewed and signed off by authorized laboratory personnel.
* **Priority**: High
* **Verification Method**: Role-Based Authorization Testing

---

### 1.7 Report Management Rules

#### BRL-016: Report Approval
* **Rule**: Only authorized Judicial Medical Officers (JMOs) may approve final medico-legal reports (MLRs and PMRs).
* **Related BR**: BR-007
* **Related FR**: FR-020
* **Priority**: Critical
* **Verification Method**: Role-Based Authorization Testing

#### BRL-017: Report Immutability
* **Rule**: Approved reports shall become read-only. Any subsequent corrections or additions shall require a new version or an official amendment record.
* **Priority**: Critical
* **Verification Method**: Functional Security Testing

---

### 1.8 User Management Rules

#### BRL-018: Unique Username
* **Rule**: Each user account shall have a unique username across the entire system.
* **Priority**: Critical
* **Verification Method**: Database Unique Constraint Testing

#### BRL-019: Role-Based Access
* **Rule**: Users shall only access functions and information authorized for their assigned role (RBAC).
* **Related BR**: BR-008
* **Related FR**: FR-002
* **Priority**: Critical
* **Verification Method**: Security Access Control Testing

#### BRL-020: Account Lockout
* **Rule**: User accounts shall be temporarily locked after a configured number of consecutive failed login attempts (e.g., 5 failures).
* **Priority**: High
* **Verification Method**: Security Authentication Testing

---

### 1.9 Audit Rules

#### BRL-021: Audit Logging
* **Rule**: The system shall record all security-sensitive and business-critical operations, including:
  * Login attempts (success & failure).
  * User account creation, edits, and role changes.
  * Case creation and status changes.
  * Case/patient data modification.
  * Report generation and approval.
  * Evidence registration and transfer.
  * Laboratory request updates and result registration.
* **Related BR**: BR-009
* **Related FR**: FR-022
* **Priority**: Critical
* **Verification Method**: Log File Verification / Security Audits

#### BRL-022: Audit Record Protection
* **Rule**: Audit records shall be immutable and shall not be modified or deleted by standard users (including Administrators; only high-level DBAs or automated archive scripts can move them).
* **Priority**: Critical
* **Verification Method**: Security Testing / DB Permissions Review

---

### 1.10 Data Integrity Rules

#### BRL-023: Referential Integrity
* **Rule**: The database shall enforce foreign key relationships between related entities to prevent orphan records.
* **Related BR**: BR-001
* **Related FR**: FR-005
* **Priority**: Critical
* **Verification Method**: RDBMS Integrity Checks

#### BRL-024: Mandatory Data Validation
* **Rule**: Mandatory fields (such as dates, names, NIC, and examiner details) shall be validated at the API/Application layer and DB layer before transactions are committed.
* **Priority**: Critical
* **Verification Method**: Validation / Constraint Testing

#### BRL-025: Transaction Integrity
* **Rule**: Database operations involving multiple related updates (e.g., case status change + audit log update + evidence state transition) shall execute as atomic transactions.
* **Priority**: Critical
* **Verification Method**: Database Stress & Exception Testing

---

### 1.11 Backup and Retention Rules

#### BRL-026: Backup Schedule
* **Rule**: The system shall perform backups automatically according to the organization's approved backup policy (e.g., daily incremental backups, weekly full backups).
* **Priority**: High
* **Verification Method**: Backup Verification Testing

#### BRL-027: Record Retention
* **Rule**: Case records, examination results, and reports shall be retained digitally according to applicable national legal, regulatory, and organizational medico-legal retention requirements.
* **Related BR**: BR-013
* **Related FR**: NFR-026
* **Priority**: High
* **Verification Method**: Audit Compliance Review

#### BRL-028: Archive Policy
* **Rule**: Archived records (e.g., cases older than 10 years) shall remain accessible only to authorized personnel.
* **Priority**: Medium
* **Verification Method**: Access Control Testing

---

## 2. Business Rule Traceability Matrix

| Business Rule | Related BR | Related FR | Verification Method |
| :--- | :--- | :--- | :--- |
| **BRL-001** | BR-001 | FR-005 | Unique Constraint Check |
| **BRL-003** | BR-001 | FR-008 | State Machine Test |
| **BRL-012** | BR-005 | FR-016 | Integration Testing |
| **BRL-016** | BR-007 | FR-020 | RBAC Test Case |
| **BRL-019** | BR-008 | FR-002 | Access Control Test Case |
| **BRL-021** | BR-009 | FR-022 | Log Verification |
| **BRL-027** | BR-013 | NFR-026 | Legal Inspection |
