export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SOCIETY_ADMIN = 'SOCIETY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  MASTER_WEAVER = 'MASTER_WEAVER',
  WEAVER = 'WEAVER',
  INSPECTOR = 'INSPECTOR',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface TenantContext {
  tenantId: string;
  name: string;
  code: string;
}
