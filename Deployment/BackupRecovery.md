# Backup and Recovery Strategy

This document defines the database backup schedule, storage retention policies, restoration commands, and disaster recovery verification protocols for FMDDS, based on Section 9.7 and Section 9.8.7 of the SRS.

---

## 1. Backup Schedule & Parameters

To satisfy recovery requirements (`NFR-023`, `NFR-024`, `NFR-025`), backups must be automated and execute according to the following schedule:

| Backup Type | Execution Frequency | Storage Destination | Target RPO | Target RTO |
| :--- | :--- | :--- | :--- | :--- |
| **Incremental** | Every 24 hours (Daily at 01:00 AM) | Local NAS Backup Folder | 24 Hours | 4 Hours |
| **Full Dump** | Every 7 days (Sundays at 02:00 AM) | Off-site Secure Server | 7 Days | 12 Hours |
| **Archival** | Every 30 days (End of Month) | Locked Offline Storage Tape/Disk | 30 Days | 48 Hours |

---

## 2. Command Specifications (PostgreSQL Schema)

### 2.1 Database Backup Command
The database backup script runs inside the container using the read-only `fmdds_backup` DB user:
```bash
# Generate a compressed SQL custom-format dump
pg_dump -h localhost -p 5432 -U fmdds_backup -F c -b -v -f /mnt/nas/backups/fmdds_backup_$(date +%F).dump fmdds_prod
```
* **Variables**: `$(date +%F)` formats output filename chronologically (e.g., `fmdds_backup_2026-07-05.dump`).

### 2.2 Database Recovery (Disaster Restoration)
In the event of database corruption or hardware crashes, restoration must execute on a clean database instance:
```bash
# 1. Re-create database schema target
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS fmdds_prod;"
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE fmdds_prod OWNER fmdds_app;"

# 2. Restore data using pg_restore
pg_restore -h localhost -p 5432 -U postgres -d fmdds_prod -v /mnt/nas/backups/fmdds_backup_TARGET_DATE.dump
```

---

## 3. Storage Retention & Security Policies

* **Retention Window**:
  * Daily backups are retained for 30 days.
  * Weekly backups are retained for 6 months.
  * Monthly archives are stored permanently.
* **Security Controls**:
  * Backups must be encrypted at rest using AES-256 before transit.
  * Access to the backup storage server is restricted to System Administrators (`ROLE-001`).

---

## 4. Disaster Recovery Mock Drill

To ensure restoration reliability, the department must perform a **Disaster Recovery Mock Drill** every six (6) months:
1. Spin up a clean staging virtual machine.
2. Retrieve a weekly backup archive from the off-site server.
3. Decrypt the archive and execute the recovery command.
4. Verify that data records match and views calculate correctly.
5. Log the drill date, recovery duration (verifying RTO < 12 hours), and successful validation outcomes in the system maintenance log.
