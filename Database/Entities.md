# Database Entities

This document describes all logical and physical entities defined for the Forensic Medicine Department Database System (FMDDS) schema, based on Section 9.2, 9.3, and 9.4 of the SRS.

---

## 1. Entity Naming Standards

* **Tables**: Named in singular PascalCase (e.g., `Patient`, `ClinicalExamination`).
* **Primary Keys**: Always named as `TableNameID` (e.g., `PatientID`, `CaseID`).
* **Foreign Keys**: Named as the `ReferencedTableID` (e.g., `PatientID` inside `Case`).
* **Booleans**: Prefixed with `Is`, `Has`, or `Can` (e.g., `IsActive`).
* **Dates/Timestamps**: Named with `Date` or `Timestamp` suffixes (e.g., `RegistrationDate`, `CreatedTimestamp`).

---

## 2. Entity Dictionary & Attributes

### 2.1 User
Stores system user credentials, status, and identifying info for authentication.
* **UserID** (`INT`, PK, Auto-Increment): Unique user identifier.
* **Username** (`VARCHAR(50)`, Unique, NOT NULL): Unique login username.
* **PasswordHash** (`VARCHAR(255)`, NOT NULL): Secure cryptographically hashed password.
* **FullName** (`VARCHAR(120)`, NOT NULL): User's full name.
* **Email** (`VARCHAR(150)`, NULL): Email address.
* **IsActive** (`BIT`, Default `TRUE`): Activation state of the account.

### 2.2 Role
Defines system access roles.
* **RoleID** (`INT`, PK, Auto-Increment): Unique role identifier.
* **RoleName** (`VARCHAR(50)`, Unique, NOT NULL): Name of the role (e.g., System Administrator, JMO, Clerical Staff).
* **Description** (`VARCHAR(255)`, NULL): Detailed role definition.

### 2.3 Permission
Defines granular permissions.
* **PermissionID** (`INT`, PK, Auto-Increment): Unique permission identifier.
* **PermissionKey** (`VARCHAR(100)`, Unique, NOT NULL): The string key representing the permission (e.g., `case:create`, `report:approve`).
* **Description** (`VARCHAR(255)`, NULL): Permission description.

### 2.4 UserRole
Many-to-Many join table mapping users to roles.
* **UserID** (`INT`, FK, PK): Link to `User`.
* **RoleID** (`INT`, FK, PK): Link to `Role`.

### 2.5 RolePermission
Many-to-Many join table mapping roles to permissions.
* **RoleID** (`INT`, FK, PK): Link to `Role`.
* **PermissionID** (`INT`, FK, PK): Link to `Permission`.

### 2.6 Patient
Maintains demographic and biographical information for living patients and deceased persons.
* **PatientID** (`INT`, PK, Auto-Increment): Unique identifier.
* **NIC** (`VARCHAR(20)`, Unique, NULL): National Identity Card number.
* **FullName** (`VARCHAR(150)`, NOT NULL): Full name of the patient/deceased.
* **DateOfBirth** (`DATE`, NULL): Date of birth.
* **Gender** (`VARCHAR(20)`, NOT NULL): Gender.
* **Address** (`VARCHAR(300)`, NULL): Residential address.
* **Telephone** (`VARCHAR(20)`, NULL): Contact number.

### 2.7 Case
Stores high-level medico-legal case records.
* **CaseID** (`INT`, PK, Auto-Increment): Unique case identifier.
* **PatientID** (`INT`, FK, NOT NULL): Link to `Patient`.
* **CaseNumber** (`VARCHAR(30)`, Unique, NOT NULL): Unique official Case Number.
* **CaseType** (`VARCHAR(50)`, NOT NULL): Type of case (e.g., Clinical Forensic, Postmortem).
* **RegistrationDate** (`DATETIME`, NOT NULL, Default `CURRENT_TIMESTAMP`): Case registration date.
* **Status** (`VARCHAR(30)`, NOT NULL): Predefined lifecycle status (`Registered`, `Assigned`, `In Progress`, `Completed`, `Closed`, `Archived`).
* **AssignedOfficerID** (`INT`, FK, NULL): Link to `User` (primary forensic officer/doctor).
* **HospitalID** (`INT`, FK, NULL): Link to `Hospital` lookup (referring hospital).
* **WardID** (`INT`, FK, NULL): Link to `Ward` lookup (referring ward).
* **ReferralSourceTypeID** (`INT`, FK, NULL): Link to `ReferralSourceType` lookup (referral category e.g., Police, Court, Hospital, ISD).

### 2.8 ClinicalExamination
Details the examination of living patients.
* **ClinicalExamID** (`INT`, PK, Auto-Increment): Unique clinical exam identifier.
* **CaseID** (`INT`, FK, NOT NULL): Link to `Case` (One-to-Many but practically One-to-One).
* **ExaminerID** (`INT`, FK, NOT NULL): Link to `User` (JMO/MO conducting exam).
* **ExamDate** (`DATETIME`, NOT NULL): Examination date.
* **Observations** (`TEXT`, NOT NULL): Detailed clinical and physical observations.
* **Diagnosis** (`TEXT`, NULL): Clinical diagnosis.

