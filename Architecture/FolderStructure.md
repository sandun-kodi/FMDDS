# Folder Structure

This document outlines the standard code repository directory structure for the FMDDS project, ensuring a clean separation of concerns according to the N-Tier layered architecture.

---

## 1. Repository Root Directory

The project follows a monorepo or split frontend/backend directory layout to organize code, tests, migrations, and deployment assets:

```text
fmdds/
│
├── .github/                   # CI/CD workflows (GitHub Actions)
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── database/                  # Relational database scripts & migrations
│   ├── schema/                # DDL schema scripts
│   ├── migrations/            # Incremental schema evolution scripts
│   ├── seeds/                 # Development and testing seed scripts
│   └── views/                 # View creation scripts
│
├── backend/                   # Backend API codebase
│
├── frontend/                  # Client-side web application codebase
│
├── deployment/                # Production release and environment configuration
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── docker-compose.yml
│   └── env/
│       ├── .env.development
│       └── .env.production
│
└── docs/                      # Project Knowledge Base (this documentation)
```

---

## 2. Backend Code Directory Structure

The backend follows a layered pattern (Controllers/API, Services, Repositories/Data) aligning with the architectural specification:

```text
backend/
├── src/
│   ├── api/                   # Presentation Layer (HTTP / API handlers)
│   │   ├── controllers/       # Processes incoming HTTP requests, calls services
│   │   ├── middlewares/       # Auth (JWT), request logging, error handler middlewares
│   │   ├── routes/            # HTTP endpoints routing declarations
│   │   └── validators/        # Request payload validation models
│   │
│   ├── core/                  # Business Logic Layer (BLL)
│   │   ├── services/          # Business logic services (CaseService, ReportService)
│   │   ├── interfaces/        # Interface contracts for decoupling BLL from DAL
│   │   ├── exceptions/        # Custom domain exceptions
│   │   └── dto/               # Data Transfer Objects for API payloads
│   │
│   ├── data/                  # Data Access Layer (DAL)
│   │   ├── db/                # DB Connection pool configurations
│   │   ├── entities/          # ORM data entities mapping to database tables
│   │   └── repositories/      # SQL queries and database access patterns
│   │
│   ├── config/                # Backend application configurations & environment loaders
│   └── app.js / program.cs    # Application entry point
│
├── tests/                     # Backend test suites
│   ├── unit/                  # Service and validator tests
│   └── integration/           # Database and API endpoint tests
│
└── package.json / csproj      # Dependency management
```

---

## 3. Frontend Code Directory Structure

The frontend follows a modern component-driven framework folder structure:

```text
frontend/
├── public/                    # Static assets (favicons, browser manifest)
├── src/
│   ├── assets/                # Logos, style configurations, global CSS styles
│   ├── components/            # Reusable UI components (buttons, input forms, tables)
│   │   ├── common/            # Globally shared components
│   │   └── layout/            # Headers, navigation sidebar, footer templates
│   │
│   ├── views/                 # Presentation Layer Page components (Login, Cases, Autopsy)
│   ├── services/              # API Client Service calls (wrapping Axios/Fetch)
│   ├── store/                 # Global UI State management (auth token, user info)
│   ├── routes/                # Client-side router navigation maps
│   ├── utils/                 # Formatting tools, dates calculations
│   └── index.html             # Client index file
│
├── tests/                     # Frontend verification tests
│   └── e2e/                   # Cypress or Playwright end-to-end test scenarios
│
└── package.json               # Node packages and build scripts
```
