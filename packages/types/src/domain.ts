export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  OFFICE_STAFF: 'OFFICE_STAFF',
  STOREKEEPER: 'STOREKEEPER',
  SUPERVISOR: 'SUPERVISOR',
  WEAVER: 'WEAVER',
  QUALITY_INSPECTOR: 'QUALITY_INSPECTOR',
  ACCOUNTANT: 'ACCOUNTANT',
  TRANSPORT_STAFF: 'TRANSPORT_STAFF',
  // Backward-compatibility aliases
  SOCIETY_ADMIN: 'ADMIN',
  MASTER_WEAVER: 'SUPERVISOR',
  INSPECTOR: 'QUALITY_INSPECTOR',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const MembershipStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const TenantType = {
  COOPERATIVE: 'COOPERATIVE',
  PRIVATE_MILL: 'PRIVATE_MILL',
  MASTER_WEAVER_CLUSTER: 'MASTER_WEAVER_CLUSTER',
  INDIVIDUAL_BUSINESS: 'INDIVIDUAL_BUSINESS',
  WEAVER_CLUSTER: 'WEAVER_CLUSTER',
} as const;
export type TenantType = (typeof TenantType)[keyof typeof TenantType];

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const WorkerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  TERMINATED: 'TERMINATED',
} as const;
export type WorkerStatus = (typeof WorkerStatus)[keyof typeof WorkerStatus];

export const SkillProficiency = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  SKILLED: 'SKILLED',
  MASTER: 'MASTER',
} as const;
export type SkillProficiency = (typeof SkillProficiency)[keyof typeof SkillProficiency];

export const AssignmentStatus = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const Permission = {
  // Tenant & Organization
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  // User Management
  USERS_READ: 'users.read',
  USERS_INVITE: 'users.invite',
  USERS_UPDATE: 'users.update',
  USERS_DEACTIVATE: 'users.deactivate',
  // Role & Permissions
  ROLES_READ: 'roles.read',
  ROLES_ASSIGN: 'roles.assign',
  // Worker Workforce Management
  WORKERS_READ: 'workers.read',
  WORKERS_CREATE: 'workers.create',
  WORKERS_UPDATE: 'workers.update',
  WORKERS_ASSIGN: 'workers.assign',
  // Audit Trail
  AUDIT_READ: 'audit.read',
  // Order Management
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  // Yarn & Material Inventory
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ISSUE: 'inventory.issue',
  // Production Lifecycle
  PRODUCTION_READ: 'production.read',
  PRODUCTION_UPDATE: 'production.update',
  // Quality Assurance
  QUALITY_INSPECT: 'quality.inspect',
  // Wage Processing
  WAGES_READ: 'wages.read',
  WAGES_APPROVE: 'wages.approve',
  // Payments & Financials
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_APPROVE: 'payments.approve',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export interface TenantContext {
  tenantId: string;
  name: string;
  code: string;
  type: TenantType;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  code: string;
  slug?: string | null;
  type: TenantType;
  status: TenantStatus;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  district?: string | null;
  state?: string | null;
  pinCode?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  memberCount?: number;
  workerCount?: number;
}

export interface TenantMembershipInfo {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantType: TenantType;
  role: UserRole;
  status: MembershipStatus;
  createdAt: string;
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
  permissions: Permission[];
  memberships?: TenantMembershipInfo[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  permissions: string[];
  type: 'access' | 'refresh';
  familyId?: string;
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

export interface SessionInfo {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
  isCurrent: boolean;
}

export interface WorkerCategoryInfo {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date | string;
}

export interface WorkerSkillInfo {
  id: string;
  workerId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  proficiency: SkillProficiency;
  experienceYears: number;
  isPrimary: boolean;
}

export interface WorkerInfo {
  id: string;
  tenantId: string;
  workerCode: string;
  fullName: string;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  pinCode?: string | null;
  status: WorkerStatus;
  joiningDate: Date | string;
  paymentArrangement?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  skills: WorkerSkillInfo[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkerAssignmentInfo {
  id: string;
  tenantId: string;
  workerId: string;
  workerName: string;
  workerCode: string;
  categoryId: string;
  categoryName: string;
  assignmentDate: Date | string;
  expectedCompletionDate?: Date | string | null;
  status: AssignmentStatus;
  instructions?: string | null;
  createdById?: string | null;
  createdAt: Date | string;
}
