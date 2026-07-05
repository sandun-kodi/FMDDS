# Frontend Screens Directory

This document defines the user interface screens, page layouts, input fields, and mock designs for FMDDS, based on Section 3.1 of the SRS.

---

## 1. Global Page Layout

All authenticated screens in FMDDS adhere to a unified grid wireframe to maintain consistency (`UI-002`):

```text
+-----------------------------------------------------------------------------+
| Header: FMDDS System Title | User Profile (Name & Role) | Alert Bell | Log Out |
+------------------+----------------------------------------------------------+
|                  | Breadcrumbs: Home > Cases > Register                     |
|                  +----------------------------------------------------------+
|                  |                                                          |
| Navigation Menu  |                   Main Content Area                      |
|                  |        (Forms / Tables / Search / Dashboards)            |
| (Sidebar Panel)  |                                                          |
|                  |                                                          |
|                  |                                                          |
|                  +----------------------------------------------------------+
|                  | Action Footer: Cancel | Submit / Save                    |
+------------------+----------------------------------------------------------+
| Footer: © 2026 Forensic Medicine Department | System Status: Online         |
+-----------------------------------------------------------------------------+
```

---

## 2. Screen Specifications

### SCR-001: Login Screen
* **Purpose**: Secure client access portal.
* **Layout**: Minimalist centered login card.
* **Inputs**:
  * Username (`text`, mandatory).
  * Password (`password`, mandatory).
* **Validations**: Client-side check for non-empty credentials. Displays inline warning "Required field missing" or "Invalid login credentials".

### SCR-002: Dashboard Screen
* **Purpose**: Customized landing hub displaying system indicators, quick links, and active notifications.
* **Layout**: Multi-column grid containing summary cards and charts.
* **Displays**:
  * Statistical Summary Cards: Total cases, pending clinical reports, pending autopsies, and pending laboratory results.
  * Recent Notifications list (dismissible, linking to respective cases).
  * Quick-access buttons mapping to roles (e.g. Clerk sees "Register New Case", JMO sees "Pending Autopsies").

### SCR-003: Patient Registration Screen
* **Purpose**: Register demographic details of a living patient or deceased profile.
* **Inputs**:
  * NIC (`text`, legacy or modern format validation).
  * Full Name (`text`, mandatory, 3-150 chars).
  * Date of Birth (`date`, past dates only).
  * Gender (`select`: Male, Female, Other).
  * Address (`text`, optional).
  * Telephone (`text`, optional).
* **Actions**: Save Profile ➔ Transition to Case Registration.

### SCR-004: Case Registration Screen
* **Purpose**: Open a new medico-legal incident folder linked to a registered patient.
* **Inputs**:
  * Patient NIC or ID (`read-only` link).
  * Case Type (`select`: Clinical Forensic, Postmortem).
  * Referral Source / Authority (`text`, e.g. Police Station branch).
  * Assigned Medical Officer (`select` lookup).
* **Actions**: Submit Case ➔ Automatically generates a unique Case Number and pops a confirmation "Case registered successfully".

### SCR-005: Clinical Examination Screen
* **Purpose**: Medical Officers document examination findings and injuries for living patients.
* **Layout**: Multi-section tabbed form.
* **Tabs**:
  1. **Incident History**: Incident narratives, referral notes, BHT lookup.
  2. **Physical Findings**: Narrative text area for injuries, lacerations, body coordinates mapping.
  3. **Attachments**: Photo upload selector (supports JPEG/PNG, progress indicator `UI-014`).
  4. **Diagnosis**: Clinical conclusions and recommendation notes.

### SCR-006: Postmortem Examination Screen
* **Purpose**: JMOs document autopsy findings and determine Cause of Death (COD).
* **Layout**: Expandable sections.
* **Sections**:
  1. **Authority Check**: Scanned police request and inquest files.
  2. **External Examination**: Rigor mortis state, postmortem staining, external injuries.
  3. **Internal Examination**: Anatomical weights and pathology of lungs, brain, heart, abdominal organs.
  4. **Cause of Death (COD)**: Antecedent, immediate, and manner of death fields.

### SCR-007: Investigation Management Screen
* **Purpose**: Log diagnostic and toxicology laboratory requests and view outcomes.
* **Fields**:
  * Test Type (`select`: Toxicology Screen, DNA Profiling, Histopathology).
  * Requester details, status progress bar (`Pending` ➔ `Processing` ➔ `Completed`).
  * Results text block and document attachments (scanned report).

### SCR-008: Evidence Management Screen
* **Purpose**: Track chains of custody and storage lockers for physical evidence.
* **Fields**:
  * Evidence Type (`text`, e.g. weapon, clothing, fluid sample).
  * Storage Locker location ID.
  * Custody Transfer history table: Shows columns for Date/Time, Sender, Receiver, Location, and Transfer Reason.
* **Actions**: "Initiate Custody Transfer" modal.

### SCR-009: Document Management Screen
* **Purpose**: Repository containing scanned files, PDF reports, and case images.

### SCR-010: Search Interface Screen
* **Purpose**: Look up historical cases and demographics.
* **Filters**: Case Number, Patient Name, NIC, Date Range, Case Status.

### SCR-011: Report Generation Screen
* **Purpose**: Review compiled case files and sign off Medico-Legal Reports.
* **Features**: Side-by-side view: Draft report PDF preview panel on the right, case data inputs on the left. JMO signature button.

### SCR-012: User Management Screen (Admin Only)
* **Purpose**: Create and edit accounts and assign roles.

### SCR-013: Audit Log Viewer Screen (Admin Only)
* **Purpose**: Immutable grid list tracking operations.

### SCR-014: System Settings Screen (Admin Only)
* **Purpose**: Configure hospital names, department variables, and dropdown lists.
