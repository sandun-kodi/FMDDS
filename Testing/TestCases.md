# System Test Cases

This document details the functional and security test cases for the FMDDS, mapping every major requirement to a test verification script to ensure traceabiliy, based on Sections 8.2 and 8.5 of the SRS.

---

## 1. Test Verification Matrix

| Test Case ID | Test Category | Target Functional Requirement | Target Business Rule | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-001** | Security / Auth | `FR-001` (Authentication) | `BRL-019` | Critical |
| **TC-AUTH-002** | Security / Auth | `FR-001` (Authentication) | `BRL-020` (Lockout) | High |
| **TC-CASE-001** | Case / Patient | `FR-005` (Registration) | `BRL-002` (Mandatory) | Critical |
| **TC-CASE-002** | Case / Patient | `FR-005` (Registration) | `BRL-001` (Unique No) | Critical |
| **TC-CASE-003** | Case / Patient | `FR-008` (Status Mgmt) | `BRL-003` (Transitions) | Critical |
| **TC-EXAM-001** | Medical Exam | `FR-011` (Clinical Exam) | `BRL-007`, `BRL-008` | Critical |
| **TC-EXAM-002** | Medical Exam | `FR-013` (Autopsy Exam) | `BRL-009`, `BRL-010` | Critical |
| **TC-EVID-001** | Logistics | `FR-016` (Chain of Custody)| `BRL-012` (Custody Log) | Critical |
| **TC-LAB-001** | Logistics | `FR-018` (Lab Results) | `BRL-015` (Validation) | High |
| **TC-REP-001** | Reports Engine | `FR-020` (Report Approval) | `BRL-016`, `BRL-017` | Critical |
| **TC-AUD-001** | Administration | `FR-022` (Audit Logging) | `BRL-021`, `BRL-022` | Critical |

---

## 2. Test Specifications

### TC-AUTH-001: Valid User Login
* **Description**: Verifies that active system users can log in successfully.
* **Preconditions**: User account `dr_silva` exists, is active, and has JMO role.
* **Execution Steps**:
  1. Navigate to the login screen `SCR-001`.
  2. Input username `dr_silva` and password `JmoPassword123!`.
  3. Click "Log In".
* **Expected Outcome**: HTTP 200 returned. User is redirected to `SCR-002` (JMO Dashboard) showing user profile details ("Dr. Silva - Judicial Medical Officer").

### TC-AUTH-002: User Account Lockout
* **Description**: Verifies that accounts lock temporarily after multiple invalid attempts (`BRL-020`).
* **Preconditions**: User account `officer_bandara` exists and is unlocked.
* **Execution Steps**:
  1. Input username `officer_bandara` and incorrect password `WrongPassword`.
  2. Repeat step 1 five (5) consecutive times.
* **Expected Outcome**: On the 5th attempt, the backend returns HTTP 403 `ERR_ACCOUNT_LOCKED`. Database column `IsLocked` is set to `TRUE`. Subsequent logins with correct password are rejected.

### TC-CASE-001: Case Registration Mandatory Inputs
* **Description**: Enforces that cases cannot be registered with missing inputs (`BRL-002`).
* **Execution Steps**:
  1. Navigate to case registration `SCR-004`.
  2. Leave `PatientID` and `CaseType` empty.
  3. Click "Register Case".
* **Expected Outcome**: Client-side validation blocks submit, highlighting missing fields in red. If API is called directly, backend returns HTTP 400 `ERR_SCHEMA_VALIDATION_FAILED`.

### TC-CASE-003: Case Status Transitions
* **Description**: Enforces strict lifecycle status validation (`BRL-003`).
* **Execution Steps**:
  1. Retrieve a case with status `Registered`.
  2. Attempt to update status directly to `Closed` (PUT `/api/v1/cases/{id}/status` payload: `{"status": "Closed"}`).
* **Expected Outcome**: Backend rejects transaction with HTTP 400 `ERR_INVALID_STATUS_TRANSITION`. Case status remains `Registered`.

### TC-EXAM-002: Autopsy Validation (Cause of Death)
* **Description**: Enforces JMOs to provide Causes of Death (COD) during autopsy submission.
* **Execution Steps**:
  1. Log in as JMO `dr_silva`.
  2. Open autopsy case in `SCR-006`.
  3. Complete internal organ findings. Leave Cause of Death field empty.
  4. Click "Submit".
* **Expected Outcome**: System prompts validation error "Cause of Death is mandatory". Database transaction is rolled back.

### TC-REP-001: Approved Report Immutability
* **Description**: Validates that approved legal reports lock as read-only (`BRL-017`).
* **Preconditions**: Report `RP-COL-009` has approval status `Approved`.
* **Execution Steps**:
  1. Attempt to update observations in the approved report via API PUT.
* **Expected Outcome**: Backend rejects with HTTP 400 `ERR_CASE_CLOSED` or `ERR_REPORT_APPROVED`. No modifications are committed.
