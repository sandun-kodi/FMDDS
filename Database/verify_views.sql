-- FMDDS Database Views Verification Script
-- Verifies existence, count, structure, and sample data for all 5 required PostgreSQL views.

DO $$
DECLARE
    expected_count INT := 5;
    actual_count INT;
    missing_views TEXT;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '   FMDDS DATABASE VIEWS VERIFICATION';
    RAISE NOTICE '==================================================';

    SELECT COUNT(*) INTO actual_count
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name IN ('VW_OpenCases', 'VW_CaseSummary', 'VW_LaboratoryStatus', 'VW_ReportSummary', 'VW_UserRoles');

    RAISE NOTICE 'Expected Views Count: %', expected_count;
    RAISE NOTICE 'Actual Views Count:   %', actual_count;

    IF actual_count = expected_count THEN
        RAISE NOTICE 'STATUS: SUCCESS — All 5 views exist in public schema.';
    ELSE
        SELECT STRING_AGG(v, ', ') INTO missing_views
        FROM (
            SELECT unnest(ARRAY['VW_OpenCases', 'VW_CaseSummary', 'VW_LaboratoryStatus', 'VW_ReportSummary', 'VW_UserRoles']) AS v
            EXCEPT
            SELECT table_name FROM information_schema.views WHERE table_schema = 'public'
        ) missing;
        RAISE WARNING 'STATUS: FAILED — Missing views: %', missing_views;
    END IF;
END $$;

-- 1. List All Views in Public Schema
SELECT table_name AS "View Name"
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Query Sample Data from VW_OpenCases
SELECT * FROM "VW_OpenCases" LIMIT 10;

-- 3. Query Sample Data from VW_CaseSummary
SELECT * FROM "VW_CaseSummary" LIMIT 10;

-- 4. Query Sample Data from VW_LaboratoryStatus
SELECT * FROM "VW_LaboratoryStatus" LIMIT 10;

-- 5. Query Sample Data from VW_ReportSummary
SELECT * FROM "VW_ReportSummary" LIMIT 10;

-- 6. Query Sample Data from VW_UserRoles
SELECT * FROM "VW_UserRoles" LIMIT 10;
