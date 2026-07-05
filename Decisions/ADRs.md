# Architecture Decision Records (ADRs)

This folder tracks the architectural and technical decisions made throughout the FMDDS lifecycle, based on Section 10.2.10 of the SRS.

---

## ADR Template Reference

All future architectural decisions must be registered in this file using the structure below:

```markdown
### ADR-XXX: [Decision Title]

* **Status**: [Proposed | Approved | Rejected | Superseded]
* **Date**: [YYYY-MM-DD]
* **Author**: [Name / Role]
* **Context / Problem Statement**: [Describe the technical problem and context]
* **Alternatives Considered**: [List alternative solutions and their pros/cons]
* **Selected Solution**: [Justify the selected architecture choice]
* **Consequences**: [List positive and negative outcomes or changes required]
* **Approval Details**: [Approving stakeholder name & date]
```

---

## 1. Approved Decision Records

### ADR-001: 4-Layer (N-Tier) Architecture Choice

* **Status**: Approved
* **Date**: 2026-07-05
* **Author**: System Architect
* **Context / Problem Statement**: The FMDDS manages complex medico-legal workflows that change frequently based on legal requirements. Direct connection between user interfaces and database scripts creates rigid code, complicating modifications and testing.
* **Alternatives Considered**:
  * *Option A: Monolithic Unstructured Application*: Faster to build initially but becomes unmaintainable.
  * *Option B: Microservices Architecture*: Provides great isolation but is overly complex for a single-department intranet deployment.
* **Selected Solution**: Layered (N-Tier) Architecture separating Presentation, Business Logic, Data Access, and Database.
* **Consequences**:
  * **Positive**: Separation of concerns allows UI changes without database impacts. Services can be unit-tested in isolation.
  * **Negative**: Requires additional boilerplate mapping entities to DTOs.
* **Approval Details**: Approved by Project Sponsor on 2026-07-05.

---

### ADR-002: RDBMS Database Engine Selection (PostgreSQL)

* **Status**: Approved
* **Date**: 2026-07-05
* **Author**: Database Designer
* **Context / Problem Statement**: Medico-legal cases require absolute data consistency, transactional safety, unique document sequences, and audit trace records.
* **Alternatives Considered**:
  * *Option A: NoSQL (MongoDB)*: Flexible document schema but weak constraint enforcement and complex transactions support.
  * *Option B: MySQL*: Good relational option but lacks advanced custom types, check constraints reliability, and advanced indexing features of PostgreSQL.
* **Selected Solution**: **PostgreSQL** relational database engine.
* **Consequences**:
  * **Positive**: Strict data integrity checks (`BRL-023`, `BRL-024`), support for ACID transactions, robust index optimization.
  * **Negative**: Slightly higher memory overhead on local servers compared to MySQL.
* **Approval Details**: Approved by Lead DB Designer on 2026-07-05.

---

### ADR-003: Hospital-Ward Lookup nesting and Nullable NIC support

* **Status**: Approved
* **Date**: 2026-07-05
* **Author**: Lead Software Architect
* **Context / Problem Statement**: During requirements validation, two data constraints issues were discovered:
  1. Referring hospitals and wards were not linked to the main Case entity.
  2. The unique constraint on the National Identity Card (NIC) field threatened to block unidentified deceased autopsies if duplicate empty/placeholder values were input.
* **Alternatives Considered**:
  * *Option A: Flat strings in Case table*: Simple to implement but leads to data anomalies and spelling variations in reports.
  * *Option B: Structured Lookups (Selected)*: Normalize `Hospital` and `Ward` into related tables and link optional FKs to `Case`. Enforce NIC as `Unique` but nullable.
* **Selected Solution**: Implement nested Hospital and Ward lookups. Allow null NIC values.
* **Consequences**:
  * **Positive**: Data consistency in reporting is preserved. Supports unidentified patient intakes.
  * **Negative**: Requires handling nullable foreign keys in the backend logic layer.
* **Approval Details**: Approved by Project Sponsor on 2026-07-05.

