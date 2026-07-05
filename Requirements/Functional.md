# Functional Requirements

This document registers and defines all Functional Requirements (FRs) for the Forensic Medicine Department Database System (FMDDS) as extracted from the system's SRS (Section 8.2).

---

## 1. Overview of Core Areas

The FMDDS is divided into the following functional areas:
1. **Authentication and User Management**: Security and user account actions.
2. **Case Management**: Core medico-legal cases.
3. **Patient Management**: Clinical patients and deceased profiles.
4. **Clinical Examination**: Livings cases medico-legal examinations.
5. **Postmortem Examination**: Autopsies and death records.
6. **Evidence Management**: Evidence collection and tracing.
7. **Laboratory Investigation**: Orders and results.
8. **Reporting**: Medico-legal reports and certificates.
9. **Administration**: System settings, auditing, and storage control.

---

## 2. Functional Requirements Catalog

### 2.1 Authentication and User Management

#### FR-001: User Authentication
* **Description**: The system shall authenticate users using a unique username and password before granting access.
* **Inputs**: Username, Password.
* **Processing**: Validate credentials, check account status, retrieve roles, establish session.
* **Outputs**: Access granted / Access denied with message.
* **Source**: BR-002, BR-008
* **Related Use Case**: UC-001 (Authenticate User)
* **Priority**: Critical
* **Verification**: Functional Testing

#### FR-002: Role-Based Authorization
* **Description**: The system shall grant access to system functions based on the authenticated user's assigned role and permissions.
* **Source**: BR-008
* **Related Use Case**: UC-013
* **Priority**: Critical
* **Verification**: Functional Testing

#### FR-003: Password Management
* **Description**: The system shall allow users to securely change their passwords and support password reset functionality through authorized procedures.
* **Priority**: High
* **Verification**: Functional Testing

#### FR-004: User Account Management
* **Description**: The system shall enable administrators to create, modify, activate, deactivate, and logically delete user accounts.
* **Priority**: High
* **Verification**: Functional Testing / Inspection

---

### 2.2 Case Management

#### FR-005: Case Registration
* **Description**: The system shall allow authorized users (e.g., Clerical Staff) to register a new medico-legal case.
* **Outputs**: Unique Case Number, Case Record.
* **Source**: BR-001, BR-003
* **Related Use Case**: UC-003
* **Priority**: Critical
* **Verification**: Functional Testing

#### FR-006: Case Search
* **Description**: The system shall provide search functionality using one or more criteria: Case Number, Patient Name, National ID, Date, Case Status, Referral Source.
* **Priority**: High
* **Verification**: Functional Testing

#### FR-007: Case Update
* **Description**: The system shall allow authorized users to update case information while maintaining a complete audit history.
* **Priority**: High
* **Verification**: Functional Testing

#### FR-008: Case Status Management
* **Description**: The system shall maintain and update case status (e.g., Open, In-progress, Pending Lab, Completed, Issued, Archived) throughout its lifecycle.
* **Priority**: Critical
* **Verification**: State Transition / Integration Testing

---

### 2.3 Patient Management

#### FR-009: Patient Registration
* **Description**: The system shall maintain demographic information (Name, Age, DOB, Gender, Address, NIC, Contact details) for patients and deceased persons associated with medico-legal cases.
* **Priority**: High
* **Verification**: Functional Testing

#### FR-010: Patient Information Update
* **Description**: The system shall allow authorized users to update patient information while preserving historical records where required.
* **Priority**: Medium
* **Verification**: Functional Testing

---

### 2.4 Clinical Examination

#### FR-011: Clinical Examination Recording
* **Description**: The system shall allow Medical Officers to record clinical forensic examination findings electronically (e.g., injuries, history, clinical signs).
* **Source**: BR-004
* **Priority**: Critical
* **Verification**: Functional Testing

#### FR-012: Clinical Document Attachment
* **Description**: The system shall allow authorized users to upload supporting documents and images related to clinical examinations.
* **Priority**: High
* **Verification**: Functional Testing

---

### 2.5 Postmortem Examination

#### FR-013: Postmortem Recording
* **Description**: The system shall allow Judicial Medical Officers (JMOs) to record complete postmortem examination findings (external injuries, internal organ examinations, dissection notes).
* **Source**: BR-004
* **Priority**: Critical
* **Verification**: Functional Testing

#### FR-014: Cause of Death Recording
* **Description**: The system shall support recording of provisional and final causes of death (immediate, antecedent, underlying, and manner of death).
* **Priority**: Critical
* **Verification**: Functional Testing

---

### 2.6 Evidence Management

#### FR-015: Evidence Registration
* **Description**: The system shall register forensic evidence items and specimens (e.g., blood stains, tissue, weapons) associated with a case.
* **Source**: BR-005
* **Priority**: Critical
* **Verification**: Functional Testing

#### FR-016: Chain of Custody Management
* **Description**: The system shall record and maintain the chain of custody (handler, date/time, purpose, status) for every evidence item.
* **Priority**: Critical
* **Verification**: Integration Testing

---

### 2.7 Laboratory Investigation

#### FR-017: Laboratory Request Management
* **Description**: The system shall allow authorized users to create and manage laboratory investigation requests (toxicology, DNA, histopathology).
* **Source**: BR-006
* **Priority**: High
* **Verification**: Integration Testing

#### FR-018: Laboratory Result Recording
* **Description**: The system shall allow laboratory personnel or authorized officers to record investigation results.
* **Priority**: High
* **Verification**: Functional Testing

---

### 2.8 Reporting

#### FR-019: Report Generation
* **Description**: The system shall automatically generate standardized medico-legal reports (MLR, PMR) using stored examination and investigation data.
* **Source**: BR-007
* **Priority**: Critical
* **Verification**: System Testing

#### FR-020: Report Approval
* **Description**: The system shall allow Judicial Medical Officers to review and electronically approve reports before issuance.
* **Priority**: Critical
* **Verification**: System Testing

#### FR-021: Report Export
* **Description**: The system shall support exporting reports in PDF format and provide printing functionality.
* **Priority**: Medium
* **Verification**: Functional Testing

---

### 2.9 Administration

#### FR-022: Audit Logging
* **Description**: The system shall record all significant user actions (viewing cases, edits, deletes, reports generated) and security events in an immutable audit log.
* **Source**: BR-009
* **Priority**: Critical
* **Verification**: Inspection / Backend Audit Testing

#### FR-023: Backup Management
* **Description**: The system shall support scheduled and on-demand backups of application data and configuration.
* **Source**: BR-011
* **Priority**: High
* **Verification**: Recovery Testing / Inspection

#### FR-024: System Configuration
* **Description**: The system shall provide authorized administrators with configurable system settings (e.g., lookups, department info).
* **Priority**: Medium
* **Verification**: Functional Testing

#### FR-025: Notification Management
* **Description**: The system shall send notifications for selected system events, including password resets, account activation, and laboratory result availability.
* **Priority**: Medium
* **Verification**: Integration Testing

---

## 3. Requirement Dependencies

| Requirement ID | Description | Depends On |
| :--- | :--- | :--- |
| **FR-005** | Case Registration | FR-001, FR-002 |
| **FR-011** | Clinical Examination Recording | FR-005 |
| **FR-013** | Postmortem Recording | FR-005 |
| **FR-015** | Evidence Registration | FR-005 |
| **FR-017** | Laboratory Request Management | FR-005 |
| **FR-019** | Report Generation | FR-011, FR-013, FR-018 |
| **FR-020** | Report Approval | FR-019 |
| **FR-021** | Report Export | FR-020 |
