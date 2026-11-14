-- ==============================================================================
-- HANDLOOM OPERATIONS PLATFORM - DOCKER INITIALIZATION: 01-create-app-role.sql
-- ==============================================================================
-- Creates the non-superuser application runtime role 'handloom_app'.
--
-- SECURITY PRINCIPLE:
--   PostgreSQL superusers and table owners inherently bypass Row-Level Security (RLS)
--   unless FORCE ROW LEVEL SECURITY is set, and superusers bypass RLS unconditionally.
--   Running application queries as superuser or table-owner defeats multi-tenant RLS.
--
-- ROLE SEPARATION:
--   1. 'handloom_dev' (superuser/owner): Runs migrations, schema alterations, DDL.
--   2. 'handloom_app' (NOSUPERUSER, NOBYPASSRLS): Executes application runtime DML.
-- ==============================================================================

-- 1. Create runtime role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'handloom_app') THEN
        CREATE ROLE handloom_app WITH
            LOGIN
            PASSWORD 'handloom_app_dev_password'
            NOSUPERUSER
            NOBYPASSRLS
            NOCREATEDB
            NOCREATEROLE
            NOREPLICATION;
        RAISE NOTICE 'Role handloom_app created successfully.';
    ELSE
        ALTER ROLE handloom_app WITH
            LOGIN
            NOSUPERUSER
            NOBYPASSRLS
            NOCREATEDB
            NOCREATEROLE
            NOREPLICATION;
        RAISE NOTICE 'Role handloom_app altered to enforce non-superuser restrictions.';
    END IF;
END $$;

-- 2. Grant connection and schema access
GRANT CONNECT ON DATABASE handloom_db TO handloom_app;
GRANT USAGE ON SCHEMA public TO handloom_app;

-- 3. Grant table privileges (SELECT, INSERT, UPDATE, DELETE)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO handloom_app;

-- 4. Grant sequence privileges (USAGE, SELECT, UPDATE)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO handloom_app;

-- 5. Configure default privileges for future tables created by the migration user
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO handloom_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO handloom_app;
