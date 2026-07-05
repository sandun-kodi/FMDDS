# Non-Functional Requirements

This document registers and defines all Non-Functional Requirements (NFRs) for the Forensic Medicine Department Database System (FMDDS), detailing the quality attributes, constraints, and operational goals based on Section 8.4 of the SRS.

---

## 1. Quality Attribute Overview

Non-Functional Requirements represent the quality and behavior thresholds of the system (how well it operates). 

| Requirement ID | Category | Description | Priority |
| :--- | :--- | :--- | :--- |
| **NFR-001** | Performance | Standard page load response time | Critical |
| **NFR-002** | Performance | Search query performance | High |
| **NFR-003** | Performance | System capacity for concurrent users | High |
| **NFR-004** | Security | Protected access control | Critical |
| **NFR-005** | Security | Role-Based Access Control (RBAC) | Critical |
| **NFR-006** | Security | Cryptographic password hashing | Critical |
| **NFR-007** | Security | Data encryption in transit (TLS) and at rest | Critical |
| **NFR-008** | Security | Session inactivity timeouts | High |
| **NFR-009** | Security | Tamper-proof audit logging | Critical |
| **NFR-010** | Reliability | Database transactional integrity (ACID) | Critical |
| **NFR-011** | Reliability | Graceful failure recovery | High |
| **NFR-012** | Availability | Monthly availability uptime target | High |
| **NFR-013** | Availability | Planned maintenance notifications | Medium |
| **NFR-014** | Usability | Ease of use / minimal training requirement | High |
| **NFR-015** | Usability | Consistent user interface components | Medium |
| **NFR-016** | Usability | UI accessibility (keyboard, contrast) | Medium |
| **NFR-017** | Maintainability | Modular system architecture | High |
| **NFR-018** | Maintainability | Complete documentation maintenance | High |
| **NFR-019** | Scalability | Data storage volume scalability | Medium |
| **NFR-020** | Scalability | Support user growth | Medium |
| **NFR-021** | Compatibility | Major web browser support | Medium |
| **NFR-022** | Compatibility | Selected relational database engine compatibility | High |
| **NFR-023** | Backup & Recovery| Scheduled automated backups | Critical |
| **NFR-024** | Backup & Recovery| Recovery Time Objective (RTO) limit | High |
| **NFR-025** | Backup & Recovery| Recovery Point Objective (RPO) limit | High |
| **NFR-026** | Compliance | Support legal and data protection obligations | Critical |
| **NFR-027** | Compliance | Audit trail compliance | Critical |

---

## 2. Requirement Details & Verification Criteria

### 2.1 Performance Requirements

#### NFR-001: Response Time
* **Requirement**: The system shall display standard user interface pages within 3 seconds under normal operating conditions.
* **Measurement Criteria**: 95% of user requests completed within 3 seconds.
* **Verification Method**: Performance Testing.

#### NFR-002: Search Performance
* **Requirement**: Case searches shall return results within 5 seconds for a database containing up to 100,000 case records.
* **Verification Method**: Load Testing.

#### NFR-003: Concurrent Users
* **Requirement**: The system shall support a minimum of 100 concurrent authenticated users without significant degradation in performance.
* **Verification Method**: Load Testing.

---

### 2.2 Security Requirements

#### NFR-004: Authentication
* **Requirement**: All users shall be authenticated before accessing protected resources.
* **Verification Method**: Security Testing.

#### NFR-005: Authorization
* **Requirement**: Access to system functions shall be controlled using Role-Based Access Control (RBAC).
* **Verification Method**: Security Testing.

#### NFR-006: Password Security
* **Requirement**: Passwords shall:
  1. Be stored using strong cryptographic hashing algorithms (e.g., bcrypt, PBKDF2).
  2. Never be stored in plain text.
  3. Meet organizational password complexity requirements.
* **Verification Method**: Code Review / Inspection.

#### NFR-007: Data Encryption
* **Requirement**: Sensitive data shall be encrypted during transmission using TLS (e.g., HTTPS) and protected appropriately at rest according to organizational security policies.
* **Verification Method**: Security Testing / Configuration Review.

#### NFR-008: Session Management
* **Requirement**: Inactive user sessions shall automatically expire after 15 minutes of inactivity.
* **Verification Method**: Functional / Security Testing.

#### NFR-009: Audit Security
* **Requirement**: Security-related events shall be logged and protected against unauthorized modification.
* **Verification Method**: Security Testing / Inspection.

---

### 2.3 Reliability Requirements

