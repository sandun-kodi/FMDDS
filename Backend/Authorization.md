# Backend Authorization Specification

This document details the Role-Based Access Control (RBAC) architecture, permissions matrix, and API authorization checks implemented for FMDDS, based on Section 2.3 and Section 8.4.3 of the SRS.

---

## 1. Role-Permission Matrix

Authorization checks are **Permission-Based** rather than purely Role-Based. Roles are mapped to sets of permissions in the database, allowing granular control over system actions.

| Permission | SysAdmin | JMO | MO | Forensic Officer | Lab Staff | Clerical Staff |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `user:manage` | **Yes** | No | No | No | No | No |
| `case:create` | No | **Yes** | No | **Yes** | No | **Yes** |
| `case:view_all` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| `case:edit` | No | **Yes** | No | **Yes** | No | **Yes** |
| `exam:record_clinical` | No | **Yes** | **Yes** | No | No | No |
| `exam:record_postmortem`| No | **Yes** | No | No | No | No |
| `evidence:manage` | No | No | No | **Yes** | No | No |
| `lab:request` | No | **Yes** | **Yes** | No | No | No |
| `lab:result_write` | No | No | No | No | **Yes** | No |
| `report:approve` | No | **Yes** | No | No | No | No |
| `report:print` | No | **Yes** | **Yes** | **Yes** | No | **Yes** |
| `audit:view` | **Yes** | No | No | No | No | No |

---

## 2. API Endpoint Authorization Mapping

Every incoming request must be evaluated by an authorization middleware that verifies if the user's JWT payload claims (`permissions` array) contain the required key.

| API Route | HTTP Method | Required Permission |
| :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | *None (Anonymous access)* |
| `/api/v1/cases` | `GET` | `case:view_all` |
| `/api/v1/cases` | `POST` | `case:create` |
| `/api/v1/cases/{id}/status` | `PUT` | `case:edit` |
| `/api/v1/cases/{id}/clinical-exam` | `POST` | `exam:record_clinical` |
| `/api/v1/cases/{id}/postmortem-exam`| `POST` | `exam:record_postmortem` |
| `/api/v1/cases/{id}/evidence` | `POST` | `evidence:manage` |
| `/api/v1/evidence/{id}/transfer` | `POST` | `evidence:manage` |
| `/api/v1/cases/{id}/lab-requests` | `POST` | `lab:request` |
| `/api/v1/lab-requests/{id}/results`| `PUT` | `lab:result_write` |
| `/api/v1/reports/{id}/approve` | `PUT` | `report:approve` |
| `/api/v1/admin/users` | `POST` / `PUT` | `user:manage` |
| `/api/v1/admin/audit-logs` | `GET` | `audit:view` |

---

## 3. Database Layer Authorization Rules

To enforce the Principle of Least Privilege (`NFR-005`), the database engine must define different database users to limit direct connection access:

1. **`fmdds_app` (Application Server User)**:
   * **Privileges**: `SELECT`, `INSERT`, `UPDATE` on tables. `EXECUTE` on views/procedures.
   * **Restricted**: No `DELETE` operations permitted on core case files, examinations, or audit logs (`BRL-022`). No schema modification privileges (DDL).
2. **`fmdds_migration` (Deploy User)**:
   * **Privileges**: Full DDL execution (`CREATE`, `ALTER`, `DROP` tables) to run migrations. Restricted to schema update phases; never used by the live application server.
3. **`fmdds_backup` (Backup Job User)**:
   * **Privileges**: Read-only `SELECT` access to all tables for backup dumps. Locked down to localhost connections.
