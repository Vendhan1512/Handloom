-- ==============================================================================
-- HANDLOOM OPERATIONS PLATFORM - MIGRATION: 20261112000000_auth_rbac_membership
-- ==============================================================================
-- Forward-only database migration:
-- 1. Updates UserRole enum with enterprise roles (OWNER, ADMIN, OFFICE_STAFF, etc.)
-- 2. Creates MembershipStatus enum (ACTIVE, INACTIVE, SUSPENDED)
-- 3. Creates tenant_memberships table with tenant isolation and foreign keys
-- 4. Migrates existing User records into TenantMembership
-- 5. Decouples User identity from Tenant, making email globally unique
-- 6. Adds token family tracking (family_id, parent_token_hash, is_revoked) to sessions
-- 7. Makes audit_logs.tenant_id nullable for pre-tenant auth logging
-- 8. Enables and forces Row Level Security (RLS) on tenant_memberships
-- ==============================================================================

-- 1. Alter UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OFFICE_STAFF';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STOREKEEPER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'QUALITY_INSPECTOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TRANSPORT_STAFF';

-- 2. Create MembershipStatus enum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- 3. Create tenant_memberships table
CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WEAVER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- 4. Safe data migration from legacy users table if tenant_id exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) THEN
        INSERT INTO "tenant_memberships" ("id", "tenant_id", "user_id", "role", "status", "created_at", "updated_at")
        SELECT
            gen_random_uuid()::text,
            "tenant_id",
            "id",
            "role",
            'ACTIVE'::"MembershipStatus",
            "created_at",
            CURRENT_TIMESTAMP
        FROM "users"
        WHERE "tenant_id" IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. Alter users table
DROP POLICY IF EXISTS tenant_isolation_policy ON "users";
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenant_id_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenant_id_email_key";

ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 6. Alter sessions table
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "active_tenant_id" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "family_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "parent_token_hash" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "is_revoked" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "sessions_family_id_idx" ON "sessions"("family_id");

-- 7. Alter audit_logs table
ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" DROP NOT NULL;

-- 8. Add constraints and indexes for tenant_memberships
CREATE UNIQUE INDEX "tenant_memberships_user_id_tenant_id_key" ON "tenant_memberships"("user_id", "tenant_id");
CREATE INDEX "tenant_memberships_tenant_id_idx" ON "tenant_memberships"("tenant_id");
CREATE INDEX "tenant_memberships_user_id_idx" ON "tenant_memberships"("user_id");
CREATE INDEX "tenant_memberships_role_idx" ON "tenant_memberships"("role");
CREATE INDEX "tenant_memberships_status_idx" ON "tenant_memberships"("status");

ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. PostgreSQL Row Level Security (RLS) on tenant_memberships
ALTER TABLE "tenant_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_memberships" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON "tenant_memberships"
    FOR ALL
    USING (
        NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    )
    WITH CHECK (
        NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
        OR
        "tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
    );
