# Database Constraints

This document defines the constraints, default values, checks, and referential rules implemented in the FMDDS relational schema, based on Section 9.6 of the SRS.

---

## 1. Constraint Naming Standards

To ensure consistency, every database constraint must follow the naming convention below:

| Constraint Type | Standard Format | Example |
| :--- | :--- | :--- |
| **Primary Key** | `PK_TableName` | `PK_Patient` |
| **Foreign Key** | `FK_ChildTable_ParentTable` | `FK_Case_Patient` |
| **Unique Constraint** | `UQ_TableName_ColumnName` | `UQ_User_Username` |
| **Check Constraint** | `CK_TableName_ColumnName` | `CK_Case_Status` |
| **Default Constraint** | `DF_TableName_ColumnName` | `DF_User_IsActive` |

---

## 2. Constraints Catalog

### 2.1 Primary Keys (PK)
All tables must define a single column primary key to enforce row uniqueness. Composite primary keys are permitted only in join tables (e.g., `UserRole`, `RolePermission`).
* `PK_User`: `UserID`
* `PK_Role`: `RoleID`
* `PK_Permission`: `PermissionID`
* `PK_Patient`: `PatientID`
* `PK_Case`: `CaseID`
* `PK_ClinicalExamination`: `ClinicalExamID`
* `PK_PostmortemExamination`: `PostmortemID`
* `PK_Evidence`: `EvidenceID`
* `PK_ChainOfCustody`: `CustodyID`
* `PK_LaboratoryRequest`: `LabRequestID`
* `PK_LaboratoryResult`: `LabResultID`
* `PK_MedicoLegalReport`: `ReportID`
* `PK_AuditLog`: `AuditID`
* `PK_Department`: `DepartmentID`
* `PK_Hospital`: `HospitalID`
* `PK_Ward`: `WardID`
* `PK_ReferralSourceType`: `ReferralSourceTypeID`
* `PK_Notification`: `NotificationID`

### 2.2 Foreign Keys (FK) & Cascading Rules
Foreign keys enforce referential integrity across related tables. Refer to the table below for actions taken upon parent updates or deletions:

| Child Table | FK Column | Parent Table | On Update | On Delete | Description / Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `UserRole` | `UserID` | `User` | `CASCADE` | `CASCADE` | Standard mapping deletion. |
| `UserRole` | `RoleID` | `Role` | `CASCADE` | `CASCADE` | Standard mapping deletion. |
| `RolePermission` | `RoleID` | `Role` | `CASCADE` | `CASCADE` | Standard mapping deletion. |
| `RolePermission` | `PermissionID` | `Permission` | `CASCADE` | `CASCADE` | Standard mapping deletion. |
| `Case` | `PatientID` | `Patient` | `CASCADE` | `RESTRICT` | Prevent deleting a patient with active/past forensic cases. |
| `Case` | `AssignedOfficerID` | `User` | `CASCADE` | `RESTRICT` | Keep case examiner association history intact. |
| `ClinicalExamination` | `CaseID` | `Case` | `CASCADE` | `CASCADE` | Deleting the parent case removes exam logs. |
| `ClinicalExamination` | `ExaminerID` | `User` | `CASCADE` | `RESTRICT` | Prevent user deletion if they conduct exams. |
| `PostmortemExamination` | `CaseID` | `Case` | `CASCADE` | `CASCADE` | Deleting the parent case removes postmortem logs. |
| `PostmortemExamination` | `ExaminerID` | `User` | `CASCADE` | `RESTRICT` | Prevent JMO user deletion if they did autopsies. |
| `Evidence` | `CaseID` | `Case` | `CASCADE` | `RESTRICT` | Prevent deleting a case that holds registered physical evidence. |
| `ChainOfCustody` | `EvidenceID` | `Evidence` | `CASCADE` | `CASCADE` | Chain logs are deleted if evidence record is removed. |
| `LaboratoryRequest` | `CaseID` | `Case` | `CASCADE` | `RESTRICT` | Prevent case deletion with laboratory orders. |
| `LaboratoryResult` | `LabRequestID` | `LaboratoryRequest` | `CASCADE` | `CASCADE` | Result deleted if request is deleted. |
| `MedicoLegalReport` | `CaseID` | `Case` | `CASCADE` | `RESTRICT` | Reports must be archived; cannot delete cases with approved reports. |
| `AuditLog` | `UserID` | `User` | `CASCADE` | `RESTRICT` | Users with audit records cannot be deleted (deactivate instead). |
| `Notification` | `UserID` | `User` | `CASCADE` | `CASCADE` | Standard notification deletion. |
| `Case` | `HospitalID` | `Hospital` | `CASCADE` | `RESTRICT` | Optional link to referring hospital. |
| `Case` | `WardID` | `Ward` | `CASCADE` | `RESTRICT` | Optional link to referring ward. |
| `Case` | `ReferralSourceTypeID` | `ReferralSourceType` | `CASCADE` | `RESTRICT` | Optional link to referral category. |
| `Ward` | `HospitalID` | `Hospital` | `CASCADE` | `CASCADE` | Deleting a hospital removes its wards. |

