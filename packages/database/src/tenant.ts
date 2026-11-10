import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './index.js';

/**
 * Executes a database operation within a specific tenant context,
 * setting the PostgreSQL session variable for Row-Level Security (RLS).
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Set RLS local variable for the duration of this transaction
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}';`,
    );
    return operation(tx);
  });
}

/**
 * Executes a database operation with super administrator privileges,
 * bypassing tenant RLS filtering.
 */
export async function withSuperAdminContext<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'true';`);
    return operation(tx);
  });
}
