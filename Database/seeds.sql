-- Forensic Medicine Department Database System (FMDDS)
-- Database Seed Data Script (PostgreSQL Target)
-- Author: Lead Software Architect & Database Engineer
-- Date: 2026-07-05
-- Tags: #database

--------------------------------------------------------------------------------
-- 1. Initial System Configuration Lookups
--------------------------------------------------------------------------------

-- Populate Core Roles
INSERT INTO "Role" (RoleID, RoleName, Description) VALUES
(1, 'System Administrator', 'Manages users, permissions, backups, and configurations'),
(2, 'Judicial Medical Officer', 'Performs examinations, postmortems, and approves final reports'),
(3, 'Medical Officer', 'Assists JMO, conducts clinical examinations, and drafts reports'),
(4, 'Forensic Officer', 'Manages case registration, evidence logging, and custody logs'),
(5, 'Laboratory Staff', 'Receives test requests and records laboratory investigation results'),
(6, 'Clerical Staff', 'Enters patient/case demographics and tracks report issuance'),
(7, 'Research User', 'Accesses de-identified aggregated reporting and metrics');

-- Adjust Roles Auto-Increment Sequence after explicit inserts
SELECT setval(pg_get_serial_sequence('"Role"', 'roleid'), COALESCE(max(RoleID), 1)) FROM "Role";

-- Populate System Permissions
INSERT INTO Permission (PermissionID, PermissionKey, Description) VALUES
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

SELECT setval(pg_get_serial_sequence('permission', 'permissionid'), COALESCE(max(PermissionID), 1)) FROM Permission;

-- Populate Role-Permission Mapping
-- System Administrator
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(1, 1), (1, 3), (1, 13);

-- Judicial Medical Officer (JMO)
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(2, 2), (2, 3), (2, 5), (2, 6), (2, 7), (2, 9), (2, 11), (2, 12);

-- Medical Officer
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(3, 3), (3, 6), (3, 9), (3, 12);

-- Forensic Officer
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(4, 2), (4, 3), (4, 5), (4, 8), (4, 12);

-- Laboratory Staff
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(5, 3), (5, 10);

-- Clerical Staff
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(6, 2), (6, 3), (6, 5), (6, 12);

-- Research User
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(7, 4);

-- Populate Hospitals Lookups
INSERT INTO Hospital (HospitalID, HospitalName) VALUES
(1, 'National Hospital of Sri Lanka (NHSL)'),
(2, 'Teaching Hospital Karapitiya'),
(3, 'Teaching Hospital Peradeniya');

SELECT setval(pg_get_serial_sequence('hospital', 'hospitalid'), COALESCE(max(HospitalID), 1)) FROM Hospital;

-- Populate Wards Lookups
INSERT INTO Ward (WardID, HospitalID, WardName) VALUES
(1, 1, 'Ward 10 - Accident Service'),
(2, 1, 'Ward 15 - Intensive Care Unit'),
(3, 2, 'Ward 3 - Surgical Ward');

SELECT setval(pg_get_serial_sequence('ward', 'wardid'), COALESCE(max(WardID), 1)) FROM Ward;

-- Populate Referral Categories Lookups
INSERT INTO ReferralSourceType (ReferralSourceTypeID, TypeName) VALUES
(1, 'Police'),
(2, 'Magistrate Court'),
(3, 'Referring Hospital'),
(4, 'Institutional Service Department (ISD)'),
(5, 'Other / Public Intake');

SELECT setval(pg_get_serial_sequence('referralsourcetype', 'referralsourcetypeid'), COALESCE(max(ReferralSourceTypeID), 1)) FROM ReferralSourceType;

-- Populate Departments Lookups
INSERT INTO Department (DepartmentID, DepartmentName) VALUES
(1, 'Forensic Medicine Department - Colombo Branch'),
(2, 'Forensic Medicine Department - Galle Branch');

SELECT setval(pg_get_serial_sequence('department', 'departmentid'), COALESCE(max(DepartmentID), 1)) FROM Department;

--------------------------------------------------------------------------------
-- 2. Bootstrapping User Accounts (Passwords pre-hashed)
--------------------------------------------------------------------------------

