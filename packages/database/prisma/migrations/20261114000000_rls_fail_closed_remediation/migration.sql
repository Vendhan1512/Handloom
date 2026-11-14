-- ==============================================================================
-- HANDLOOM OPERATIONS PLATFORM - MIGRATION: 20261114000000_rls_fail_closed_remediation
-- ==============================================================================
-- SECURITY REMEDIATION: Converts fail-open RLS policies to fail-closed.
--
-- PROBLEM:
--   The existing tenant_isolation_policy on tenant_memberships, workers,
--   worker_categories, and worker_assignments uses a fail-open pattern:
--
--     USING (
--         NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
--         OR "tenant_id" = NULLIF(...)::text
--     )
--
--   When app.current_tenant_id is unset or empty, NULLIF returns NULL,
--   NULL IS NULL evaluates to TRUE, and ALL rows pass the policy.
--   This silently exposes every tenant's data when context is missing.
--
-- FIX:
--   Replace with the fail-closed pattern already proven on audit_logs:
--
--     USING (
--         current_setting('app.is_super_admin', true) = 'true'
--         OR "tenant_id" = NULLIF(...)::text
--     )
--
--   When context is missing:
--     - current_setting('app.is_super_admin', true) returns '' → '' = 'true' → FALSE
--     - NULLIF('','') returns NULL → tenant_id = NULL → FALSE (NULL comparison)
--     - Result: FALSE OR FALSE → DENIED (fail-closed)
--
-- SCOPE:
--   - tenant_memberships  (from 20261112000000_auth_rbac_membership)
--   - workers             (from 20261112010000_organization_worker_foundation)
--   - worker_categories   (from 20261112010000_organization_worker_foundation)
--   - worker_assignments  (from 20261112010000_organization_worker_foundation)
--
-- PRESERVED (already fail-closed):
--   - audit_logs          (from 20261110000000_init_multi_tenant_foundation)
--
-- NOT APPLICABLE (global identity table, RLS disabled by design):
--   - users               (RLS dropped in 20261112000000_auth_rbac_membership)
--
-- NOT APPLICABLE (no RLS by design):
--   - sessions            (tied to user identity, not directly tenant-scoped)
--   - tenants             (organizational root, not self-scoped)
-- ==============================================================================

-- 1. TENANT_MEMBERSHIPS — Drop fail-open, create fail-closed
DROP POLICY IF EXISTS tenant_isolation_policy ON "tenant_memberships";

CREATE POLICY tenant_isolation_policy ON "tenant_memberships"
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    );

-- 2. WORKERS — Drop fail-open, create fail-closed
DROP POLICY IF EXISTS tenant_isolation_policy ON "workers";

CREATE POLICY tenant_isolation_policy ON "workers"
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    );

-- 3. WORKER_CATEGORIES — Drop fail-open, create fail-closed
DROP POLICY IF EXISTS tenant_isolation_policy ON "worker_categories";

CREATE POLICY tenant_isolation_policy ON "worker_categories"
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    );

-- 4. WORKER_ASSIGNMENTS — Drop fail-open, create fail-closed
DROP POLICY IF EXISTS tenant_isolation_policy ON "worker_assignments";

CREATE POLICY tenant_isolation_policy ON "worker_assignments"
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    );

-- ==============================================================================
-- VERIFICATION NOTES:
-- After applying, confirm with:
--   SELECT tablename, policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   AND tablename IN ('tenant_memberships','workers','worker_categories','worker_assignments','audit_logs');
-- ==============================================================================
