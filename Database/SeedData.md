# Seed Data Requirements

This document specifies the initial lookup data, system configuration records, and mock testing records required to bootstrap the FMDDS database for development, testing, and system verification, based on Sections 2.3, 7.4, and 9.4 of the SRS.

---

## 1. Initial System Configuration (Production & Development)

These SQL INSERT statements populate the core system tables (`Role`, `Permission`, `RolePermission`, `User`, `UserRole`, `Hospital`, `Department`) required to run the application.

### 1.1 Core Roles
```sql
INSERT INTO `Role` (RoleID, RoleName, Description) VALUES
(1, 'System Administrator', 'Manages users, permissions, backups, and configurations'),
(2, 'Judicial Medical Officer', 'Performs examinations, postmortems, and approves final reports'),
(3, 'Medical Officer', 'Assists JMO, conducts clinical examinations, and drafts reports'),
(4, 'Forensic Officer', 'Manages case registration, evidence logging, and custody logs'),
(5, 'Laboratory Staff', 'Receives test requests and records laboratory investigation results'),
(6, 'Clerical Staff', 'Enters patient/case demographics and tracks report issuance'),
(7, 'Research User', 'Accesses de-identified aggregated reporting and metrics');

INSERT INTO `Hospital` (HospitalID, HospitalName) VALUES
(1, 'National Hospital of Sri Lanka (NHSL)'),
(2, 'Teaching Hospital Karapitiya'),
(3, 'Teaching Hospital Peradeniya');

INSERT INTO `Ward` (WardID, HospitalID, WardName) VALUES
(1, 1, 'Ward 10 - Accident Service'),
(2, 1, 'Ward 15 - Intensive Care Unit'),
(3, 2, 'Ward 3 - Surgical Ward');

INSERT INTO `ReferralSourceType` (ReferralSourceTypeID, TypeName) VALUES
(1, 'Police'),
(2, 'Magistrate Court'),
(3, 'Referring Hospital'),
(4, 'Institutional Service Department (ISD)'),
(5, 'Other / Public Intake');

```

### 1.2 System Permissions
```sql
INSERT INTO `Permission` (PermissionID, PermissionKey, Description) VALUES
(1, 'user:manage', 'Create, update, and deactivate user accounts'),
(2, 'case:create', 'Create new case files and register patients'),
(3, 'case:view_all', 'View case files and details across the department'),
(4, 'case:view_restricted', 'View basic case metadata without medical details'),
(5, 'case:edit', 'Modify general case info and demographics'),
(6, 'exam:record_clinical', 'Record and save living patient examinations'),
(7, 'exam:record_postmortem', 'Record and save autopsy findings and cause of death'),
(8, 'evidence:manage', 'Register evidence and transfer custody'),
(9, 'lab:request', 'Create laboratory investigation requests'),
(10, 'lab:result_write', 'Enter laboratory test results'),
(11, 'report:approve', 'Approve and lock medico-legal reports'),
(12, 'report:print', 'Print and export reports'),
(13, 'audit:view', 'Access administrative audit trail logs');
```

### 1.3 Role-Permission Mapping
* **System Administrator**: `user:manage`, `case:view_all`, `audit:view`
* **Judicial Medical Officer (JMO)**: `case:create`, `case:view_all`, `case:edit`, `exam:record_clinical`, `exam:record_postmortem`, `lab:request`, `report:approve`, `report:print`
* **Medical Officer**: `case:view_all`, `exam:record_clinical`, `lab:request`, `report:print`
* **Forensic Officer**: `case:create`, `case:view_all`, `case:edit`, `evidence:manage`, `report:print`
* **Laboratory Staff**: `case:view_all`, `lab:result_write`
* **Clerical Staff**: `case:create`, `case:view_all`, `case:edit`, `report:print`
* **Research User**: `case:view_restricted`

---

## 2. Bootstrapping Accounts (Sample Users)

Passwords should be hashed using bcrypt or similar algorithms.
* `admin` (Role: System Administrator) - Password: `AdminPassword123!` (hashed)
* `dr_silva` (Role: Judicial Medical Officer) - Password: `JmoPassword123!` (hashed)
* `officer_bandara` (Role: Forensic Officer) - Password: `FoPassword123!` (hashed)

---

## 3. Mock Test Cases (Development Sandbox)

These records populate the database with clinical, postmortem, evidence, and laboratory test workflows to facilitate automated or manual verification.

### 3.1 Patient Registry
```sql
INSERT INTO `Patient` (PatientID, NIC, FullName, DateOfBirth, Gender, Address, Telephone) VALUES
(1, '198511223344', 'Saman Kumara', '1985-05-12', 'Male', '12/A, Kandy Road, Colombo', '0771234567'),
(2, '199965432100', 'Priyanthi Fernando', '1999-10-04', 'Female', '45, Lake Road, Galle', '0719876543'),
(3, NULL, 'Unknown Male Deceased', NULL, 'Male', NULL, NULL);
```

### 3.2 Medico-Legal Cases
```sql
INSERT INTO `Case` (CaseID, PatientID, CaseNumber, CaseType, RegistrationDate, Status, AssignedOfficerID, HospitalID, WardID, ReferralSourceTypeID) VALUES
(1, 1, 'COL/2026/CL/0001', 'Clinical Forensic', '2026-07-01 09:00:00', 'In Progress', 3, 1, 1, 3),
(2, 2, 'COL/2026/CL/0002', 'Clinical Forensic', '2026-07-02 11:30:00', 'Closed', 2, 2, 3, 3),
(3, 3, 'COL/2026/PM/0001', 'Postmortem', '2026-07-03 14:15:00', 'Registered', 2, NULL, NULL, 1);
```

### 3.3 Evidence Log
```sql
INSERT INTO `Evidence` (EvidenceID, CaseID, EvidenceType, Description, StorageLocation) VALUES
(1, 1, 'Clothing', 'Bloody torn shirt retrieved from patient Saman Kumara', 'Safe Locker A-4'),
(2, 3, 'Blood Vial', 'Cardiac blood sample collected during autopsy', 'Evidence Refrigerator B-12');
```

### 3.4 Chain of Custody transfers
```sql
INSERT INTO `ChainOfCustody` (CustodyID, EvidenceID, TransferringOfficerID, ReceivingOfficerID, TransferTimestamp, Location, ReasonForTransfer) VALUES
(1, 2, 3, 4, '2026-07-03 16:00:00', 'Lab Fridge', 'Transferred specimen to Lab Staff for toxicological screening');
```