#### NFR-010: Data Integrity
* **Requirement**: The system shall preserve data integrity during all transactions using ACID-compliant database operations.
* **Verification Method**: System Testing / Code Review.

#### NFR-011: Fault Recovery
* **Requirement**: The system shall recover gracefully from recoverable application failures without data corruption.
* **Verification Method**: Recovery Testing.

---

### 2.4 Availability Requirements

#### NFR-012: System Availability
* **Requirement**: The production system shall maintain 99.5% monthly availability, excluding planned maintenance windows.
* **Verification Method**: Uptime Monitoring.

#### NFR-013: Planned Maintenance
* **Requirement**: Scheduled maintenance shall be communicated in advance and performed during approved maintenance windows whenever possible.
* **Verification Method**: Inspection.

---

### 2.5 Usability Requirements

#### NFR-014: Ease of Use
* **Requirement**: Authorized users shall be able to perform common business tasks with minimal training.
* **Verification Method**: User Acceptance Testing (UAT).

#### NFR-015: Consistent User Interface
* **Requirement**: The user interface shall maintain consistent navigation, terminology, layout, and controls across all modules.
* **Verification Method**: User Acceptance Testing (UAT) / Inspection.

#### NFR-016: Accessibility
* **Requirement**: The system should support accessibility best practices, including keyboard navigation, sufficient color contrast, and compatibility with assistive technologies where applicable.
* **Verification Method**: Inspection / Accessibility Testing.

---

### 2.6 Maintainability Requirements

#### NFR-017: Modular Design
* **Requirement**: The application shall use a modular architecture that supports independent enhancement and maintenance of system components.
* **Verification Method**: Inspection / Code Review.

#### NFR-018: Documentation
* **Requirement**: System documentation, database documentation, and API documentation shall be maintained throughout the project lifecycle.
* **Verification Method**: Inspection.

---

### 2.7 Scalability Requirements

#### NFR-019: Data Growth
* **Requirement**: The system shall support increasing volumes of case records without requiring significant architectural redesign.
* **Verification Method**: Load Testing / Database Profiling.

#### NFR-020: User Growth
* **Requirement**: The system architecture shall support future increases in concurrent users through scalable infrastructure and application design.
* **Verification Method**: Load Testing / Inspection.

---

### 2.8 Compatibility Requirements

#### NFR-021: Browser Compatibility
* **Requirement**: The web application shall support the latest stable versions of major web browsers approved by the organization (Chrome, Firefox, Edge, Safari).
* **Verification Method**: Compatibility Testing.

#### NFR-022: Database Compatibility
* **Requirement**: The application shall operate with the selected relational database platform identified during implementation.
* **Verification Method**: Integration Testing.

---

### 2.9 Backup and Recovery Requirements

#### NFR-023: Automated Backup
* **Requirement**: The system shall support scheduled automated database backups (e.g., daily incremental, weekly full backups).
* **Verification Method**: Recovery Testing.

#### NFR-024: Recovery Time Objective (RTO)
* **Requirement**: The system should be recoverable within the organization's approved Recovery Time Objective (RTO), subject to infrastructure capabilities.
* **Verification Method**: Recovery Testing.

#### NFR-025: Recovery Point Objective (RPO)
* **Requirement**: The system should meet the organization's approved Recovery Point Objective (RPO) based on the configured backup strategy.
* **Verification Method**: Recovery Testing.

---

### 2.10 Compliance Requirements

#### NFR-026: Legal Compliance
* **Requirement**: The system shall support applicable medico-legal procedures, organizational policies, and relevant data protection obligations.
* **Verification Method**: Inspection / Compliance Review.

#### NFR-027: Audit Compliance
* **Requirement**: The system shall maintain complete audit records for all security-sensitive and business-critical operations.
* **Verification Method**: Inspection.

---

## 3. NFR Traceability Matrix

| NFR ID | Related Business Goal / Objective | Verification Method |
| :--- | :--- | :--- |
| **NFR-001** | BR-010 | Performance Testing |
| **NFR-004** | BR-002, BR-008 | Security Testing |
| **NFR-005** | BR-008 | Security Testing |
| **NFR-010** | BR-011 | System Testing |
| **NFR-012** | BR-010 | Monitoring & Uptime Analytics |
| **NFR-023** | BR-011 | Recovery Testing |
| **NFR-026** | BR-013 | Inspection & Compliance Review |
| **NFR-027** | BR-003, BR-009 | Inspection / Audit Trail Testing |
