# Database Normalization Report

This document reports the normalization state of the FMDDS relational schema, validating compliance with 1NF, 2NF, and 3NF to prevent database anomalies and ensure data integrity, based on Section 9.5 of the SRS.

---

## 1. Normalization Objectives

To ensure reliable transaction processing and eliminate anomalies, the FMDDS database is designed to comply with **Third Normal Form (3NF)**:
1. **First Normal Form (1NF)**: Eliminate repeating groups and ensure atomic values.
2. **Second Normal Form (2NF)**: Remove partial key dependencies (where a non-key column depends on only part of a composite primary key).
3. **Third Normal Form (3NF)**: Remove transitive dependencies (where a non-key column depends on another non-key column rather than directly on the primary key).

---

## 2. Normalization Process Analysis

### 2.1 First Normal Form (1NF) Compliance
* **Rule**: Each attribute must contain atomic values, and there must be no repeating groups.
* **FMDDS Resolution**:
  * Instead of storing multiple evidence items as a comma-separated list under a single case field:
    * **Violating Pattern**: `Case(CaseID, EvidenceList: "Knife, Shirt, Blood Sample")`
    * **Normalized State**: The `Evidence` entity was created. Each item is registered as a separate row (`EvidenceID`, `EvidenceType`) linked via `CaseID`.
  * Similarly, the `ChainOfCustody` records are stored in a dedicated child table rather than as a log list within the `Evidence` table.
* **Status**: Fully Compliant.

### 2.2 Second Normal Form (2NF) Compliance
* **Rule**: Must be in 1NF, and all non-key columns must depend on the *entire* primary key (no partial dependencies on tables with composite PKs).
* **FMDDS Resolution**:
  * Join tables with composite primary keys (`UserRole` with composite PK `(UserID, RoleID)` and `RolePermission` with composite PK `(RoleID, PermissionID)`) contain no non-key columns that have partial dependencies. 
  * General entities use single-column auto-incrementing integer PKs (e.g., `PatientID`, `CaseID`), which inherently eliminates the possibility of partial key dependencies.
  * Medical Officer / Examiner details (such as names or emails) are kept strictly within the `User` table. In `ClinicalExamination` or `PostmortemExamination`, only the foreign key `ExaminerID` is stored. This prevents repeating examiner details across examination records.
* **Status**: Fully Compliant.

### 2.3 Third Normal Form (3NF) Compliance
* **Rule**: Must be in 2NF, and no non-key attribute can transitively depend on the primary key via another non-key attribute (no transitive dependencies).
* **FMDDS Resolution**:
  * **Violating Pattern**: Storing hospital, ward, or referral department name and location fields directly inside the `Case` table. This creates a transitive dependency (`CaseID` ➔ `HospitalID` ➔ `HospitalName`). If a hospital's name changes, it requires updating multiple case records.
  * **Normalized State**: Dedicated lookup tables (`Hospital`, `Ward`, `Department`, `ReferralSourceType`) are defined. The `Case` or `User` records store only the respective foreign keys. The names and metadata are queried via SQL joins.
* **Status**: Fully Compliant.

---

## 3. Functional Dependencies Catalog

The schema enforces the following functional dependencies to validate its 3NF state:

* **Patient**: `PatientID` ➔ `NIC`, `FullName`, `DateOfBirth`, `Gender`, `Address`, `Telephone`
* **Case**: `CaseID` ➔ `PatientID`, `CaseNumber`, `CaseType`, `RegistrationDate`, `Status`, `AssignedOfficerID`, `HospitalID`, `WardID`, `ReferralSourceTypeID`
* **User**: `UserID` ➔ `Username`, `PasswordHash`, `FullName`, `Email`, `IsActive`
* **Hospital**: `HospitalID` ➔ `HospitalName`
* **Ward**: `WardID` ➔ `HospitalID`, `WardName`
* **ReferralSourceType**: `ReferralSourceTypeID` ➔ `TypeName`
* **Role**: `RoleID` ➔ `RoleName`, `Description`
* **Permission**: `PermissionID` ➔ `PermissionKey`, `Description`
* **Evidence**: `EvidenceID` ➔ `CaseID`, `EvidenceType`, `Description`, `StorageLocation`
* **ChainOfCustody**: `CustodyID` ➔ `EvidenceID`, `TransferringOfficerID`, `ReceivingOfficerID`, `TransferTimestamp`, `Location`, `ReasonForTransfer`
* **LaboratoryRequest**: `LabRequestID` ➔ `CaseID`, `RequestDate`, `Status`
* **LaboratoryResult**: `LabResultID` ➔ `LabRequestID`, `Result`, `CompletionDate`
* **MedicoLegalReport**: `ReportID` ➔ `CaseID`, `ReportType`, `ApprovalStatus`, `ApprovedByID`, `ApprovalDate`
* **AuditLog**: `AuditID` ➔ `UserID`, `Action`, `Timestamp`, `IPAddress`

---

## 4. Anomalies Prevented

| Anomaly Type | Normalized Solution |
| :--- | :--- |
| **Insert Anomaly** | New user accounts or patient demographics can be added to the system independently without requiring a case to exist first. |
| **Update Anomaly** | Changing a doctor's name or a hospital's mailing address occurs in a single row within their respective tables (`User` or `Hospital`), immediately propagating to all past and present cases via foreign keys. |
| **Delete Anomaly** | Deleting a laboratory request's completed result does not cause the deletion of the parent Case or Patient record. |
