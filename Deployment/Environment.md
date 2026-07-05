# Environment Configurations

This document specifies the environment variables, settings templates, and configuration parameters for FMDDS, based on Section 6.3 and Section 13 of the SRS.

---

## 1. Security Warning
> [!WARNING]
> Configuration files containing passwords, database credentials, JWT secrets, and SSL keys must never be committed to Git repositories. Create a `.gitignore` rule to exclude `.env` files and maintain secrets in secure local server storage.

---

## 2. Environment Templates

### 2.1 Development Template (`.env.development`)
Used by developers for local testing. Defaults connect to a local development sandbox DB:

```ini
# Application Server Configurations
NODE_ENV=development
PORT=8080
API_VERSION=v1

# Relational Database Connection (Development)
DB_DIALECT=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=fmdds_dev
DB_USER=postgres
DB_PASS=DevPassword123!

# Session & JWT Key Configuration (Dev keys are non-critical)
JWT_SECRET=DEV_JWT_SECRET_KEY_MIN_32_CHARS_LONG
JWT_EXPIRATION=3600
JWT_ISSUER=fmdds-auth-service

# Document Storage & Media Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760   # 10MB limit in bytes

# Diagnostics & Logging
LOG_LEVEL=debug
LOG_PATH=./logs/app-dev.log

# Email Notification Server (SMTP Dev Sandbox)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
```

### 2.2 Production Configuration (`.env.production`)
Must be deployed on the target intranet server. Values must be hardened:

```ini
# Application Server Configurations
NODE_ENV=production
PORT=8080
API_VERSION=v1

# Relational Database Connection (Production - fmdds_app least privilege DB user)
DB_DIALECT=postgres
DB_HOST=10.0.2.15
DB_PORT=5432
DB_NAME=fmdds_prod
DB_USER=fmdds_app
DB_PASS=PR0D_db_P@ssword_987!

# Session & JWT Key Configuration (Strong secure key required)
JWT_SECRET=PROD_JWT_32_CHAR_RANDOM_GENERATED_KEY_123456
JWT_EXPIRATION=3600
JWT_ISSUER=fmdds-auth-service

# Document Storage & Media Uploads (Mapped to NAS directory)
UPLOAD_DIR=/mnt/nas/attachments
MAX_FILE_SIZE=10485760   # 10MB limit in bytes

# Diagnostics & Logging
LOG_LEVEL=info
LOG_PATH=/var/log/fmdds/app.log

# Email Notification Server (SMTP Server TLS SMTPS)
SMTP_HOST=mail.hospital.intranet
SMTP_PORT=465
SMTP_USER=fmdds-notifications@hospital.lk
SMTP_PASS=ProdSmtpP@ss!
SMTP_SECURE=true
```

---

## 3. Parameter Dictionary

* **`DB_USER`**: Uses `fmdds_app` in production. Ensures that even if the API server is compromised, attackers cannot drop tables or access admin features since DDL actions are blocked at database levels.
* **`JWT_SECRET`**: Used to sign and verify JSON Web Tokens. Must be a cryptographically random string (e.g. 256-bit key) and rotated periodically.
* **`UPLOAD_DIR`**: Local path where file attachments are written. In production, this maps to a network volume (NAS) to accommodate file volumes.
