export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SOCIETY_ADMIN = 'SOCIETY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  MASTER_WEAVER = 'MASTER_WEAVER',
  WEAVER = 'WEAVER',
  INSPECTOR = 'INSPECTOR',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum TenantType {
  COOPERATIVE = 'COOPERATIVE',
  PRIVATE_MILL = 'PRIVATE_MILL',
  MASTER_WEAVER_CLUSTER = 'MASTER_WEAVER_CLUSTER',
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
