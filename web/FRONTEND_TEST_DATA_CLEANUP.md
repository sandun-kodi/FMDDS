# Development Database Test Data Cleanup Guide

This document details synthetic test artifacts inserted into the development database (`fmdds_db`) during earlier HTTP integration runs and provides a transaction-safe SQL cleanup script.

---

## 1. Identified Synthetic Test Artifacts

The following synthetic records may exist in `fmdds_db`:

| Category | Field / Identifier | Matching Patterns |
| :--- | :--- | :--- |
| **Patients** | `FullName` | `'Integration Test Patient'`, `'FEIT-Integration Test Patient'`, `'Deceased Test Profile'`, `'FEIT-Deceased Test Profile'`, `'FEIT-Lab Test Patient'` |
| **Patients** | `Address` | `'123 Test Street, Colombo'` |
| **Cases** | `CaseNumber` | `COL/2026/CL/...`, `COL/2026/PM/...` created during automated testing |
| **Evidence** | `EvidenceType`, `Description` | `'Toxicology Sample'`, `'Blood sample 10ml'`, `'FEIT-Blood sample 10ml'` |
| **Custody Logs**| `StorageLocation`, `Reason` | `'Vault R-1'`, `'Toxicology Laboratory'`, `'Blood alcohol analysis'` |
| **Lab Results** | `ResultText` | `'BAC: 0.05%'` |
| **Reports** | `Summary` | `'Synthetic postmortem report draft'`, `'FEIT-Synthetic postmortem report draft'` |
| **Autopsies** | `Findings` | `'Subdural hematoma'`, `'Detailed autopsy findings: Subdural hematoma...'` |

---

## 2. Locate Affected Records (Read-Only)

Run the following SQL queries to inspect affected records before performing cleanup:

```sql
SELECT * FROM "Patient" 
WHERE "FullName" LIKE '%Integration Test Patient%' 
   OR "FullName" LIKE '%Deceased Test Profile%'
   OR "FullName" LIKE 'FEIT-%';

SELECT * FROM "Evidence" 
WHERE "Description" LIKE '%Blood sample%' 
   OR "EvidenceType" = 'Toxicology Sample';

SELECT * FROM "MedicoLegalReport" 
WHERE "ReportType" LIKE '%Synthetic%';
```

---

## 3. Transaction-Wrapped Cleanup Script

Execute the following script inside a database transaction (`BEGIN;`). The script defaults to `ROLLBACK;` so that no rows are permanently deleted until explicitly verified by a database administrator changing `ROLLBACK;` to `COMMIT;`.

```sql
BEGIN;

-- 1. Delete dependent evidence custody logs
DELETE FROM "EvidenceCustodyLog"
WHERE "EvidenceID" IN (
    SELECT "EvidenceID" FROM "Evidence"
    WHERE "Description" LIKE '%Blood sample%' OR "Description" LIKE 'FEIT-%'
);

-- 2. Delete evidence items
DELETE FROM "Evidence"
WHERE "Description" LIKE '%Blood sample%' OR "Description" LIKE 'FEIT-%';

-- 3. Delete laboratory results and requests
DELETE FROM "LaboratoryResult"
WHERE "ResultText" LIKE '%BAC: 0.05%';

DELETE FROM "LaboratoryRequest"
WHERE "CaseID" IN (
    SELECT "CaseID" FROM "Case" c
    JOIN "Patient" p ON c."PatientID" = p."PatientID"
    WHERE p."FullName" LIKE '%Integration Test Patient%' 
       OR p."FullName" LIKE '%Deceased Test Profile%'
       OR p."FullName" LIKE 'FEIT-%'
);

-- 4. Delete postmortem examination details & causes of death
DELETE FROM "PostmortemCausesOfDeath"
WHERE "PostmortemID" IN (
    SELECT "PostmortemExamID" FROM "PostmortemExamination"
    WHERE "Findings" LIKE '%Subdural hematoma%'
);

DELETE FROM "PostmortemExamination"
WHERE "Findings" LIKE '%Subdural hematoma%';

DELETE FROM "ClinicalExamination"
WHERE "Observations" LIKE '%Laceration%' OR "Observations" LIKE 'FEIT-%';

-- 5. Delete medico-legal reports
DELETE FROM "MedicoLegalReport"
WHERE "ReportType" LIKE '%Synthetic%' OR "ReportType" LIKE 'FEIT-%';

-- 6. Delete cases and synthetic patients
DELETE FROM "Case"
WHERE "PatientID" IN (
    SELECT "PatientID" FROM "Patient"
    WHERE "FullName" LIKE '%Integration Test Patient%' 
       OR "FullName" LIKE '%Deceased Test Profile%'
       OR "FullName" LIKE 'FEIT-%'
);

DELETE FROM "Patient"
WHERE "FullName" LIKE '%Integration Test Patient%' 
   OR "FullName" LIKE '%Deceased Test Profile%'
   OR "FullName" LIKE 'FEIT-%';

-- Verify remaining count before committing
SELECT COUNT(*) FROM "Patient" WHERE "FullName" LIKE 'FEIT-%';

-- DEFAULT SAFETY ROLLBACK (Change to COMMIT; only after manual review)
ROLLBACK;
```
