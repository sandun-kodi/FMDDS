-- Safe local test database and runner role setup template for FMDDS.
-- Replace placeholders locally. Do NOT commit real passwords to Git.

CREATE ROLE fmdds_test_runner
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOINHERIT
    PASSWORD '<LOCAL_TEST_PASSWORD>';

CREATE DATABASE fmdds_test OWNER TO fmdds_test_runner;
GRANT ALL PRIVILEGES ON DATABASE fmdds_test TO fmdds_test_runner;
