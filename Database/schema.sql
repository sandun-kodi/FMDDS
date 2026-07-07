-- Forensic Medicine Department Database System (FMDDS)
-- Database Schema Script (PostgreSQL Target)
-- Author: Lead Software Architect & Database Engineer
-- Date: 2026-07-05
-- Tags: #database #security

-- Clean up existing database objects to allow clean reinstall
DROP VIEW IF EXISTS VW_CaseSummary CASCADE;
DROP VIEW IF EXISTS VW_OpenCases CASCADE;

DROP TABLE IF EXISTS Notification CASCADE;
DROP TABLE IF EXISTS AuditLog CASCADE;
DROP TABLE IF EXISTS MedicoLegalReport CASCADE;
DROP TABLE IF EXISTS LaboratoryResult CASCADE;
DROP TABLE IF EXISTS LaboratoryRequest CASCADE;
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
    CONSTRAINT UQ_User_Username UNIQUE (Username)
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
    CauseOfDeath VARCHAR(255) NOT NULL,
    ExamDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_PostmortemExam_CaseID UNIQUE (CaseID),
    CONSTRAINT FK_PostmortemExam_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PostmortemExam_User FOREIGN KEY (ExaminerID) REFERENCES "User" (UserID) ON UPDATE CASCADE ON DELETE RESTRICT
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

CREATE TABLE LaboratoryRequest (
    LabRequestID SERIAL PRIMARY KEY,
    CaseID INT NOT NULL,
    RequestDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    CONSTRAINT FK_LabRequest_Case FOREIGN KEY (CaseID) REFERENCES "Case" (CaseID) ON UPDATE CASCADE ON DELETE RESTRICT,
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
-- 6. Notifications & Logs
--------------------------------------------------------------------------------

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
CREATE INDEX IX_MedicoLegalReport_ApprovalStatus ON MedicoLegalReport (ApprovalStatus);
CREATE INDEX IX_AuditLog_UserID_Timestamp ON AuditLog (UserID, Timestamp);

--------------------------------------------------------------------------------
-- 8. Relational Views Definition
--------------------------------------------------------------------------------

CREATE OR REPLACE VIEW VW_OpenCases AS
SELECT 
    CaseID,
    CaseNumber,
    CaseType,
    RegistrationDate,
    Status,
    AssignedOfficerID
FROM "Case"
WHERE Status NOT IN ('Closed', 'Archived');

CREATE OR REPLACE VIEW VW_CaseSummary AS
SELECT 
    c.CaseID,
    c.CaseNumber,
    c.CaseType,
    c.RegistrationDate,
    c.Status,
    p.FullName AS PatientName,
    p.NIC AS PatientNIC,
    u.FullName AS AssignedOfficerName,
    h.HospitalName,
    w.WardName
FROM "Case" c
INNER JOIN Patient p ON c.PatientID = p.PatientID
LEFT JOIN "User" u ON c.AssignedOfficerID = u.UserID
LEFT JOIN Hospital h ON c.HospitalID = h.HospitalID
LEFT JOIN Ward w ON c.WardID = w.WardID;
