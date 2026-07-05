# Backend Security Specifications

This document defines the security architecture, encryption standards, input sanitization, data masking, and vulnerability prevention policies implemented in the FMDDS backend service, based on Section 9.8, Section 11, and Section 12 of the SRS.

---

## 1. Data Encryption Standards

To satisfy data confidentiality requirements (`NFR-007`), the following encryption standards are enforced:

### 1.1 Data in Transit
* **Protocol**: **TLS 1.3 (or minimum TLS 1.2)**.
* **Scope**: All connection paths (HTTP REST client requests, Database queries, SMTP notification traffic) must utilize SSL/TLS. Unencrypted (HTTP, raw TCP) connections are immediately rejected in production.
* **Web Headers**: Enforces HTTP Strict Transport Security (HSTS) with a directive `Strict-Transport-Security: max-age=63072000; includeSubDomains`.

### 1.2 Data at Rest
* **Database Encryption**: Enforces Transparent Data Encryption (TDE) on the database server to protect database files, indexes, and transaction logs.
* **Storage Encryption**: Operating system-level disk encryption (e.g. BitLocker or dm-crypt) must be enabled on local file repositories hosting clinical attachments and photographs.
* **Backup Encryption**: Automated backup dumps must be zipped and encrypted with AES-256 using strong passphrases stored in hardware security modules.

---

## 2. API Vulnerability Prevention

The backend codebase must proactively mitigate OWASP Top 10 vulnerabilities through structural code configurations:

### 2.1 SQL Injection (SQLi) Prevention
* **Rule**: Raw SQL queries with string concatenation are strictly prohibited.
* **Implementation**: All database calls must execute through the Object-Relational Mapper (ORM) using parameterized parameters. Where raw SQL queries or stored procedures are required, query inputs must execute through parameterized statement variables.
  ```csharp
  // Parameterized Query Example (C#)
  var query = "SELECT * FROM Case WHERE CaseNumber = @CaseNo";
  var parameter = new SqlParameter("@CaseNo", userInputString);
  ```

### 2.2 Cross-Site Scripting (XSS) Prevention
* **Rule**: Input fields containing HTML tags must be sanitized before processing.
* **Implementation**: Large textual fields containing clinical narratives (`ClinicalExamination.Observations`) or autopsy details (`PostmortemExamination.Findings`) must pass through an HTML sanitizer middleware (e.g., DOMPurify or HtmlSanitizer) to strip script blocks, frames, and inline event scripts prior to database persistence.

### 2.3 Cross-Site Request Forgery (CSRF) Protection
* **Rule**: Client-server state is stateless.
* **Implementation**: Because JWT tokens are stored in memory or secure storage (not ambient browser cookies), CSRF attacks are prevented as browsers do not automatically attach JWT headers during unauthorized cross-site transitions.

### 2.4 Cross-Origin Resource Sharing (CORS)
* **Rule**: CORS origins must be white-listed.
* **Implementation**: Backend server configurations must explicitly white-list allowed domains (restricting traffic to hospital LAN domains or specific client-server IPs), rejecting requests from arbitrary browser clients. `Access-Control-Allow-Origin: *` is disabled in production.

---

## 3. Data Masking & De-identification for Researchers

For `ROLE-007` (Research User) access, the API must process records through a de-identification pipeline:
* **Identification Masking**: Fields NIC, FullName, Address, Telephone, and CaseNumber are completely stripped or replaced with random pseudonyms (e.g., `Patient_08173`).
* **Date Masking**: Exact dates of birth and registration dates are converted into age brackets (e.g., `30-39`) or year-only values (`2026`) to protect patient privacy in statistical reports.

---

## 4. Audit Log Immutability

To guarantee audit accountability under `BRL-021` and `BRL-022`:
* **Write Privilege**: The API server database connection (`fmdds_app`) is authorized to `INSERT` records into `AuditLog` but is strictly blocked from executing `UPDATE` or `DELETE` commands on the table.
* **Access Restrict**: Audit logs can only be read by System Administrators via the `/admin/audit-logs` endpoint.
