# Entity Relationship Diagram (ERD)

This document presents the visual database schema model using Mermaid ER syntax, representing the logical structure, primary keys, foreign keys, and attributes as defined in Section 7.4 of the SRS.

---

## 1. High-Level Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    Patient {
        INT PatientID PK
        VARCHAR NIC UK
        VARCHAR FullName
        DATE DateOfBirth
        VARCHAR Gender
        VARCHAR Address
        VARCHAR Telephone
    }
    Case {
        INT CaseID PK
        INT PatientID FK
        VARCHAR CaseNumber UK
        VARCHAR CaseType
        DATETIME RegistrationDate
        VARCHAR Status
        INT AssignedOfficerID FK
        INT HospitalID FK
        INT WardID FK
        INT ReferralSourceTypeID FK
    }
    ClinicalExamination {
        INT ClinicalExamID PK
        INT CaseID FK
        INT ExaminerID FK
        DATETIME ExamDate
        TEXT Observations
        TEXT Diagnosis
    }
    PostmortemExamination {
        INT PostmortemID PK
        INT CaseID FK "Unique"
        INT ExaminerID FK
        DATETIME ExaminationDate
        TEXT Findings
        VARCHAR CauseOfDeath
    }
    Evidence {
        INT EvidenceID PK
        INT CaseID FK
        VARCHAR EvidenceType
        TEXT Description
        VARCHAR StorageLocation
    }
    ChainOfCustody {
        INT CustodyID PK
        INT EvidenceID FK
        INT TransferringOfficerID FK
        INT ReceivingOfficerID FK
        DATETIME TransferTimestamp
        VARCHAR Location
        VARCHAR ReasonForTransfer
    }
    LaboratoryRequest {
        INT LabRequestID PK
        INT CaseID FK
        DATETIME RequestDate
        VARCHAR Status
    }
    LaboratoryResult {
        INT LabResultID PK
        INT LabRequestID FK "Unique"
        TEXT Result
        DATETIME CompletionDate
    }
    MedicoLegalReport {
        INT ReportID PK
        INT CaseID FK
        VARCHAR ReportType
        VARCHAR ApprovalStatus
        INT ApprovedByID FK
        DATETIME ApprovalDate
    }
    User {
        INT UserID PK
        VARCHAR Username UK
        VARCHAR PasswordHash
        VARCHAR FullName
        VARCHAR Email
        BIT IsActive
    }
    Role {
        INT RoleID PK
        VARCHAR RoleName UK
        VARCHAR Description
    }
    Permission {
        INT PermissionID PK
        VARCHAR PermissionKey UK
        VARCHAR Description
    }
    UserRole {
        INT UserID PK, FK
        INT RoleID PK, FK
    }
    RolePermission {
        INT RoleID PK, FK
        INT PermissionID PK, FK
    }
    AuditLog {
        INT AuditID PK
        INT UserID FK
        VARCHAR Action
        DATETIME Timestamp
        VARCHAR IPAddress
    }
    Notification {
        INT NotificationID PK
        INT UserID FK
        VARCHAR Message
        BIT IsRead
        DATETIME CreatedTimestamp
    }
    Hospital {
        INT HospitalID PK
        VARCHAR HospitalName
    }
    Ward {
        INT WardID PK
        INT HospitalID FK
        VARCHAR WardName
    }
    ReferralSourceType {
        INT ReferralSourceTypeID PK
        VARCHAR TypeName UK
    }

    Patient ||--o{ Case : "registers"
    User ||--o{ Case : "assigned_to"
    Case ||--o{ ClinicalExamination : "evaluates"
    Case ||--|| PostmortemExamination : "autopsies"
    Case ||--o{ Evidence : "collects"
    Case ||--o{ LaboratoryRequest : "orders"
    Case ||--o{ MedicoLegalReport : "compiles"
    Evidence ||--o{ ChainOfCustody : "tracks"
    LaboratoryRequest ||--|| LaboratoryResult : "obtains"
    
    User ||--o{ UserRole : "has"
    Role ||--o{ UserRole : "belongs_to"
    Role ||--o{ RolePermission : "contains"
    Permission ||--o{ RolePermission : "contains"
    
    User ||--o{ ClinicalExamination : "conducts"
    User ||--o{ PostmortemExamination : "conducts"
    User ||--o{ AuditLog : "creates"
    User ||--o{ Notification : "reads"
    
    Hospital ||--o{ Ward : "contains"
    Hospital ||--o{ Case : "refers"
    Ward ||--o{ Case : "refers"
    ReferralSourceType ||--o{ Case : "categorizes"
```

---

## 2. Diagram Key & Notation Guide

The notation follows standard crow's foot notation:
* `||--o{` : One-to-Many (Optional on child side, mandatory on parent side).
* `||--||` : One-to-One (Mandatory on both sides).
* `PK` : Primary Key.
* `FK` : Foreign Key.
* `UK` : Unique Key constraint.
* `FK "Unique"`: Implements a 1:1 relationship by placing a unique constraint on the foreign key column.
