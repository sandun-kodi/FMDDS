# Technology Stack

This document registers the approved technologies, frameworks, and deployment platforms for FMDDS, based on Section 10.2.6 of the SRS.

---

## 1. Stack Registry & Selection Rationale

FMDDS is built using standard enterprise web technologies. The table below represents the selected stack for the reference implementation:

| Layer | Selected Option | Alternative Evaluated | Selection Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | **HTML5, CSS3, Vanilla JS, Bootstrap** | React, Vue.js | Bootstrap provides rapid responsive layout assembly, matching JMO user constraints (`NFR-015`), while avoiding complex client-side framework overhead. |
| **Backend** | **ASP.NET Core (or Laravel/Laravel API)** | Spring Boot | Provides excellent performance, native Dependency Injection, strong validation decorators, and seamless integration with relational DBMS. |
| **Database** | **PostgreSQL (or MySQL)** | MongoDB | Medico-legal cases require transactional safety (ACID properties `NFR-010`) and complex relational joins, which NoSQL cannot guarantee. |
| **ORM** | **Entity Framework Core (or Eloquent)** | Dapper, Raw SQL | EF Core provides migrations tracking, automated relational mapping, and protects against SQL Injection vulnerabilities. |
| **API style** | **RESTful Web Services** | GraphQL | Simplifies integration and testing using standard JSON payloads across client-server connections. |
| **Authentication** | **JWT (JSON Web Token)** | Session cookies | Stateless token authorization allows secure cross-origin requests, scalable session management, and simple role parsing in headers. |

---

## 2. Development & Devops Tools

* **Version Control**: Git (repository hosted on GitHub).
* **CI/CD Pipeline**: GitHub Actions for automated unit test execution, code linting, and docker building.
* **Testing Libraries**:
  * **Backend**: xUnit / PHPUnit for backend service logic testing.
  * **Frontend**: Cypress or Jest for client validation testing.
* **Documentation**: OpenAPI / Swagger for automated API interactive specification pages.
