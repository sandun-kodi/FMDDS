# Project Change Log

This file records all version updates, requirement changes, and document modifications performed in the FMDDS Project Knowledge Base, based on the Agile requirement update principles defined in Section 1.6 and Section 8.6 of the SRS.

---

## Change Log Template

All future changes to FMDDS requirements, schemas, or codebase must be documented below:

```markdown
## [Version] - YYYY-MM-DD

* **Author**: [Name / Role]
* **Related ADR / Request**: [e.g., ADR-002 / Change Request ID]
* **Impacted Components**: [List folders/files modified]
* **Summary of Changes**:
  * [List specific addition, removal, or modification]
* **Verification Status**: [Approved / Pending Testing / Completed]
```

---

## Changelog Records

## [1.0.0] - 2026-07-05

* **Author**: FMDDS Project Team
* **Summary of Changes**:
  * Initial compilation and establishment of the Project Knowledge Base from the Software Requirements Specification (`SRS.txt`).
  * Structured documentation into specialized folders:
    * `/Requirements/`: Functional and Non-functional specifications, user roles, use cases, and glossary.
    * `/Database/`: Normalized relational tables details, constraints, indexes, views, and SQL seed scripts.
    * `/Architecture/`: System architecture patterns, folder structures, technology stack, data flows, and module dependencies.
    * `/Backend/`: REST API routing, logic services description, authentication parameters, validation formats, and error handling.
    * `/Frontend/`: Screen layouts, workflows, client navigation routing, and reusable UI components.
    * `/Implementation/`: Release roadmaps, build orders, and task breakdowns checklists.
    * `/Testing/`: Functional test cases, unit testing scope, and integration verification scripts.
    * `/Deployment/`: Intranet system requirements, Dockerization guides, environment configuration variables, and disaster recovery strategies.
    * `/Decisions/`: Architecture Decision Records templates and this changelog.
* **Verification Status**: Approved & Finalized.

## [1.1.0] - 2026-07-05

* **Author**: Lead Software Architect & Database Engineer
* **Related ADR / Request**: ADR-003 / Phase 1 Validation Decisions
* **Impacted Components**:
  * `Database/Entities.md`
  * `Database/Relationships.md`
  * `Database/Constraints.md`
  * `Requirements/Glossary.md`
* **Summary of Changes**:
  * Added `Hospital`, `Ward`, and `ReferralSourceType` lookup entities to enable modular referring hospital tracking.
  * Added `HospitalID`, `WardID`, and `ReferralSourceTypeID` fields to `Case` entity.
  * Mapped referential cascading actions and constraints for new tables.
  * Fixed `CK_Case_Status` domain check constraint values to align with the state machine defined in `BRL-003`.
  * Confirmed ISD definition inside terminology glossary.
* **Verification Status**: Approved.

