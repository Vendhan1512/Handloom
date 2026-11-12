import { Prisma } from "@prisma/client";
import { prisma } from "./index.js";

export class TenantIsolationViolationError extends Error {
  constructor(message: string) {
    super(`[Tenant Isolation Violation] ${message}`);
    this.name = "TenantIsolationViolationError";
  }
}

export class MissingTenantContextError extends Error {
  constructor(message: string = "Tenant context is missing or unconfigured") {
    super(`[Missing Tenant Context] ${message}`);
    this.name = "MissingTenantContextError";
  }
}

/**
 * Validates that an entity strictly belongs to the expected tenant.
 * Throws a TenantIsolationViolationError if ownership does not match.
 */
export function validateTenantOwnership<T extends { tenantId: string }>(
  record: T | null | undefined,
  expectedTenantId: string,
  entityName = "Entity",
): T {
  if (!record) {
    throw new TenantIsolationViolationError(`${entityName} not found.`);
  }
  if (record.tenantId !== expectedTenantId) {
    throw new TenantIsolationViolationError(
      `Cross-tenant access rejected: ${entityName} belongs to tenant '${record.tenantId}', but operation requested by tenant '${expectedTenantId}'.`,
    );
  }
  return record;
}

/**
 * Executes a database operation within a specific tenant context.
 * Sets the PostgreSQL transaction-local configuration parameter 'app.current_tenant_id'.
 *
 * Uses parameterized set_config(..., true) so that:
 * 1. Values are safely bound without SQL injection risks.
 * 2. Parameter is strictly transaction-local ('is_local' = true), automatically
 *    resetting upon commit/rollback to prevent connection pool leakage.
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (
    !tenantId ||
    typeof tenantId !== "string" ||
    tenantId.trim().length === 0
  ) {
    throw new MissingTenantContextError(
      "A valid, non-empty tenant identifier is required to establish tenant context.",
    );
  }

  const sanitizedTenantId = tenantId.trim();

  return prisma.$transaction(async (tx) => {
    // Parameterized PostgreSQL transaction-local RLS session configuration
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${sanitizedTenantId}, true);`;
    return operation(tx);
  });
}

/**
 * Executes a database operation with super administrator privileges.
 * Sets 'app.is_super_admin' = 'true' for the duration of the transaction.
 */
export async function withSuperAdminContext<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Parameterized PostgreSQL transaction-local super-admin session configuration
    await tx.$executeRaw`SELECT set_config('app.is_super_admin', 'true', true);`;
    return operation(tx);
  });
}

/**
 * Reads the active transaction-local tenant context parameter.
 * Returns null if no tenant context has been set in the current transaction.
 */
export async function getCurrentTenantContext(
  tx: Prisma.TransactionClient,
): Promise<string | null> {
  const result = await tx.$queryRaw<[{ current_tenant_id: string | null }]>`
    SELECT NULLIF(current_setting('app.current_tenant_id', true), '') as current_tenant_id;
  `;
  return result[0]?.current_tenant_id ?? null;
}

/**
 * Checks whether super administrator bypass is active in the current transaction.
 */
export async function isSuperAdminContext(
  tx: Prisma.TransactionClient,
): Promise<boolean> {
  const result = await tx.$queryRaw<[{ is_super_admin: string | null }]>`
    SELECT NULLIF(current_setting('app.is_super_admin', true), '') as is_super_admin;
  `;
  return result[0]?.is_super_admin === "true";
}
