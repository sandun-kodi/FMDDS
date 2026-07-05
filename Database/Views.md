# Database Views

This document defines the SQL queries and business logic for the standard database views (pre-compiled SELECT queries) recommended for FMDDS, based on Section 9.3.6 of the SRS.

---

## 1. Views Registry

| View Name | Primary Purpose | Base Tables |
| :--- | :--- | :--- |
| **VW_OpenCases** | Displays a list of all active cases currently undergoing examination or awaiting reports. | `Case`, `Patient`, `User` |
| **VW_CaseSummary** | Combines patient demographics, case details, and final cause of death or diagnosis details. | `Case`, `Patient`, `ClinicalExamination`, `PostmortemExamination` |
| **VW_LaboratoryStatus** | Monitors pending, processing, and completed lab investigations for department dashboards. | `LaboratoryRequest`, `LaboratoryResult`, `Case` |
| **VW_ReportSummary** | Tracks reports (MLRs and PMRs) status, approvers, and generation timelines. | `MedicoLegalReport`, `Case`, `User` |
| **VW_UserRoles** | Displays user accounts mapped to their security roles for admin convenience. | `User`, `Role`, `UserRole` |

---

## 2. SQL Specifications

### 2.1 VW_OpenCases
Retrieves cases that have not yet been Closed or Archived.

```sql
CREATE VIEW VW_OpenCases AS
SELECT 
    c.CaseID,
    c.CaseNumber,
    c.CaseType,
    c.RegistrationDate,
    c.Status,
    p.PatientID,
    p.FullName AS PatientName,
    p.NIC AS PatientNIC,
    u.UserID AS AssignedOfficerID,
    u.FullName AS AssignedOfficerName
FROM 
    `Case` c
INNER JOIN 
    `Patient` p ON c.PatientID = p.PatientID
LEFT JOIN 
    `User` u ON c.AssignedOfficerID = u.UserID
WHERE 
    c.Status NOT IN ('Closed', 'Archived');
```

### 2.2 VW_CaseSummary
Provides a high-level case folder summary including primary medical findings.

```sql
CREATE VIEW VW_CaseSummary AS
SELECT 
    c.CaseID,
    c.CaseNumber,
    c.CaseType,
    c.Status,
    c.RegistrationDate,
    p.FullName AS PatientName,
    p.Gender,
    p.NIC AS PatientNIC,
    -- Clinical exam details if present
    ce.ExamDate AS ClinicalExamDate,
    ce.Diagnosis AS ClinicalDiagnosis,
    -- Postmortem details if present
    pe.ExaminationDate AS AutopsyDate,
    pe.CauseOfDeath AS AutopsyCauseOfDeath
FROM 
    `Case` c
INNER JOIN 
    `Patient` p ON c.PatientID = p.PatientID
LEFT JOIN 
    `ClinicalExamination` ce ON c.CaseID = ce.CaseID
LEFT JOIN 
    `PostmortemExamination` pe ON c.CaseID = pe.CaseID;
```

### 2.3 VW_LaboratoryStatus
Identifies the queue of pending diagnostic samples.

```sql
CREATE VIEW VW_LaboratoryStatus AS
SELECT 
    lr.LabRequestID,
    lr.CaseID,
    c.CaseNumber,
    lr.RequestDate,
    lr.Status AS RequestStatus,
    res.LabResultID,
    res.CompletionDate,
    CASE 
        WHEN res.LabResultID IS NULL THEN 'Awaiting Analysis'
        ELSE 'Results Finalized'
    END AS ResultState
FROM 
    `LaboratoryRequest` lr
INNER JOIN 
    `Case` c ON lr.CaseID = c.CaseID
LEFT JOIN 
    `LaboratoryResult` res ON lr.LabRequestID = res.LabRequestID;
```

### 2.4 VW_ReportSummary
Aggregates medico-legal reporting metrics.

```sql
CREATE VIEW VW_ReportSummary AS
SELECT 
    r.ReportID,
    r.CaseID,
    c.CaseNumber,
    r.ReportType,
    r.ApprovalStatus,
    r.ApprovalDate,
    u.UserID AS ApproverID,
    u.FullName AS ApproverName
FROM 
    `MedicoLegalReport` r
INNER JOIN 
    `Case` c ON r.CaseID = c.CaseID
LEFT JOIN 
    `User` u ON r.ApprovedByID = u.UserID;
```

### 2.5 VW_UserRoles
Lists system accounts and their roles.

```sql
CREATE VIEW VW_UserRoles AS
SELECT 
    u.UserID,
    u.Username,
    u.FullName AS UserFullName,
    u.IsActive,
    r.RoleID,
    r.RoleName,
    r.Description AS RoleDescription
FROM 
    `User` u
INNER JOIN 
    `UserRole` ur ON u.UserID = ur.UserID
INNER JOIN 
    `Role` r ON ur.RoleID = r.RoleID;
```
