-- ==============================================================================
-- HANDLOOM OPERATIONS PLATFORM - MIGRATION: 20261112010000_organization_worker_foundation
-- ==============================================================================
-- Forward-only database migration:
-- 1. Updates TenantType enum with additional business models (INDIVIDUAL_BUSINESS, WEAVER_CLUSTER)
-- 2. Adds profile location and contact columns to tenants table (district, state, pin_code, contact_person)
-- 3. Creates WorkerStatus, SkillProficiency, AssignmentStatus enums
-- 4. Creates workers table (operational records independent of system accounts)
-- 5. Creates configurable worker_categories table
-- 6. Creates worker_skills junction table (multi-skill support)
-- 7. Creates worker_assignments table (task allocation foundation)
-- 8. Establishes unique constraints, indexes and cascading foreign keys
-- 9. Enables and forces Row-Level Security (RLS) on all new tenant-owned tables
-- ==============================================================================

-- 1. Alter TenantType enum
ALTER TYPE "TenantType" ADD VALUE IF NOT EXISTS 'INDIVIDUAL_BUSINESS';
ALTER TYPE "TenantType" ADD VALUE IF NOT EXISTS 'WEAVER_CLUSTER';

-- 2. Extend tenants table
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contact_person" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "pin_code" TEXT;

-- 3. Create Enums
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');
CREATE TYPE "SkillProficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'SKILLED', 'MASTER');
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- 4. Create workers table
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "worker_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "alternate_phone" TEXT,
    "address" TEXT,
    "village" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pin_code" TEXT,
    "status" "WorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "joining_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_arrangement" TEXT,
    "emergency_contact" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- 5. Create worker_categories table
CREATE TABLE "worker_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_categories_pkey" PRIMARY KEY ("id")
);

-- 6. Create worker_skills table
CREATE TABLE "worker_skills" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "proficiency" "SkillProficiency" NOT NULL DEFAULT 'INTERMEDIATE',
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_skills_pkey" PRIMARY KEY ("id")
);

-- 7. Create worker_assignments table
CREATE TABLE "worker_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "assignment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_completion_date" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "instructions" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_assignments_pkey" PRIMARY KEY ("id")
);

-- 8. Unique indexes & foreign keys
CREATE UNIQUE INDEX "workers_tenant_id_worker_code_key" ON "workers"("tenant_id", "worker_code");
CREATE INDEX "workers_tenant_id_idx" ON "workers"("tenant_id");
CREATE INDEX "workers_worker_code_idx" ON "workers"("worker_code");
CREATE INDEX "workers_status_idx" ON "workers"("status");
CREATE INDEX "workers_full_name_idx" ON "workers"("full_name");

CREATE UNIQUE INDEX "worker_categories_tenant_id_code_key" ON "worker_categories"("tenant_id", "code");
CREATE INDEX "worker_categories_tenant_id_idx" ON "worker_categories"("tenant_id");
CREATE INDEX "worker_categories_is_active_idx" ON "worker_categories"("is_active");

CREATE UNIQUE INDEX "worker_skills_worker_id_category_id_key" ON "worker_skills"("worker_id", "category_id");
CREATE INDEX "worker_skills_worker_id_idx" ON "worker_skills"("worker_id");
CREATE INDEX "worker_skills_category_id_idx" ON "worker_skills"("category_id");

CREATE INDEX "worker_assignments_tenant_id_idx" ON "worker_assignments"("tenant_id");
CREATE INDEX "worker_assignments_worker_id_idx" ON "worker_assignments"("worker_id");
CREATE INDEX "worker_assignments_status_idx" ON "worker_assignments"("status");
CREATE INDEX "worker_assignments_assignment_date_idx" ON "worker_assignments"("assignment_date");

ALTER TABLE "workers" ADD CONSTRAINT "workers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_categories" ADD CONSTRAINT "worker_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "worker_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "worker_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. PostgreSQL Row Level Security (RLS) Policies
ALTER TABLE "workers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workers" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "workers"
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

ALTER TABLE "worker_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worker_categories" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "worker_categories"
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

ALTER TABLE "worker_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worker_assignments" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "worker_assignments"
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
