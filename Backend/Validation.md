# Backend Input Validation Specification

This document defines the input validation rules, regular expressions, and server-side checks required for FMDDS data entry, based on Section 9.4 and Section 9.6 of the SRS.

---

## 1. Demographic & System Formats Validation

To prevent corrupt or invalid data from reaching the database, the backend application layer must validate all input formatting constraints.

### 1.1 National Identity Card (NIC) Validation
The system supports both the legacy and modern Sri Lankan NIC formats:
* **Legacy Format**: 9 numeric digits followed by a single letter 'V' or 'X' (case-insensitive).
  * **Regex**: `^[0-9]{9}[vVxX]$`
* **Modern Format**: 12 numeric digits.
  * **Regex**: `^[0-9]{12}$`
* **Validation Rule**: An input string must match either the legacy or modern expression to be accepted as a valid National ID.

### 1.2 Email Address Validation
* **Regex**: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
* **Validation Rule**: Enforced for optional contact email fields.

### 1.3 Case Number Format Validation
Case Numbers must match the official department coding:
* **Pattern**: `^[A-Z]{3}/[0-9]{4}/[A-Z]{2}/[0-9]{4}$`
* **Format**: `CITY/YEAR/TYPE/SEQUENCE` (e.g. `COL/2026/PM/0001` or `GAL/2026/CL/0045`)
  * `CITY`: 3 uppercase letters representing the hospital branch (e.g. `COL` for Colombo, `GAL` for Galle).
  * `YEAR`: 4 digits.
  * `TYPE`: `CL` (Clinical) or `PM` (Postmortem).
  * `SEQUENCE`: 4 digits sequential count.

---

## 2. Entity Attribute Validation Rules

The backend API layer validates incoming JSON schemas according to the rules below:

### 2.1 Patient Registration Schema
* `NIC`: Optional/Nullable. If provided, must pass NIC format validation and be unique in the database.
* `FullName`: Mandatory. String length between 3 and 150 characters. Characters restricted to letters, spaces, and standard punctuation.
* `DateOfBirth`: Optional, but must be in `YYYY-MM-DD` format. Must be a past date (`DateOfBirth < CurrentDate`).
* `Gender`: Mandatory. Must match one of: `Male`, `Female`, `Other`.
* `Telephone`: Optional. Numeric only, between 9 and 15 digits.

### 2.2 Case Registration Schema
* `PatientID`: Mandatory. Must resolve to an existing `Patient` row ID.
* `CaseType`: Mandatory. Must match: `Clinical Forensic` or `Postmortem`.
* `ReferralSource`: Mandatory. String length between 5 and 100 characters (e.g., police station name or judicial court branch).
* `ReferralSourceTypeID`: Optional. Must resolve to a valid `ReferralSourceType` row ID if provided.
* `AssignedOfficerID`: Mandatory. Must resolve to an active JMO or Medical Officer in the database.
* `HospitalID`: Optional. Must resolve to a valid `Hospital` row ID if provided.
* `WardID`: Optional. Must resolve to a valid `Ward` row ID if provided and must belong to the specified `HospitalID` (referential safety check).

### 2.3 Clinical Examination Schema
* `Observations`: Mandatory. String length must contain at least 10 characters of descriptive findings. HTML script tags are stripped.
* `ExamDate`: Mandatory. Format `YYYY-MM-DDTHH:MM:SSZ`. Enforce: `ExamDate <= CurrentTimestamp` and `ExamDate >= RegistrationDate`.

### 2.4 Postmortem Examination Schema
* `Findings`: Mandatory. Minimally 20 characters of external and internal autopsy observations.
* `CauseOfDeath`: Mandatory. String length between 5 and 255 characters detailing anatomical causes of death.
