import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { withTenantContext } from '@handloom/database';
import {
  MembershipStatus,
  PaginatedResult,
  UserRole,
  UserStatus,
} from '@handloom/types';
import { PasswordHasherService } from '../auth/services/password-hasher.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { logger } from '@handloom/logger';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  membershipStatus: MembershipStatus;
  userStatus: UserStatus;
  joinedAt: Date;
  lastLoginAt?: Date | null;
}

@Injectable()
export class UserManagementService {
  constructor(private readonly passwordHasher: PasswordHasherService) {}

  /**
   * Lists all users possessing membership in the active tenant with pagination and filters.
   */
  async listUsers(
    tenantId: string,
    query: UserQueryDto,
  ): Promise<PaginatedResult<UserSummary>> {
    return withTenantContext(tenantId, async (tx) => {
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 20));
      const skip = (page - 1) * limit;

      const whereClause: any = {
        tenantId,
        ...(query.role && { role: query.role }),
        ...(query.status && { status: query.status }),
      };

      if (query.search && query.search.trim().length > 0) {
        const search = query.search.trim().toLowerCase();
        whereClause.user = {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      const [total, memberships] = await Promise.all([
        tx.tenantMembership.count({ where: whereClause }),
        tx.tenantMembership.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
          },
        }),
      ]);

