-- Forensic Medicine Department Database System (FMDDS)
-- Database Schema Script (PostgreSQL Target)
-- Author: Lead Software Architect & Database Engineer
-- Date: 2026-07-05
-- Tags: #database #security

-- Clean up existing database objects to allow clean reinstall
DROP VIEW IF EXISTS VW_UserRoles CASCADE;
DROP VIEW IF EXISTS VW_ReportSummary CASCADE;
DROP VIEW IF EXISTS VW_LaboratoryStatus CASCADE;
DROP VIEW IF EXISTS VW_CaseSummary CASCADE;
DROP VIEW IF EXISTS VW_OpenCases CASCADE;

DROP TABLE IF EXISTS Notification CASCADE;
DROP TABLE IF EXISTS AuditLog CASCADE;
DROP TABLE IF EXISTS SystemSetting CASCADE;
DROP TABLE IF EXISTS CauseOfDeathRecord CASCADE;
DROP TABLE IF EXISTS Attachment CASCADE;
DROP TABLE IF EXISTS LoginAttempt CASCADE;
DROP TABLE IF EXISTS MedicoLegalReport CASCADE;
DROP TABLE IF EXISTS LaboratoryResult CASCADE;
DROP TABLE IF EXISTS LaboratoryRequest CASCADE;
DROP TABLE IF EXISTS LaboratoryTestType CASCADE;
DROP TABLE IF EXISTS ChainOfCustody CASCADE;
DROP TABLE IF EXISTS Evidence CASCADE;
DROP TABLE IF EXISTS PostmortemExamination CASCADE;
DROP TABLE IF EXISTS ClinicalExamination CASCADE;
DROP TABLE IF EXISTS "Case" CASCADE;
DROP TABLE IF EXISTS ReferralSourceType CASCADE;
DROP TABLE IF EXISTS Ward CASCADE;
DROP TABLE IF EXISTS Hospital CASCADE;
DROP TABLE IF EXISTS Department CASCADE;
DROP TABLE IF EXISTS Patient CASCADE;
DROP TABLE IF EXISTS RolePermission CASCADE;
DROP TABLE IF EXISTS UserRole CASCADE;
DROP TABLE IF EXISTS Permission CASCADE;
DROP TABLE IF EXISTS "Role" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

--------------------------------------------------------------------------------
-- 1. Security, Authorization & Users Tables
--------------------------------------------------------------------------------

CREATE TABLE "User" (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(120) NOT NULL,
    Email VARCHAR(150) NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    FailedLoginCount INT NOT NULL DEFAULT 0,
    LockoutEnd TIMESTAMP NULL,
    CONSTRAINT UQ_User_Username UNIQUE (Username)
);

CREATE TABLE LoginAttempt (
    AttemptID SERIAL PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    IPAddress VARCHAR(50) NULL,
    AttemptDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IsSuccess BOOLEAN NOT NULL
);

CREATE TABLE "Role" (
    RoleID SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    CONSTRAINT UQ_Role_RoleName UNIQUE (RoleName)
);

CREATE TABLE Permission (
    PermissionID SERIAL PRIMARY KEY,
    PermissionKey VARCHAR(100) NOT NULL,
    Description VARCHAR(255) NULL,
    CONSTRAINT UQ_Permission_PermissionKey UNIQUE (PermissionKey)
);