### 2.3 Unique Constraints (UQ)
Prevents duplicate values in specific identifying fields.
* `UQ_User_Username` on `User(Username)`
* `UQ_Case_CaseNumber` on `Case(CaseNumber)`
* `UQ_Patient_NIC` on `Patient(NIC)` (Only enforced when NIC is not null)
* `UQ_Role_RoleName` on `Role(RoleName)`
* `UQ_Permission_PermissionKey` on `Permission(PermissionKey)`
* `UQ_ClinicalExamination_CaseID` on `ClinicalExamination(CaseID)` (Enforces 1:1 relationship)
* `UQ_PostmortemExamination_CaseID` on `PostmortemExamination(CaseID)` (Enforces 1:1 relationship)
* `UQ_LaboratoryResult_LabRequestID` on `LaboratoryResult(LabRequestID)` (Enforces 1:1 relationship)
* `UQ_ReferralSourceType_TypeName` on `ReferralSourceType(TypeName)` (Enforces unique referral categories)

### 2.4 NOT NULL Constraints
Enforces presence of critical data inputs.
* **Patient**: `FullName`, `Gender`
* **Case**: `CaseNumber`, `CaseType`, `RegistrationDate`, `Status`
* **User**: `Username`, `PasswordHash`, `FullName`
* **ClinicalExamination**: `CaseID`, `ExaminerID`, `ExamDate`, `Observations`
* **PostmortemExamination**: `CaseID`, `ExaminerID`, `ExaminationDate`, `Findings`, `CauseOfDeath`
* **Evidence**: `CaseID`, `EvidenceType`
* **LaboratoryRequest**: `CaseID`, `RequestDate`, `Status`
* **MedicoLegalReport**: `CaseID`, `ReportType`, `ApprovalStatus`

### 2.5 CHECK Constraints (CK)
Validates fields against predefined business list domains or dates.
* `CK_Case_Status`: `CHECK (Status IN ('Registered', 'Assigned', 'Examination In Progress', 'Laboratory Pending', 'Report Preparation', 'Report Approved', 'Closed', 'Archived'))`
* `CK_Case_CaseType`: `CHECK (CaseType IN ('Clinical Forensic', 'Postmortem'))`
* `CK_Patient_Gender`: `CHECK (Gender IN ('Male', 'Female', 'Other'))`
* `CK_Case_RegistrationDate`: `CHECK (RegistrationDate <= CURRENT_TIMESTAMP)`
* `CK_LaboratoryRequest_Status`: `CHECK (Status IN ('Pending', 'Processing', 'Completed'))`
* `CK_MedicoLegalReport_ApprovalStatus`: `CHECK (ApprovalStatus IN ('Draft', 'Approved'))`

### 2.6 DEFAULT Constraints (DF)
Automates values for standard metadata columns.
* `DF_User_IsActive` on `User(IsActive)`: `DEFAULT TRUE`
* `DF_Case_RegistrationDate` on `Case(RegistrationDate)`: `DEFAULT CURRENT_TIMESTAMP`
* `DF_Case_Status` on `Case(Status)`: `DEFAULT 'Registered'`
* `DF_LaboratoryRequest_RequestDate` on `LaboratoryRequest(RequestDate)`: `DEFAULT CURRENT_TIMESTAMP`
* `DF_LaboratoryRequest_Status` on `LaboratoryRequest(Status)`: `DEFAULT 'Pending'`
* `DF_MedicoLegalReport_ApprovalStatus` on `MedicoLegalReport(ApprovalStatus)`: `DEFAULT 'Draft'`
* `DF_AuditLog_Timestamp` on `AuditLog(Timestamp)`: `DEFAULT CURRENT_TIMESTAMP`
* `DF_Notification_IsRead` on `Notification(IsRead)`: `DEFAULT FALSE`
* `DF_Notification_CreatedTimestamp` on `Notification(CreatedTimestamp)`: `DEFAULT CURRENT_TIMESTAMP`
