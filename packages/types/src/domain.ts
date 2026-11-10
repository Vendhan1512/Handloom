export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SOCIETY_ADMIN: 'SOCIETY_ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  MASTER_WEAVER: 'MASTER_WEAVER',
  WEAVER: 'WEAVER',
  INSPECTOR: 'INSPECTOR',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const TenantType = {
  COOPERATIVE: 'COOPERATIVE',
  PRIVATE_MILL: 'PRIVATE_MILL',
  MASTER_WEAVER_CLUSTER: 'MASTER_WEAVER_CLUSTER',
} as const;
export type TenantType = (typeof TenantType)[keyof typeof TenantType];

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export interface TenantContext {
  tenantId: string;
  name: string;
  code: string;
  type: TenantType;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponseData {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