      const items: UserSummary[] = memberships.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        phone: m.user.phone,
        role: m.role as UserRole,
        membershipStatus: m.status as MembershipStatus,
        userStatus: m.user.status as UserStatus,
        joinedAt: m.createdAt,
        lastLoginAt: m.user.lastLoginAt,
      }));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    });
  }

  /**
   * Retrieves specific user details within tenant context.
   */
  async getUser(tenantId: string, userId: string): Promise<UserSummary> {
    return withTenantContext(tenantId, async (tx) => {
      const membership = await tx.tenantMembership.findUnique({
        where: {
          userId_tenantId: { userId, tenantId },
        },
        include: { user: true },
      });

      if (!membership) {
        throw new NotFoundException(
          `User '${userId}' does not belong to organization '${tenantId}'.`,
        );
      }

      return {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        phone: membership.user.phone,
        role: membership.role as UserRole,
        membershipStatus: membership.status as MembershipStatus,
        userStatus: membership.user.status as UserStatus,
        joinedAt: membership.createdAt,
        lastLoginAt: membership.user.lastLoginAt,
      };
    });
  }

  /**
   * Registers a new staff member or invites an existing global user into the tenant.
   */
  async createUser(
    tenantId: string,
    dto: CreateTenantUserDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<UserSummary> {
    // Privilege escalation protection: only OWNER or SUPER_ADMIN can grant OWNER role
    if (
      dto.role === UserRole.OWNER &&
      currentUserRole !== UserRole.OWNER &&
      currentUserRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only tenant Owners can grant the OWNER role to new members.',
      );
    }

    const email = dto.email.toLowerCase().trim();

    return withTenantContext(tenantId, async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (user) {
        const existingMembership = await tx.tenantMembership.findUnique({
          where: {
            userId_tenantId: { userId: user.id, tenantId },
          },
        });

        if (existingMembership) {
          throw new ConflictException(
            `User '${email}' already possesses membership in this organization.`,
          );
        }
      } else {
        const rawPassword =
          dto.initialPassword || crypto.randomBytes(12).toString('base64');
        const passwordHash = await this.passwordHasher.hash(rawPassword);

        user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phone: dto.phone?.trim() || null,
            status: UserStatus.ACTIVE,
          },
        });
      }

      const membership = await tx.tenantMembership.create({
        data: {
          tenantId,
          userId: user.id,
          role: dto.role,
          status: MembershipStatus.ACTIVE,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          action: 'USER_INVITE',
          entity: 'TenantMembership',
          entityId: membership.id,
          details: {
            invitedUserId: user.id,
            invitedEmail: user.email,
            assignedRole: dto.role,
          },
        },
      });

      logger.info(
        { tenantId, userId: user.id, assignedRole: dto.role },
        `New staff member added to organization: ${user.email} (${dto.role})`,
      );

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: membership.role as UserRole,
        membershipStatus: membership.status as MembershipStatus,
        userStatus: user.status as UserStatus,
        joinedAt: membership.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    });
  }

  /**
   * Updates user profile and membership role within tenant context.
   */
  async updateUser(
    tenantId: string,
    targetUserId: string,
    dto: UpdateTenantUserDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<UserSummary> {
    // Self-privilege escalation defense: user cannot alter their own role
    if (
      dto.role &&
      targetUserId === currentUserId &&
      dto.role !== currentUserRole
    ) {
      throw new ForbiddenException(
        'Users cannot elevate or change their own assigned role.',
      );
    }

    // Role assignment defense: only OWNER or SUPER_ADMIN can assign OWNER
    if (
      dto.role === UserRole.OWNER &&
      currentUserRole !== UserRole.OWNER &&
      currentUserRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only organization Owners can assign the OWNER role.',
      );
    }

    return withTenantContext(tenantId, async (tx) => {
      const membership = await tx.tenantMembership.findUnique({
        where: {
          userId_tenantId: { userId: targetUserId, tenantId },
        },
        include: { user: true },
      });

      if (!membership) {
        throw new NotFoundException(
          `User '${targetUserId}' does not belong to organization '${tenantId}'.`,
        );
      }

      // If demoting an OWNER, ensure at least one other active OWNER remains
      if (
        membership.role === UserRole.OWNER &&
        dto.role &&
        dto.role !== UserRole.OWNER
      ) {
        const activeOwners = await tx.tenantMembership.count({
          where: {
            tenantId,
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        });
        if (activeOwners <= 1) {
          throw new ForbiddenException(
            'Cannot demote the last active Owner of the organization. Assign another Owner first.',
          );
        }
      }

      // Update User profile details if specified
      if (dto.firstName || dto.lastName || dto.phone !== undefined) {
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            ...(dto.firstName && { firstName: dto.firstName.trim() }),
            ...(dto.lastName && { lastName: dto.lastName.trim() }),
            ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
          },
        });
      }

      // Update Membership role if specified
      let updatedMembership = membership;
      if (dto.role && dto.role !== membership.role) {
        updatedMembership = await tx.tenantMembership.update({
          where: { id: membership.id },
          data: { role: dto.role },
          include: { user: true },
        });
      } else {
        updatedMembership = (await tx.tenantMembership.findUnique({
          where: { id: membership.id },
          include: { user: true },
        }))!;
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          action: 'USER_UPDATE',
          entity: 'TenantMembership',
          entityId: membership.id,
          details: { updatedUserId: targetUserId, changes: { ...dto } as any },
        },
      });

      return {
        id: updatedMembership.user.id,
        email: updatedMembership.user.email,
        firstName: updatedMembership.user.firstName,
        lastName: updatedMembership.user.lastName,
        phone: updatedMembership.user.phone,
        role: updatedMembership.role as UserRole,
        membershipStatus: updatedMembership.status as MembershipStatus,
        userStatus: updatedMembership.user.status as UserStatus,
        joinedAt: updatedMembership.createdAt,
        lastLoginAt: updatedMembership.user.lastLoginAt,
      };
    });
  }

  /**
   * Activates, suspends, or deactivates a user's membership.
   * Protects the last active OWNER from accidental deactivation.
   */
  async updateUserStatus(
    tenantId: string,
    targetUserId: string,
    dto: UpdateUserStatusDto,
    currentUserId: string,
  ): Promise<UserSummary> {
    return withTenantContext(tenantId, async (tx) => {
      const membership = await tx.tenantMembership.findUnique({
        where: {
          userId_tenantId: { userId: targetUserId, tenantId },
        },
        include: { user: true },
      });

      if (!membership) {
        throw new NotFoundException(
          `User '${targetUserId}' does not belong to organization '${tenantId}'.`,
        );
      }

      // Last active Owner protection
      if (
        membership.role === UserRole.OWNER &&
        dto.status !== MembershipStatus.ACTIVE
      ) {
        const activeOwners = await tx.tenantMembership.count({
          where: {
            tenantId,
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        });
        if (activeOwners <= 1) {
          throw new ForbiddenException(
            'Cannot deactivate or suspend the last active Owner of the organization.',
          );
        }
      }

      const updated = await tx.tenantMembership.update({
        where: { id: membership.id },
        data: { status: dto.status },
        include: { user: true },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          action: 'USER_STATUS_CHANGE',
          entity: 'TenantMembership',
          entityId: membership.id,
          details: {
            targetUserId,
            previousStatus: membership.status,
            newStatus: dto.status,
          },
        },
      });

      return {
        id: updated.user.id,
        email: updated.user.email,
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
        phone: updated.user.phone,
        role: updated.role as UserRole,
        membershipStatus: updated.status as MembershipStatus,
        userStatus: updated.user.status as UserStatus,
        joinedAt: updated.createdAt,
        lastLoginAt: updated.user.lastLoginAt,
      };
    });
  }

  /**
   * Removes a user's membership from the tenant.
   * Protects the last active OWNER from removal.
   */
  async removeUser(
    tenantId: string,
    targetUserId: string,
    currentUserId: string,
  ): Promise<void> {
    return withTenantContext(tenantId, async (tx) => {
      const membership = await tx.tenantMembership.findUnique({
        where: {
          userId_tenantId: { userId: targetUserId, tenantId },
        },
      });

      if (!membership) {
        throw new NotFoundException(
          `User '${targetUserId}' does not belong to organization '${tenantId}'.`,
        );
      }

      // Last active Owner protection
      if (membership.role === UserRole.OWNER) {
        const activeOwners = await tx.tenantMembership.count({
          where: {
            tenantId,
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        });
        if (activeOwners <= 1) {
          throw new ForbiddenException(
            'Cannot remove the last active Owner of the organization.',
          );
        }
      }

      await tx.tenantMembership.delete({
        where: { id: membership.id },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          action: 'USER_MEMBERSHIP_REMOVED',
          entity: 'TenantMembership',
          entityId: membership.id,
          details: { removedUserId: targetUserId, role: membership.role },
        },
      });

      logger.info(
        { tenantId, removedUserId: targetUserId },
        `User membership removed from organization '${tenantId}'`,
      );
    });
  }
}
