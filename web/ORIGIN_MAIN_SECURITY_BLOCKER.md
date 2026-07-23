# Critical Security Blocker: Exposed Credentials in `origin/main`

## Executive Summary

The `origin/main` branch currently contains tracked files with hardcoded local PostgreSQL connection strings and default initial seed credentials. 

To maintain security compliance, **`origin/main` MUST NOT be merged or rebased into `frontend-development`** until a separate backend hotfix branch (e.g. `backend-security-hotfix`) strips the hardcoded secrets from `main`.

---

## Identified Security Issues in `origin/main`

1. **`Backend/appsettings.json`**:
   * Contains hardcoded PostgreSQL database connection string defaults (`Username=postgres`).
   * Exposes superuser credentials in default configuration.
2. **Fixed Seed Credentials**:
   * Uses hardcoded development initial seed password defaults.
3. **Branch Merging Risk**:
   * Merging `origin/main` into `frontend-development` would pollute the clean frontend branch with hardcoded credentials.

---

## Remediation & Resolution Requirements

1. **Separate Hotfix Branch**: Create a dedicated hotfix branch (`backend-security-hotfix`) to replace all hardcoded secrets in `Backend/appsettings.json` with safe placeholders (`YOUR_LOCAL_PASSWORD`).
2. **User Secrets Enforcement**: Ensure local connection strings are stored solely in developer ASP.NET Core User Secrets (`dotnet user-secrets set`).
3. **Deferred Synchronization**: Do not synchronize `frontend-development` with `main` until the backend security hotfix has been merged into `main`.
