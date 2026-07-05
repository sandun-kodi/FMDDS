# Database Indexes

This document defines the indexing strategy for the FMDDS database to optimize query performance, based on Section 9.3.4 and 9.4.5 of the SRS.

---

## 1. Index Naming Conventions

All indexes must follow the naming convention below:
* **Unique Indexes**: `UX_TableName_ColumnName`
* **Non-Unique Indexes**: `IX_TableName_ColumnName`
* **Composite Indexes**: `IX_TableName_Col1_Col2`

Primary keys are automatically clustered (indexed) by the relational database management system (RDBMS) and are excluded from this registry.

---

## 2. Indexes Registry

To ensure fast query response times and support the performance non-functional requirements (e.g., NFR-001, NFR-002), the following indexes are registered:

| Index Name | Table Name | Columns | Index Type | Purpose / Query Target |
| :--- | :--- | :--- | :--- | :--- |
| **UX_User_Username** | `User` | `Username` | Unique (B-Tree) | Enforces username uniqueness and speeds up login validation searches during user authentication (`UC-001`). |
| **UX_Case_CaseNumber** | `Case` | `CaseNumber` | Unique (B-Tree) | Enforces Case Number uniqueness and optimizes direct search/filtering by case number (`FR-006`). |
| **UX_Patient_NIC** | `Patient` | `NIC` | Unique (B-Tree) | Enforces uniqueness for National Identity Cards and speeds up duplicate patient checks (`BRL-006`). |
| **IX_Patient_FullName** | `Patient` | `FullName` | Non-Unique (B-Tree) | Accelerates search queries filtering by patient or deceased person names. |
| **IX_Case_PatientID** | `Case` | `PatientID` | Non-Unique (B-Tree) | Speeds up joins between `Case` and `Patient` tables. |
| **IX_Case_Status** | `Case` | `Status` | Non-Unique (B-Tree) | Optimizes dashboard views and queries filtering cases by their workflow states (e.g., active vs. archived). |
| **IX_Case_RegistrationDate** | `Case` | `RegistrationDate` | Non-Unique (B-Tree) | Optimizes case search filters by date ranges and chronological listing. |
| **IX_Evidence_CaseID** | `Evidence` | `CaseID` | Non-Unique (B-Tree) | Optimizes retrieval of all physical evidence items associated with a specific case. |
| **IX_ChainOfCustody_EvidenceID** | `ChainOfCustody` | `EvidenceID` | Non-Unique (B-Tree) | Speeds up retrieval of the chronological custody transfer timeline for a piece of evidence. |
| **IX_LaboratoryRequest_CaseID** | `LaboratoryRequest` | `CaseID` | Non-Unique (B-Tree) | Speeds up retrieval of all laboratory requests registered for a case. |
| **IX_MedicoLegalReport_ApprovalStatus** | `MedicoLegalReport` | `ApprovalStatus` | Non-Unique (B-Tree) | Speeds up filter queries for reports pending approval (`UC-011`). |
| **IX_AuditLog_UserID_Timestamp** | `AuditLog` | `UserID`, `Timestamp` | Composite (B-Tree) | Optimizes administrative queries reviewing audit logs filtered by user and sorted chronologically (`UC-014`). |
| **IX_Case_HospitalID** | `Case` | `HospitalID` | Non-Unique (B-Tree) | Optimizes joins and case filtering by referring hospitals. |
| **IX_Case_WardID** | `Case` | `WardID` | Non-Unique (B-Tree) | Optimizes joins and case filtering by referring wards. |
| **IX_Ward_HospitalID** | `Ward` | `HospitalID` | Non-Unique (B-Tree) | Speeds up retrieval of nested wards under a specific hospital lookup. |
| **UX_ReferralSourceType_TypeName** | `ReferralSourceType` | `TypeName` | Unique (B-Tree) | Speeds up lookup and prevents duplicate referral categories. |

---

## 3. Maintenance and Performance Guidelines

* **Regular Rebuilding**: Undergo periodic index fragmentation checks (e.g., monthly). Rebuild indexes if fragmentation exceeds 30%, or reorganize them if fragmentation is between 5% and 30%.
* **Query Profiling**: Evaluate indexes continuously using DBMS execution plan analyzers (e.g., `EXPLAIN` queries) to ensure index scans/seeks are occurring rather than full-table scans.
* **Write Overhead Caution**: Limit the creation of unnecessary indexes on write-heavy tables (such as `AuditLog` and `ChainOfCustody`), as each index adds a minor overhead to `INSERT` and `UPDATE` operations.