### 2.9 PostmortemExamination
Details the autopsy findings for deceased cases.
* **PostmortemID** (`INT`, PK, Auto-Increment): Unique postmortem identifier.
* **CaseID** (`INT`, FK, NOT NULL): Link to `Case` (One-to-One).
* **ExaminerID** (`INT`, FK, NOT NULL): Link to `User` (JMO conducting autopsy).
* **CauseOfDeath** (`VARCHAR(255)`, NOT NULL): Manner and specific cause of death.
* **Findings** (`TEXT`, NOT NULL): Complete external and internal dissection findings.

### 2.10 Evidence
Registers physical and biological evidence gathered.
* **EvidenceID** (`INT`, PK, Auto-Increment): Unique evidence identifier.
* **CaseID** (`INT`, FK, NOT NULL): Link to `Case`.
* **EvidenceType** (`VARCHAR(100)`, NOT NULL): Type of evidence (e.g., Blood Sample, Weapon, Clothes).
* **Description** (`TEXT`, NULL): Details about the item.
* **StorageLocation** (`VARCHAR(150)`, NULL): Department safe/evidence locker ID.

### 2.11 ChainOfCustody
Logs transfers and handlers for each evidence item.
* **CustodyID** (`INT`, PK, Auto-Increment): Custody record identifier.
* **EvidenceID** (`INT`, FK, NOT NULL): Link to `Evidence`.
* **TransferringOfficerID** (`INT`, FK, NOT NULL): Link to `User` (transferring staff).
* **ReceivingOfficerID** (`INT`, FK, NOT NULL): Link to `User` (receiving staff).
* **TransferTimestamp** (`DATETIME`, NOT NULL, Default `CURRENT_TIMESTAMP`): Date and time of custody change.
* **Location** (`VARCHAR(150)`, NOT NULL): Current location of the item.
* **ReasonForTransfer** (`VARCHAR(255)`, NOT NULL): Reason (e.g., Court, Lab, Storage).

### 2.12 LaboratoryRequest
Orders test procedures.
* **LabRequestID** (`INT`, PK, Auto-Increment): Laboratory request identifier.
* **CaseID** (`INT`, FK, NOT NULL): Link to `Case`.
* **RequestDate** (`DATETIME`, NOT NULL, Default `CURRENT_TIMESTAMP`): Request date.
* **Status** (`VARCHAR(30)`, NOT NULL): Status of laboratory request (e.g., Pending, Processing, Completed).

### 2.13 LaboratoryResult
Stores final lab testing values.
* **LabResultID** (`INT`, PK, Auto-Increment): Result identifier.
* **LabRequestID** (`INT`, FK, NOT NULL): Link to `LaboratoryRequest` (One-to-One).
* **Result** (`TEXT`, NULL): Detailed test results and metrics.
* **CompletionDate** (`DATETIME`, NULL): Date signed off.

### 2.14 MedicoLegalReport
Stores generated legal output documents.
* **ReportID** (`INT`, PK, Auto-Increment): Report identifier.
* **CaseID** (`INT`, FK, NOT NULL): Link to `Case`.
* **ReportType** (`VARCHAR(50)`, NOT NULL): Type of report (`MLR` or `PMR`).
* **ApprovalStatus** (`VARCHAR(30)`, NOT NULL): Current approval status (`Draft`, `Approved`).
* **ApprovedByID** (`INT`, FK, NULL): Link to `User` (the JMO who signed it).
* **ApprovalDate** (`DATETIME`, NULL): Date of approval.

### 2.15 AuditLog
Immutable security log tracking user interactions.
* **AuditID** (`INT`, PK, Auto-Increment): Unique log identifier.
* **UserID** (`INT`, FK, NULL): User performing the action.
* **Action** (`VARCHAR(100)`, NOT NULL): Type of operation performed (e.g., User Login, Case Created, Case Updated).
* **Timestamp** (`DATETIME`, NOT NULL, Default `CURRENT_TIMESTAMP`): Action timestamp.
* **IPAddress** (`VARCHAR(50)`, NULL): Client IP address.

### 2.16 Department
Stores department configuration details.
* **DepartmentID** (`INT`, PK, Auto-Increment): Unique department identifier.
* **DepartmentName** (`VARCHAR(100)`, NOT NULL): Name of department.

### 2.17 Hospital
Stores referring hospital detail lookups.
* **HospitalID** (`INT`, PK, Auto-Increment): Unique hospital identifier.
* **HospitalName** (`VARCHAR(150)`, NOT NULL): Name of hospital.

### 2.18 Ward
Stores referring ward detail lookups.
* **WardID** (`INT`, PK, Auto-Increment): Unique ward identifier.
* **HospitalID** (`INT`, FK, NOT NULL): Link to `Hospital` containing this ward.
* **WardName** (`VARCHAR(100)`, NOT NULL): Name of ward.

### 2.19 ReferralSourceType
Stores category of case referral sources.
* **ReferralSourceTypeID** (`INT`, PK, Auto-Increment): Unique identifier.
* **TypeName** (`VARCHAR(100)`, Unique, NOT NULL): Name of type (e.g., Police, Court, Hospital, Institutional Service Department (ISD)).

### 2.20 Notification
Stores system notifications.
* **NotificationID** (`INT`, PK, Auto-Increment): Notification identifier.
* **UserID** (`INT`, FK, NOT NULL): Recipient.
* **Message** (`VARCHAR(255)`, NOT NULL): Text message.
* **IsRead** (`BIT`, Default `FALSE`): Message status.
* **CreatedTimestamp** (`DATETIME`, NOT NULL, Default `CURRENT_TIMESTAMP`): Timestamp.
