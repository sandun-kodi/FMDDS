# Acceptance Testing Strategy

This document defines the User Acceptance Testing (UAT) criteria and Given-When-Then verification scenarios for FMDDS, ensuring system features satisfy the department's medico-legal requirements, based on Section 14 of the SRS.

---

## 1. Acceptance Testing Protocol

User Acceptance Testing (UAT) is the final validation phase where forensic practitioners (Judicial Medical Officers, Medical Officers, Forensic Officers, Clerks) verify system behaviors against daily operational scenarios.
* **Standard Representation**: Test cases are specified using **Gherkin Syntax (Given-When-Then)** to bridge the gap between technical developers and medical stakeholders.
* **UAT Sign-off Criterion**: All priority "Critical" and "High" functional scenarios must run successfully with zero errors. Minor UI alignment discrepancies may be logged as backlog tasks for subsequent sprints.

---

## 2. Gherkin Acceptance Scenarios

### Scenario 1: Case Registration and Demographic Intake
* **Goal**: Validate that clerical staff can register a new case file.
* **Traceability**: `US-001`, `FR-005`, `BRL-002`.
* **Gherkin**:
  * **Given** a Clerical Staff user is authenticated and navigating the `SCR-004` (Case Registration) screen
  * **When** they enter a valid Sri Lankan NIC `199012345678`, full name `Nimal Perera`, gender `Male`, select `Clinical Forensic` case type, and click "Submit"
  * **Then** the database inserts the patient and case records, generates a unique Case Number matching `COL/2026/CL/XXXX`, and displays a "Case Registered Successfully" confirmation banner.

### Scenario 2: Clinical Examination observation lockouts
* **Goal**: Prevent editing clinical details after cases are Closed.
* **Traceability**: `FR-007`, `BRL-004`, `BRL-017`.
* **Gherkin**:
  * **Given** a case with status `Closed` exists in the system
  * **When** a Medical Officer attempts to save clinical observations or upload photos for that case ID
  * **Then** the system blocks the update action, returns an error dialog stating "This case is closed and read-only", and logs the unauthorized attempt in the security audit log.

### Scenario 3: JMO Report Approval and Immutability
* **Goal**: Lock finalized postmortem reports for court submission.
* **Traceability**: `US-003`, `FR-020`, `BRL-010`, `BRL-017`.
* **Gherkin**:
  * **Given** an autopsy case where postmortem findings and Causes of Death are fully completed
  * **When** an authenticated Judicial Medical Officer (JMO) clicks "Approve and Sign" on the report preview screen
  * **Then** the report status is updated to `Approved`, the system locks all autopsy input fields as read-only, generates a static PDF copy with the JMO's signature stamp, and transitions the Case status to `Closed`.

---

## 3. UAT Execution and Validation Steps

1. **Test Data Sandbox**: Populate the UAT environment with anonymized patient profiles and mock cases (`Database/SeedData.md`). Real patient case files must not be used for UAT.
2. **Practitioner Walkthrough Sessions**: Set up validation days where Clerks register cases, Doctors input findings, and JMOs sign off reports.
3. **Traceability Log**: Record all UAT outcomes in the Requirements Traceability Matrix (RTM) before the system is marked as Ready for Staging/Production deployment.