CREATE TABLE UserRole (
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    PRIMARY KEY (UserID, RoleID),
    CONSTRAINT FK_UserRole_User FOREIGN KEY (UserID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_UserRole_Role FOREIGN KEY (RoleID) REFERENCES "Role" (RoleID) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE RolePermission (
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    PRIMARY KEY (RoleID, PermissionID),
    CONSTRAINT FK_RolePermission_Role FOREIGN KEY (RoleID) REFERENCES "Role" (RoleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_RolePermission_Permission FOREIGN KEY (PermissionID) REFERENCES Permission (PermissionID) ON UPDATE CASCADE ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 2. Patient & Referring Facility Tables
--------------------------------------------------------------------------------

CREATE TABLE Patient (
    PatientID SERIAL PRIMARY KEY,
    NIC VARCHAR(20) NULL,
    FullName VARCHAR(150) NOT NULL,
    DateOfBirth DATE NULL,
    Gender VARCHAR(20) NOT NULL,
    Address VARCHAR(300) NULL,
    Telephone VARCHAR(20) NULL,
    CONSTRAINT UQ_Patient_NIC UNIQUE (NIC),
    CONSTRAINT CK_Patient_Gender CHECK (Gender IN ('Male', 'Female', 'Other'))
);

CREATE TABLE Hospital (
    HospitalID SERIAL PRIMARY KEY,
    HospitalName VARCHAR(150) NOT NULL
);

CREATE TABLE Ward (
    WardID SERIAL PRIMARY KEY,
    HospitalID INT NOT NULL,
    WardName VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Ward_Hospital FOREIGN KEY (HospitalID) REFERENCES Hospital (HospitalID) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE ReferralSourceType (
    ReferralSourceTypeID SERIAL PRIMARY KEY,
    TypeName VARCHAR(100) NOT NULL,
    CONSTRAINT UQ_ReferralSourceType_TypeName UNIQUE (TypeName)
);

CREATE TABLE Department (
    DepartmentID SERIAL PRIMARY KEY,
    DepartmentName VARCHAR(100) NOT NULL
);

--------------------------------------------------------------------------------
-- 3. Case Tracking & Intake Tables
--------------------------------------------------------------------------------

CREATE TABLE "Case" (
    CaseID SERIAL PRIMARY KEY,
    PatientID INT NOT NULL,
    CaseNumber VARCHAR(30) NOT NULL,
    CaseType VARCHAR(50) NOT NULL,
    RegistrationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(30) NOT NULL DEFAULT 'Registered',
    AssignedOfficerID INT NULL,
    HospitalID INT NULL,
    WardID INT NULL,
    ReferralSourceTypeID INT NULL,
    CONSTRAINT UQ_Case_CaseNumber UNIQUE (CaseNumber),
    CONSTRAINT FK_Case_Patient FOREIGN KEY (PatientID) REFERENCES Patient (PatientID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Case_User FOREIGN KEY (AssignedOfficerID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Case_Hospital FOREIGN KEY (HospitalID) REFERENCES Hospital (HospitalID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Case_Ward FOREIGN KEY (WardID) REFERENCES Ward (WardID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Case_ReferralSourceType FOREIGN KEY (ReferralSourceTypeID) REFERENCES ReferralSourceType (ReferralSourceTypeID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_Case_CaseType CHECK (CaseType IN ('Clinical Forensic', 'Postmortem')),
    CONSTRAINT CK_Case_Status CHECK (Status IN (
        'Registered', 'Assigned', 'Examination In Progress',
        'Laboratory Pending', 'Report Preparation', 'Report Approved',
        'Closed', 'Archived'
    )),
    CONSTRAINT CK_Case_RegistrationDate CHECK (RegistrationDate <= CURRENT_TIMESTAMP)
);

--------------------------------------------------------------------------------
-- 4. Medical Examinations & Reports
--------------------------------------------------------------------------------

CREATE TABLE ClinicalExamination (
    ClinicalExamID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    ExaminerID INT NOT NULL,
    ExamDate TIMESTAMP NOT NULL,
    Observations TEXT NOT NULL,
    Diagnosis TEXT NULL,
    CONSTRAINT UQ_ClinicalExamination_CaseID UNIQUE (CaseID),
    CONSTRAINT FK_ClinicalExam_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_ClinicalExam_User FOREIGN KEY (ExaminerID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE PostmortemExamination (
    PostmortemID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    ExaminerID INT NOT NULL,
    Findings TEXT NOT NULL,
    CauseOfDeath VARCHAR(255) NULL,
    CONSTRAINT UQ_PostmortemExam_CaseID UNIQUE (CaseID),
    CONSTRAINT FK_PostmortemExam_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PostmortemExam_User FOREIGN KEY (ExaminerID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE CauseOfDeathRecord (
    CauseID SERIAL PRIMARY KEY,
    PostmortemID INT NOT NULL,
    RecordType VARCHAR(50) NOT NULL DEFAULT 'Final',
    Category VARCHAR(50) NOT NULL,
    Description TEXT NOT NULL,
    CONSTRAINT FK_CauseOfDeath_Postmortem FOREIGN KEY (PostmortemID) REFERENCES PostmortemExamination (PostmortemID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT CK_Cause_RecordType CHECK (RecordType IN ('Provisional', 'Final')),
    CONSTRAINT CK_Cause_Category CHECK (Category IN ('Immediate', 'Antecedent', 'Underlying', 'Manner of Death', 'Other'))
);

CREATE TABLE MedicoLegalReport (
    ReportID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    ReportType VARCHAR(50) NOT NULL,
    ApprovalStatus VARCHAR(30) NOT NULL DEFAULT 'Draft',
    ApprovedByID INT NULL,
    ApprovalDate TIMESTAMP NULL,
    CONSTRAINT FK_Report_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Report_User FOREIGN KEY (ApprovedByID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_Report_ApprovalStatus CHECK (ApprovalStatus IN ('Draft', 'Approved'))
);

CREATE TABLE Attachment (
    AttachmentID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    UploadedByID INT NOT NULL,
    UploadDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Description TEXT NULL,
    CONSTRAINT FK_Attachment_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_Attachment_User FOREIGN KEY (UploadedByID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT
);

--------------------------------------------------------------------------------
-- 5. Evidence & Laboratory Requests
--------------------------------------------------------------------------------

CREATE TABLE Evidence (
    EvidenceID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    EvidenceType VARCHAR(100) NOT NULL,
    Description TEXT NULL,
    StorageLocation VARCHAR(150) NULL,
    CONSTRAINT FK_Evidence_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE ChainOfCustody (
    CustodyID SERIAL PRIMARY KEY,
    EvidenceID INT NOT NULL,
    TransferringOfficerID INT NOT NULL,
    ReceivingOfficerID INT NOT NULL,
    TransferTimestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Location VARCHAR(150) NOT NULL,
    ReasonForTransfer VARCHAR(255) NOT NULL,
    CONSTRAINT FK_Custody_Evidence FOREIGN KEY (EvidenceID) REFERENCES Evidence (EvidenceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_Custody_User_Sender FOREIGN KEY (TransferringOfficerID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Custody_User_Receiver FOREIGN KEY (ReceivingOfficerID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE LaboratoryTestType (
    TestTypeID SERIAL PRIMARY KEY,
    TestName VARCHAR(100) NOT NULL,
    Description TEXT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT UQ_LabTestType_Name UNIQUE (TestName)
);

CREATE TABLE LaboratoryRequest (
    LabRequestID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    TestTypeID INT NULL,
    RequestDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    CONSTRAINT FK_LabRequest_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_LabRequest_TestType FOREIGN KEY (TestTypeID) REFERENCES LaboratoryTestType (TestTypeID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CK_LabRequest_Status CHECK (Status IN ('Pending', 'Processing', 'Completed'))
);

CREATE TABLE LaboratoryResult (
    LabResultID SERIAL PRIMARY KEY,
    LabRequestID INT NOT NULL,
    Result TEXT NULL,
    CompletionDate TIMESTAMP NULL,
    CONSTRAINT UQ_LabResult_LabRequest UNIQUE (LabRequestID),
    CONSTRAINT FK_LabResult_LabRequest FOREIGN KEY (LabRequestID) REFERENCES LaboratoryRequest (LabRequestID) ON UPDATE CASCADE ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 6. Notifications, Logs & Admin
--------------------------------------------------------------------------------

CREATE TABLE SystemSetting (
    SettingID SERIAL PRIMARY KEY,
    SettingKey VARCHAR(100) NOT NULL,
    SettingValue VARCHAR(500) NOT NULL,
    Description TEXT NULL,
    LastUpdatedByID INT NULL,
    LastUpdatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_SystemSetting_Key UNIQUE (SettingKey),
    CONSTRAINT FK_SystemSetting_User FOREIGN KEY (LastUpdatedByID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE AuditLog (
    AuditID SERIAL PRIMARY KEY,
    UserID INT NULL,
    Action VARCHAR(100) NOT NULL,
    Timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IPAddress VARCHAR(50) NULL,
    CONSTRAINT FK_AuditLog_User FOREIGN KEY (UserID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Notification (
    NotificationID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    Message VARCHAR(255) NOT NULL,
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedTimestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notification_User FOREIGN KEY (UserID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 7. Secondary Index Mappings
--------------------------------------------------------------------------------

CREATE INDEX IX_Patient_FullName ON Patient (FullName);
CREATE INDEX IX_Case_PatientID ON "Case" (PatientID);
CREATE INDEX IX_Case_Status ON "Case" (Status);
CREATE INDEX IX_Case_RegistrationDate ON "Case" (RegistrationDate);
CREATE INDEX IX_Case_HospitalID ON "Case" (HospitalID);
CREATE INDEX IX_Case_WardID ON "Case" (WardID);
CREATE INDEX IX_Ward_HospitalID ON Ward (HospitalID);
CREATE INDEX IX_Evidence_CaseID ON Evidence (CaseID);
CREATE INDEX IX_ChainOfCustody_EvidenceID ON ChainOfCustody (EvidenceID);
CREATE INDEX IX_LabRequest_CaseID ON LaboratoryRequest (CaseID);
CREATE INDEX IX_LabRequest_TestTypeID ON LaboratoryRequest (TestTypeID);
CREATE INDEX IX_MedicoLegalReport_ApprovalStatus ON MedicoLegalReport (ApprovalStatus);
CREATE INDEX IX_AuditLog_UserID_Timestamp ON AuditLog (UserID, Timestamp);
CREATE INDEX IX_LoginAttempt_Username_Date ON LoginAttempt (Username, AttemptDate);
CREATE INDEX IX_Attachment_CaseID ON Attachment (CaseID);
CREATE INDEX IX_CauseOfDeath_PostmortemID ON CauseOfDeathRecord (PostmortemID);

--------------------------------------------------------------------------------
-- 8. Relational Views Definition
--------------------------------------------------------------------------------

CREATE OR REPLACE VIEW VW_OpenCases AS
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
FROM "Case" c
INNER JOIN Patient p ON c.PatientID = p.PatientID
LEFT JOIN "User" u ON c.AssignedOfficerID = u.UserID
WHERE c.Status NOT IN ('Closed', 'Archived');

CREATE OR REPLACE VIEW VW_CaseSummary AS
SELECT
    c.CaseID,
    c.CaseNumber,
    c.CaseType,
    c.Status,
    c.RegistrationDate,
    p.FullName AS PatientName,
    p.Gender,
    p.NIC AS PatientNIC,
    ce.ExamDate AS ClinicalExamDate,
    ce.Diagnosis AS ClinicalDiagnosis,
    pe.ExamDate AS AutopsyDate,
    pe.CauseOfDeath AS AutopsyCauseOfDeath
FROM "Case" c
INNER JOIN Patient p ON c.PatientID = p.PatientID
LEFT JOIN ClinicalExamination ce ON c.CaseID = ce.CaseID
LEFT JOIN PostmortemExamination pe ON c.CaseID = pe.CaseID;

CREATE OR REPLACE VIEW VW_LaboratoryStatus AS
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
FROM LaboratoryRequest lr
INNER JOIN "Case" c ON lr.CaseID = c.CaseID
LEFT JOIN LaboratoryResult res ON lr.LabRequestID = res.LabRequestID;

CREATE OR REPLACE VIEW VW_ReportSummary AS
SELECT
    r.ReportID,
    r.CaseID,
    c.CaseNumber,
    r.ReportType,
    r.ApprovalStatus,
    r.ApprovalDate,
    u.UserID AS ApproverID,
    u.FullName AS ApproverName
FROM MedicoLegalReport r
INNER JOIN "Case" c ON r.CaseID = c.CaseID
LEFT JOIN "User" u ON r.ApprovedByID = u.UserID;

CREATE OR REPLACE VIEW VW_UserRoles AS
SELECT
    u.UserID,
    u.Username,
    u.FullName AS UserFullName,
    u.IsActive,
    r.RoleID,
    r.RoleName,
    r.Description AS RoleDescription
FROM "User" u
INNER JOIN UserRole ur ON u.UserID = ur.UserID
INNER JOIN "Role" r ON ur.RoleID = r.RoleID;