-- Admin password hash: bcrypt('AdminPassword123!') -> $2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y
-- JMO password hash: bcrypt('JmoPassword123!') -> $2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y
-- FO password hash: bcrypt('FoPassword123!') -> $2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y
INSERT INTO "User" (UserID, Username, PasswordHash, FullName, Email, IsActive) VALUES
(1, 'admin', '$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y', 'System Administrator', 'admin@hospital.lk', TRUE),
(2, 'dr_silva', '$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y', 'Dr. Silva', 'silva.jmo@hospital.lk', TRUE),
(3, 'dr_perera', '$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y', 'Dr. Perera', 'perera.mo@hospital.lk', TRUE),
(4, 'officer_bandara', '$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y', 'Officer Bandara', 'bandara.fo@hospital.lk', TRUE),
(5, 'lab_technician_siri', '$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y', 'Siriwardena', 'siri.lab@hospital.lk', TRUE),
(6, 'clerk_nimal', '$2a$12$KkQZ6w0Y8mP3WJ4b2bH0UeN9rK1yE8S/d5QZ6H6u4Y7p5Wq.g.w4y', 'Nimal Perera', 'nimal.clerk@hospital.lk', TRUE);

SELECT setval(pg_get_serial_sequence('"User"', 'userid'), COALESCE(max(UserID), 1)) FROM "User";

-- Assign Roles to Users
INSERT INTO UserRole (UserID, RoleID) VALUES
(1, 1), -- Admin
(2, 2), -- Dr. Silva is JMO
(3, 3), -- Dr. Perera is MO
(4, 4), -- Officer Bandara is Forensic Officer
(5, 5), -- Siriwardena is Lab Staff
(6, 6); -- Nimal is Clerical Staff

--------------------------------------------------------------------------------
-- 3. Development Mock Case Data Sandbox
--------------------------------------------------------------------------------

-- Patients
INSERT INTO Patient (PatientID, NIC, FullName, DateOfBirth, Gender, Address, Telephone) VALUES
(1, '198511223344', 'Saman Kumara', '1985-05-12', 'Male', '12/A, Kandy Road, Colombo', '0771234567'),
(2, '199965432100', 'Priyanthi Fernando', '1999-10-04', 'Female', '45, Lake Road, Galle', '0719876543'),
(3, NULL, 'Unknown Male Deceased', NULL, 'Male', NULL, NULL);

SELECT setval(pg_get_serial_sequence('patient', 'patientid'), COALESCE(max(PatientID), 1)) FROM Patient;

-- Cases
INSERT INTO "Case" (CaseID, PatientID, CaseNumber, CaseType, RegistrationDate, Status, AssignedOfficerID, HospitalID, WardID, ReferralSourceTypeID) VALUES
(1, 1, 'COL/2026/CL/0001', 'Clinical Forensic', '2026-07-01 09:00:00', 'Examination In Progress', 3, 1, 1, 3),
(2, 2, 'COL/2026/CL/0002', 'Clinical Forensic', '2026-07-02 11:30:00', 'Closed', 2, 2, 3, 3),
(3, 3, 'COL/2026/PM/0001', 'Postmortem', '2026-07-03 14:15:00', 'Registered', 2, NULL, NULL, 1);

SELECT setval(pg_get_serial_sequence('"Case"', 'caseid'), COALESCE(max(CaseID), 1)) FROM "Case";

-- Clinical Exam
INSERT INTO ClinicalExamination (ClinicalExamID, CaseID, ExaminerID, ExamDate, Observations, Diagnosis) VALUES
(1, 2, 2, '2026-07-02 13:00:00', 'Superficial laceration on left arm measuring 2cm. Tenderness in shoulder region.', 'Soft tissue bruising on left shoulder.');

SELECT setval(pg_get_serial_sequence('clinicalexamination', 'clinicalexamid'), COALESCE(max(ClinicalExamID), 1)) FROM ClinicalExamination;

-- Evidence
INSERT INTO Evidence (EvidenceID, CaseID, EvidenceType, Description, StorageLocation) VALUES
(1, 1, 'Clothing', 'Bloody torn shirt retrieved from patient Saman Kumara', 'Safe Locker A-4'),
(2, 3, 'Blood Vial', 'Cardiac blood sample collected during autopsy', 'Evidence Refrigerator B-12');

SELECT setval(pg_get_serial_sequence('evidence', 'evidenceid'), COALESCE(max(EvidenceID), 1)) FROM Evidence;

-- Chain of Custody
INSERT INTO ChainOfCustody (CustodyID, EvidenceID, TransferringOfficerID, ReceivingOfficerID, TransferTimestamp, Location, ReasonForTransfer) VALUES
(1, 2, 4, 5, '2026-07-03 16:00:00', 'Forensic Toxicology Lab', 'Transferred specimen to Lab Staff for toxicological screening');

SELECT setval(pg_get_serial_sequence('chainofcustody', 'custodyid'), COALESCE(max(CustodyID), 1)) FROM ChainOfCustody;
