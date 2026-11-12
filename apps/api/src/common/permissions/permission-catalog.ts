import { Permission, UserRole } from '@handloom/types';

/**
 * Authoritative mapping of system roles to granular domain permissions.
 * Follows principle of least privilege.
 * Tenant OWNER holds full tenant-level permissions.
 * ADMIN holds operational administrative permissions.
 * Domain staff roles hold strictly scoped execution permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.OWNER]: [
    // Tenant & Organization
    Permission.TENANT_READ,
    Permission.TENANT_UPDATE,
    // User & Identity
    Permission.USERS_READ,
    Permission.USERS_INVITE,
    Permission.USERS_UPDATE,
    Permission.USERS_DEACTIVATE,
    // Roles & RBAC
    Permission.ROLES_READ,
    Permission.ROLES_ASSIGN,
    // Audit Trail
    Permission.AUDIT_READ,
    // Commercial Orders
    Permission.ORDERS_READ,
    Permission.ORDERS_CREATE,
    // Yarn Inventory
    Permission.INVENTORY_READ,
    Permission.INVENTORY_ISSUE,
    // Production Execution
    Permission.PRODUCTION_READ,
    Permission.PRODUCTION_UPDATE,
    // Quality Control
    Permission.QUALITY_INSPECT,
    // Wages
    Permission.WAGES_READ,
    Permission.WAGES_APPROVE,
    // Financial Disbursements
    Permission.PAYMENTS_READ,
    Permission.PAYMENTS_APPROVE,
  ],
  [UserRole.ADMIN]: [
    Permission.TENANT_READ,
    Permission.USERS_READ,
    Permission.USERS_INVITE,
    Permission.USERS_UPDATE,
    Permission.ROLES_READ,
    Permission.ROLES_ASSIGN,
    Permission.AUDIT_READ,
    Permission.ORDERS_READ,
    Permission.ORDERS_CREATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_ISSUE,
    Permission.PRODUCTION_READ,
    Permission.PRODUCTION_UPDATE,
    Permission.QUALITY_INSPECT,
    Permission.WAGES_READ,
    Permission.PAYMENTS_READ,
  ],
  [UserRole.OFFICE_STAFF]: [
    Permission.TENANT_READ,
    Permission.USERS_READ,
    Permission.ORDERS_READ,
    Permission.ORDERS_CREATE,
    Permission.INVENTORY_READ,
    Permission.PRODUCTION_READ,
    Permission.WAGES_READ,
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.TENANT_READ,
    Permission.ORDERS_READ,
    Permission.INVENTORY_READ,
    Permission.WAGES_READ,
    Permission.WAGES_APPROVE,
    Permission.PAYMENTS_READ,
    Permission.PAYMENTS_APPROVE,
    Permission.AUDIT_READ,
  ],
  [UserRole.STOREKEEPER]: [
    Permission.INVENTORY_READ,
    Permission.INVENTORY_ISSUE,
    Permission.ORDERS_READ,
    Permission.PRODUCTION_READ,
  ],
  [UserRole.SUPERVISOR]: [
    Permission.PRODUCTION_READ,
    Permission.PRODUCTION_UPDATE,
    Permission.INVENTORY_READ,
    Permission.QUALITY_INSPECT,
    Permission.WAGES_READ,
  ],
  [UserRole.QUALITY_INSPECTOR]: [
    Permission.QUALITY_INSPECT,
    Permission.PRODUCTION_READ,
  ],
  [UserRole.WEAVER]: [
    Permission.PRODUCTION_READ,
    Permission.WAGES_READ,
  ],
  [UserRole.TRANSPORT_STAFF]: [
    Permission.ORDERS_READ,
    Permission.PRODUCTION_READ,
  ],
};

/**
 * Resolves the complete set of permissions for a given user role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Evaluates whether a granted permission set satisfies all required permissions (AND semantic).
 */
export function hasAllPermissions(
  granted: readonly Permission[] | string[],
  required: readonly Permission[],
): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  const grantedSet = new Set(granted);
  return required.every((req) => grantedSet.has(req));
}

/**
 * Evaluates whether a granted permission set satisfies at least one required permission (OR semantic).
 */
export function hasAnyPermission(
  granted: readonly Permission[] | string[],
  required: readonly Permission[],
): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  const grantedSet = new Set(granted);
  return required.some((req) => grantedSet.has(req));
}
