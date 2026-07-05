# Frontend Navigation & Routing

This document defines client-side navigation paths, routing guards, and role-based menu structures for the FMDDS web client, based on Section 3.1.2 of the SRS.

---

## 1. Role-Based Navigation Trees

Navigation menus are dynamically generated based on authenticated user roles (`UI-006`) to ensure users only see menu options corresponding to their authorizations.

### 1.1 System Administrator Menu
* 📊 **[Dashboard](file:///c:/01%20(My%20Drive)/Engineering%20Resources/4th%20Sem/CO2050%20-%20Database%20Systems/Project/Project/Frontend/Navigation.md#L1)**
* 👥 **User Management** (SCR-012)
* ⚙️ **System Settings** (SCR-014)
* 📜 **Audit Logs** (SCR-013)

### 1.2 Judicial Medical Officer (JMO) Menu
* 📊 **[Dashboard](file:///c:/01%20(My%20Drive)/Engineering%20Resources/4th%20Sem/CO2050%20-%20Database%20Systems/Project/Project/Frontend/Navigation.md#L1)**
* 🏥 **Clinical Cases** (List of clinical forensic cases SCR-005)
* 💀 **Postmortem Cases** (List of autopsy cases SCR-006)
* 📝 **Reports Queue** (Pending approval and signing SCR-011)
* 🔍 **Advanced Search** (SCR-010)

### 1.3 Medical Officer / Doctor Menu
* 📊 **[Dashboard](file:///c:/01%20(My%20Drive)/Engineering%20Resources/4th%20Sem/CO2050%20-%20Database%20Systems/Project/Project/Frontend/Navigation.md#L1)**
* 🏥 **Clinical Cases** (Drafting and examination entries SCR-005)
* 🔍 **Search Cases** (SCR-010)

### 1.4 Clerical Staff Menu
* 👥 **Patient Intake** (Register patient profile SCR-003)
* 📁 **Case Registration** (Register case sheet SCR-004)
* 🔍 **Search Cases** (SCR-010)
* 📦 **Report Issuance** (Log report deliveries to court/police SCR-011)

---

## 2. Routing Map & Guard Specifications

Client-side routes are protected by authorization guards checking token role permissions before loading the target page view components.

| Path | View Component | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginView` | *Anonymous (Public)* | Entry credential authentication. |
| `/dashboard` | `DashboardView` | All Authenticated Roles | Summary statistics, activity streams, and notifications. |
| `/patients/register` | `PatientRegisterView`| Clerical Staff, Forensic Officer | Demographic data entry. |
| `/cases/register` | `CaseRegisterView` | Clerical Staff, Forensic Officer | Opens new Case linked to a Patient. |
| `/cases` | `CaseListView` | JMO, Medical Officer, Clerical, Lab, Forensic | General browse table with search filter bar. |
| `/cases/clinical/:id`| `ClinicalExamView` | JMO, Medical Officer | Records MLEF examination details and uploads. |
| `/cases/autopsy/:id` | `PostmortemExamView` | JMO | Records postmortem dissection findings and COD. |
| `/evidence` | `EvidenceListView` | Forensic Officer, JMO, Lab Staff | Chains of custody tracking. |
| `/lab-requests` | `LabQueueView` | Lab Staff, JMO, Medical Officer | Lists pending samples and records test outcomes. |
| `/reports` | `ReportsQueueView` | JMO, Medical Officer, Clerical | Accesses report previews and approval actions. |
| `/admin/users` | `UserAdminView` | System Administrator | Accounts management portal. |
| `/admin/audit` | `AuditLogView` | System Administrator | Event log viewer. |

---

## 3. Navigation Controls (`UI-007`)

1. **Breadcrumbs Bar**: Rendered persistently below the header, showing the current path (e.g. `Home > Case List > Case COL/2026/CL/0001`). Clickable steps allow fast history backtracking.
2. **Back Button Guard**: Form views must prompt the user with a confirmation alert before allowing back-navigation if there are unsaved changes, preventing data loss.
3. **Sidebar State Toggle**: Sidebar navigation panel can be collapsed to maximize screen space for large autopsy or clinical observation entry tables.
