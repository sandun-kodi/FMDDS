# Glossary of Project Terminology

This document establishes a common dictionary of definitions, acronyms, and terminology standards used throughout the FMDDS project, in accordance with Section 1.3 of the SRS.

---

## 1. Domain and Technical Definitions

| Term | Definition |
| :--- | :--- |
| **Forensic Medicine** | The branch of medicine that applies medical knowledge for legal investigations and judicial purposes. |
| **Forensic Case** | A medico-legal case requiring examination, investigation, documentation, or reporting for legal proceedings. |
| **Clinical Forensic Case** | A medico-legal case involving a living patient or victim who requires forensic examination and documentation (e.g., assault, abuse, age estimation). |
| **Postmortem Case** | A medico-legal case involving the examination of a deceased person (autopsy) to determine the cause and manner of death. |
| **Medico-Legal Report** | An official report prepared by an authorized medical practitioner (JMO) for police, courts, or other legal authorities. |
| **Medico-Legal Examination** | A formal medical examination conducted for legal purposes under authorized referral procedures. |
| **Evidence** | Any physical, digital, documentary, or biological item associated with a medico-legal case (e.g., tissue sample, weapon, clothes). |
| **Chain of Custody** | The chronological documentation showing the collection, transfer, handling, storage, and disposition of evidence items. |
| **Investigation** | Any diagnostic, laboratory, radiological, toxicological, or forensic examination performed as part of a case. |
| **Attachment** | Any uploaded file associated with a case, such as reports, images, scanned documents, or photographs. |
| **Dashboard** | A visual interface that displays summaries, statistics, notifications, and operational information. |
| **Audit Log** | A chronological, immutable record of user activities and system events maintained for security and accountability. |
| **Notification** | A system-generated alert informing users about pending actions, deadlines, or significant events. |
| **User Role** | A predefined collection of permissions assigned to a user account (e.g., JMO, Clerk, Administrator). |
| **Requirement Traceability** | The ability to track requirements from their origin (business objectives) through implementation (code modules) and testing activities. |

---

## 2. Acronyms and Abbreviations

| Acronym / Abbreviation | Full Form | Description |
| :--- | :--- | :--- |
| **FMDDS** | Forensic Medicine Department Database System | The software system being developed. |
| **SRS** | Software Requirements Specification | The source requirement documentation. |
| **JMO** | Judicial Medical Officer | Authorized forensic medical practitioner / expert. |
| **MLEF** | Medico-Legal Examination Form | Legal authorization and clinical examination intake document. |
| **MLR** | Medico-Legal Report | Official medico-legal report generated for court for a living patient. |
| **PMR** | Postmortem Report | Official autopsy and forensic report generated for deceased cases. |
| **COD** | Cause of Death | Official statement specifying the causes/manner of death (underlying, immediate). |
| **ERD** | Entity Relationship Diagram | Diagram modeling database entities and their relationships. |
| **CRUD** | Create, Read, Update, Delete | Basic database storage operations. |
| **DBMS** | Database Management System | Software managing the database (e.g., MySQL, PostgreSQL). |
| **SQL** | Structured Query Language | Language standard used to manipulate databases. |
| **UI** | User Interface | Front-facing application screens. |
| **API** | Application Programming Interface | Software intermediary allowing component interactions. |
| **RBAC** | Role-Based Access Control | Permission control based on user role assignments. |
| **PDF** | Portable Document Format | Fixed layout report format. |
| **NIC** | National Identity Card | Government-issued identification. |
| **BHT** | Bed Head Ticket | Hospital patient medical record used during investigations. |
| **ISD** | Institutional Service Department | Local institutional department involved in referral procedures. |
| **AG** | Attorney General | Government legal authority involved in medico-legal processes. |

---

## 3. Terminology Standards

To ensure consistency in database design, API design, code, and documentation, the following terminology standards are enforced:

| Preferred Term | Alternative Terms to Avoid | Rationale |
| :--- | :--- | :--- |
| **Patient/Person** | Victim Record, Subject Record | Standardizes living patient and deceased profile entities. |
| **Case** | File, Incident File | Aligns with legal and departmental case tracking. |
| **User** | Operator, Employee | Standard software authentication nomenclature. |
| **Attachment** | File Upload, Media Item | Covers files, photos, PDFs, and external reports. |
| **Report** | Output Document | Distinguishes generated legal documentation from general data lists. |
| **Evidence** | Sample, Exhibit (unless legally required) | Represents all materials inside the Chain of Custody. |
| **Case Status** | Process State | Represents the status lifecycle of a medico-legal process. |
| **Authentication** | Login Validation | Refers to identity verification processes. |
| **Authorization** | Permission Assignment | Refers to access rights management. |
