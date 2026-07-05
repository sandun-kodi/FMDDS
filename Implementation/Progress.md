# Project Progress Board

This document serves as a living progress tracking board for FMDDS implementation phases, helping monitor features completion status as development sprints occur.

---

## 1. Metrics Dashboard

* **Overall Project Progress**: `0%` (0 / 10 Modules completed)
* **Release 1 Completion**: `0%`
* **Release 2 Completion**: `0%`
* **Release 3 Completion**: `0%`

---

## 2. Kanban Board Simulation

```text
+-----------------------+-----------------------+-----------------------+-----------------------+
|        BACKLOG        |         TODO          |      IN PROGRESS      |         DONE          |
+-----------------------+-----------------------+-----------------------+-----------------------+
| - Evidence Module     | - ORM repositories    | - Database DDL Schema |                       |
| - Lab Specimen Module | - JWT Auth middleware |   generation          |                       |
| - PDF Report Engine   | - Case intake routes  |                       |                       |
| - Audit logs viewer   | - Clinical form UI    |                       |                       |
+-----------------------+-----------------------+-----------------------+-----------------------+
```

---

## 3. Features Progress Checklist

### 3.1 Release 1: Core System
- [ ] **M-01: Database Layer Setup**
  - [ ] Tables creation & constraints (`PK`, `FK`, `CHECK`).
  - [ ] Standard views deployment (`VW_OpenCases`, `VW_UserRoles`).
  - [ ] Seed script setup (Roles, permissions).
- [ ] **M-02: ORM Data Access Layer**
  - [ ] Context initialization.
  - [ ] Base repositories execution.
- [ ] **M-03: Security & Auth Module**
  - [ ] Password hashing & lockout rules BLL.
  - [ ] JWT sign-off & validation handlers.
  - [ ] Route authorization middleware.
  - [ ] Login screen frontend (`SCR-001`).
- [ ] **M-04: Case & Patient Intake**
  - [ ] Patient registration API & forms (`SCR-003`).
  - [ ] Case registration API & forms (`SCR-004`).

### 3.2 Release 2: Examination Modules
- [ ] **M-05: Clinical Forensic Module**
  - [ ] Clinical observations data schema.
  - [ ] Attachment storage config.
  - [ ] Examination form frontend UI (`SCR-005`).
- [ ] **M-06: Postmortem Autopsy Module**
  - [ ] Postmortem findings details schema.
  - [ ] Cause of death validation logic.
  - [ ] Autopsy form frontend UI (`SCR-006`).

### 3.3 Release 3: Logistics & Auditing
- [ ] **M-07: Laboratory Module**
  - [ ] Lab orders API & result inputs form (`SCR-007`).
- [ ] **M-08: Evidence Tracking Module**
  - [ ] Evidence registrations & chain of custody log UI (`SCR-008`).
- [ ] **M-09: Medico-Legal Reports Engine**
  - [ ] PDF templates compile service.
  - [ ] Report approvals screen (`SCR-011`).
- [ ] **M-10: Admin Dashboard & Auditing**
  - [ ] Global audit logging database updates.
  - [ ] Audit grid view (`SCR-013`) & dashboard statistics (`SCR-002`).
