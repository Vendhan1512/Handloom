-- ==============================================================================
-- POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES FOR HANDLOOM PLATFORM
-- ==============================================================================
-- This script enforces database-level tenant isolation.
-- Whenever an application request arrives, the backend executes:
--   SET LOCAL app.current_tenant_id = '<authenticated-tenant-uuid>';
-- Any direct query across tenant boundaries will return zero rows or be rejected.
-- ==============================================================================

-- 1. Enable RLS on Tenant-Scoped Tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 2. User Isolation Policy
DROP POLICY IF EXISTS tenant_isolation_users ON "users";
CREATE POLICY tenant_isolation_users ON "users"
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    OR current_setting('app.is_super_admin', true) = 'true'
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    OR current_setting('app.is_super_admin', true) = 'true'
  );

-- 3. Session Isolation Policy
DROP POLICY IF EXISTS tenant_isolation_sessions ON "sessions";
CREATE POLICY tenant_isolation_sessions ON "sessions"
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM "users" 
      WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    )
    OR current_setting('app.is_super_admin', true) = 'true'
  );

-- 4. Audit Log Isolation Policy
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON "audit_logs";
CREATE POLICY tenant_isolation_audit_logs ON "audit_logs"
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    OR current_setting('app.is_super_admin', true) = 'true'
  );
