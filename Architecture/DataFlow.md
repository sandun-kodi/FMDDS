# Data Flow

This document details the flow of data through FMDDS component boundaries during key business processes, based on Sections 2.2, 7.5, and 10.2 of the SRS.

---

## 1. Case Intake & Registration Flow

This flow maps how a new medico-legal incident is ingested by a Clerk (`ROLE-006`) or Forensic Officer (`ROLE-004`), validating patient details and generating a Case Record.

```mermaid
sequenceDiagram
    autonumber
    actor Clerk as Clerical Staff
    participant UI as Presentation Layer (UI)
    participant Auth as Auth & Middleware
    participant Service as Case Service (BLL)
    participant Repo as Database Repo (DAL)
    participant DB as Relational Database (RDBMS)

    Clerk->>UI: Input Case Demographics & NIC
    UI->>UI: Validate mandatory fields locally
    UI->>Auth: POST /api/cases (with NIC & details)
    Auth->>Auth: Verify JWT Token & Clerk role permissions
    Auth->>Service: CreateCase(CaseDTO)
    
    Service->>Repo: Check Patient exists by NIC (BRL-006)
    Repo-->>Service: Patient Record (or NULL)
    
    alt Patient does not exist
        Service->>Repo: Create Patient Row
        Repo-->>Service: PatientID
    end

    Service->>Service: Generate CaseNumber (BRL-001)
    Service->>Repo: Insert Case Row (Status = 'Registered')
    Repo->>DB: INSERT INTO `Case` ...
    DB-->>Repo: CaseID & Success
    
    Service->>Repo: Write Security Audit Log (BRL-021)
    Repo->>DB: INSERT INTO `AuditLog` ...
    
    Service-->>UI: Return HTTP 201 (Created Case JSON + CaseNumber)
    UI-->>Clerk: Display Case Registry Success Panel
```

---

## 2. Clinical Examination & Diagnosis Flow

This flow covers a Medical Officer (`ROLE-003`) saving clinical findings for living patients.

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Medical Officer
    participant UI as Presentation Layer (UI)
    participant Service as Exam Service (BLL)
    participant Repo as Database Repo (DAL)
    participant DB as Relational Database (RDBMS)

    Doctor->>UI: Input examination details (MLEF observations)
    UI->>UI: Validate observations length > 0
    UI->>Service: POST /api/cases/{id}/clinical-exam
    
    Service->>Repo: Retrieve Case Status by ID
    Repo-->>Service: Case (Status: 'Assigned')
    
    alt Status transition valid (BRL-003)
        Service->>Repo: Insert ClinicalExamination Row
        Repo->>DB: INSERT INTO `ClinicalExamination` ...
        Service->>Repo: Update Case Status to 'Examination In Progress'
        Repo->>DB: UPDATE `Case` SET Status = 'In Progress' ...
        Service->>Repo: Write Audit Log (BRL-021)
        Repo->>DB: INSERT INTO `AuditLog` ...
        DB-->>Service: Transaction Success
        Service-->>UI: HTTP 200 (Success)
        UI-->>Doctor: Display "Examination Saved"
    else Invalid Status Transition
        Service-->>UI: HTTP 400 (Bad Request - Invalid Status Transition)
        UI-->>Doctor: Display error alert
    end
```

---

## 3. Evidence Chain of Custody Transfer Flow

Illustrates how physical evidence changes hands between Forensic Officers and Laboratory Staff.

```mermaid
sequenceDiagram
    autonumber
    actor FO as Forensic Officer
    actor Lab as Laboratory Staff
    participant UI as Presentation Layer (UI)
    participant Service as Evidence Service (BLL)
    participant Repo as Database Repo (DAL)
    participant DB as Relational Database (RDBMS)

    FO->>UI: Initiate Custody Transfer to Lab Staff
    UI->>Service: POST /api/evidence/{id}/transfer
    
    Service->>Service: Verify users exist & roles are valid
    Service->>Repo: Insert ChainOfCustody Entry (BRL-012)
    Repo->>DB: INSERT INTO `ChainOfCustody` (EvidenceID, TransferringOfficerID, ReceivingOfficerID, Location, Reason)
    
    Service->>Repo: Update Evidence Status (e.g. 'Awaiting Analysis')
    Repo->>DB: UPDATE `Evidence` ...
    
    Service->>Repo: Insert system notification for Lab Staff
    Repo->>DB: INSERT INTO `Notification` ...
    
    DB-->>Service: Commit Transaction (BRL-025)
    Service-->>UI: HTTP 200 (Custody Updated)
    UI-->>FO: Refresh custody history log
```
