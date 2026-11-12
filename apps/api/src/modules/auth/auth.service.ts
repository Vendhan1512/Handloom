import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { prisma } from '@handloom/database';
import {
  AuthenticatedUser,
  AuthResponseData,
  AuthTokens,
  JwtPayload,
  MembershipStatus,
  SessionInfo,
  TenantMembershipInfo,
  TenantType,
  UserRole,
  UserStatus,
} from '@handloom/types';
import { AppConfigService } from '../../config/app-config.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { RegisterSocietyDto } from './dto/register-society.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { getPermissionsForRole } from '../../common/permissions/permission-catalog';
import { logger } from '@handloom/logger';

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly passwordHasher: PasswordHasherService,
  ) {
    this.jwtSecret = this.configService.jwt.secret;
    this.jwtExpiresIn = this.configService.jwt.expiresIn;
    this.refreshExpiresIn = this.configService.jwt.refreshExpiresIn;
  }

  /**
   * Onboards a new handloom cooperative society, mill, or cluster.
   * Creates the tenant, creates the root administrator user (or links if exists),
   * assigns the OWNER role via TenantMembership, logs an audit event, and issues tokens.
   */
  async registerSociety(
    dto: RegisterSocietyDto,
    meta?: RequestMetadata,
  ): Promise<AuthResponseData> {
    const societyCode = dto.societyCode.toUpperCase().trim();
    const adminEmail = dto.adminEmail.toLowerCase().trim();

    const existingCode = await prisma.tenant.findUnique({
      where: { code: societyCode },
    });

    if (existingCode) {
      throw new ConflictException(
        `Society code '${societyCode}' is already registered.`,
      );
    }

    const passwordHash = await this.passwordHasher.hash(dto.adminPassword);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.societyName.trim(),
          code: societyCode,
          type: dto.societyType || TenantType.COOPERATIVE,
          contactEmail: adminEmail,
          contactPhone: dto.phone,
          address: dto.address,
        },
      });

      // 2. Find or Create User
      let user = await tx.user.findUnique({
        where: { email: adminEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            firstName: dto.adminFirstName.trim(),
            lastName: dto.adminLastName.trim(),
            phone: dto.phone,
            status: UserStatus.ACTIVE,
          },
        });
      }

      // 3. Create TenantMembership with OWNER role
      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: UserRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'AUTH_REGISTER_SOCIETY',
          entity: 'Tenant',
          entityId: tenant.id,
          details: {
            societyName: tenant.name,
            societyCode: tenant.code,
            adminEmail: user.email,
            membershipId: membership.id,
            role: UserRole.OWNER,
          },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });

      return { tenant, user, membership };
    });

    const permissions = getPermissionsForRole(UserRole.OWNER);
    const tokens = await this.generateTokenPair(
      result.user,
      result.tenant.id,
      UserRole.OWNER,
      meta,
    );

    logger.info(
      { tenantId: result.tenant.id, userId: result.user.id },
      `New society registered: ${result.tenant.name} (${result.tenant.code}) with OWNER ${result.user.email}`,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: UserRole.OWNER,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        tenantCode: result.tenant.code,
        permissions,
      },
      tokens,
    };
  }

  /**
   * Authenticates user via email and password.
   * Supports automatic transparent migration from legacy bcrypt to Argon2id.
   * Resolves active tenant membership, tracks last login, issues rotated tokens.
   */
  async login(dto: LoginDto, meta?: RequestMetadata): Promise<AuthResponseData> {
    const email = dto.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    // Constant-time mitigation / generic error message to prevent account enumeration
    if (!user) {
      // Perform dummy verify to simulate constant-time work
      await this.passwordHasher.verify(dto.password, '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$dummyhash');
      logger.warn({ email, ipAddress: meta?.ipAddress }, 'Login attempt for non-existent user');
      throw new UnauthorizedException('Invalid email or password');
    }

    const verification = await this.passwordHasher.verify(dto.password, user.passwordHash);

    if (!verification.isValid) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          details: { reason: 'Invalid password', ip: meta?.ipAddress },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Transparent Password Migration: If hash was legacy bcrypt, rehash with Argon2id
    if (verification.needsRehash) {
      const newArgon2idHash = await this.passwordHasher.hash(dto.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newArgon2idHash },
      });
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_PASSWORD_MIGRATED_ARGON2ID',
          entity: 'User',
          entityId: user.id,
          details: { previousAlgorithm: 'bcrypt', newAlgorithm: 'argon2id' },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });
      logger.info({ userId: user.id }, 'User password hash transparently upgraded to Argon2id');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is suspended or inactive');
    }

    // Resolve tenant membership
    const activeMemberships = user.memberships.filter(
      (m) => m.status === MembershipStatus.ACTIVE && m.tenant.status === 'ACTIVE',
    );

    if (activeMemberships.length === 0) {
      throw new UnauthorizedException('No active society memberships found for this account');
    }

    let selectedMembership = activeMemberships[0];

    if (dto.societyCode) {
      const code = dto.societyCode.toUpperCase().trim();
      const matched = activeMemberships.find(
        (m) => m.tenant.code.toUpperCase() === code,
      );
      if (!matched) {
        throw new UnauthorizedException(`No active membership in society code '${dto.societyCode}'`);
      }
      selectedMembership = matched;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const userRole = selectedMembership.role as UserRole;
    const permissions = getPermissionsForRole(userRole);
    const tokens = await this.generateTokenPair(
      user,
      selectedMembership.tenant.id,
      userRole,
      meta,
    );

    await prisma.auditLog.create({
      data: {
        tenantId: selectedMembership.tenant.id,
        userId: user.id,
        action: 'AUTH_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: {
          tenantCode: selectedMembership.tenant.code,
          role: userRole,
        },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    const membershipsList: TenantMembershipInfo[] = user.memberships.map((m) => ({
      id: m.id,
      tenantId: m.tenant.id,
      tenantName: m.tenant.name,
      tenantCode: m.tenant.code,
      tenantType: m.tenant.type as TenantType,
      role: m.role as UserRole,
      status: m.status as MembershipStatus,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: userRole,
        tenantId: selectedMembership.tenant.id,
        tenantName: selectedMembership.tenant.name,
        tenantCode: selectedMembership.tenant.code,
        permissions,
        memberships: membershipsList,
      },
      tokens,
    };
  }

  /**
   * Rotates a refresh token session with cryptographic reuse detection.
   * If a previously rotated (revoked) token is presented again, the entire
   * token family is revoked immediately to prevent session hijacking.
   */
  async refresh(
    refreshToken: string,
    meta?: RequestMetadata,
  ): Promise<AuthResponseData> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              include: { tenant: true },
            },
          },
        },
      },
    });

    // 1. REUSE DETECTION: If token was already revoked, revoke entire family!
    if (session && (session.isRevoked || session.revokedAt !== null)) {
      await prisma.session.updateMany({
        where: { familyId: session.familyId },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          tenantId: session.activeTenantId,
          userId: session.userId,
          action: 'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
          entity: 'Session',
          entityId: session.id,
          details: {
            familyId: session.familyId,
            ipAddress: meta?.ipAddress,
            userAgent: meta?.userAgent,
          },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });

      logger.error(
        { userId: session.userId, familyId: session.familyId },
        'CRITICAL: Refresh token reuse detected! Revoking token family.',
      );

      throw new UnauthorizedException('Security violation: Refresh token reuse detected. Please log in again.');
    }

    // 2. Token not found or expired
    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    const user = session.user;
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Resolve tenant membership
    let selectedMembership = user.memberships.find(
      (m) =>
        m.tenantId === session.activeTenantId &&
        m.status === MembershipStatus.ACTIVE &&
        m.tenant.status === 'ACTIVE',
    );

    if (!selectedMembership) {
      selectedMembership = user.memberships.find(
        (m) => m.status === MembershipStatus.ACTIVE && m.tenant.status === 'ACTIVE',
      );
    }

    if (!selectedMembership) {
      throw new UnauthorizedException('No active society membership found');
    }

    const userRole = selectedMembership.role as UserRole;
    const permissions = getPermissionsForRole(userRole);

    // 3. ATOMIC TOKEN ROTATION
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRefreshToken);

    const refreshLifetimeDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshLifetimeDays);

    const [newSession] = await prisma.$transaction([
      // Invalidate the consumed refresh token
      prisma.session.update({
        where: { id: session.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }),
      // Issue new session in the same family
      prisma.session.create({
        data: {
          userId: user.id,
          activeTenantId: selectedMembership.tenant.id,
          tokenHash: newTokenHash,
          familyId: session.familyId,
          parentTokenHash: tokenHash,
          isRevoked: false,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
          expiresAt,
        },
      }),
    ]);

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: userRole,
      tenantId: selectedMembership.tenant.id,
      permissions,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: userRole,
        tenantId: selectedMembership.tenant.id,
        tenantName: selectedMembership.tenant.name,
        tenantCode: selectedMembership.tenant.code,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    };
  }

  /**
   * Revokes current session or all sessions for a user.
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await prisma.session.updateMany({
        where: { userId, tokenHash, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    } else {
      await prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTH_LOGOUT',
        entity: 'User',
        entityId: userId,
        details: { specificSession: !!refreshToken },
      },
    });
  }

  /**
   * Retrieves authenticated user details and active tenant context.
   */
  async getMe(userId: string, activeTenantId?: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const membershipsList: TenantMembershipInfo[] = user.memberships.map((m) => ({
      id: m.id,
      tenantId: m.tenant.id,
      tenantName: m.tenant.name,
      tenantCode: m.tenant.code,
      tenantType: m.tenant.type as TenantType,
      role: m.role as UserRole,
      status: m.status as MembershipStatus,
      createdAt: m.createdAt.toISOString(),
    }));

    let selected = user.memberships.find(
      (m) => m.tenantId === activeTenantId && m.status === MembershipStatus.ACTIVE,
    );

    if (!selected) {
      selected = user.memberships.find((m) => m.status === MembershipStatus.ACTIVE);
    }

    const role = (selected?.role || UserRole.WEAVER) as UserRole;
    const permissions = getPermissionsForRole(role);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      tenantId: selected?.tenant.id || '',
      tenantName: selected?.tenant.name || '',
      tenantCode: selected?.tenant.code || '',
      permissions,
      memberships: membershipsList,
    };
  }

  /**
   * Switches the active tenant context for a multi-tenant user and issues a newly scoped access token.
   */
  async selectTenant(
    userId: string,
    targetTenantId: string,
    meta?: RequestMetadata,
  ): Promise<AuthResponseData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const targetMembership = user.memberships.find(
      (m) =>
        m.tenantId === targetTenantId &&
        m.status === MembershipStatus.ACTIVE &&
        m.tenant.status === 'ACTIVE',
    );

    if (!targetMembership) {
      throw new ForbiddenException(
        `User does not possess an active membership in tenant '${targetTenantId}'`,
      );
    }

    const role = targetMembership.role as UserRole;
    const permissions = getPermissionsForRole(role);
    const tokens = await this.generateTokenPair(
      user,
      targetMembership.tenant.id,
      role,
      meta,
    );

    await prisma.auditLog.create({
      data: {
        tenantId: targetMembership.tenant.id,
        userId: user.id,
        action: 'AUTH_TENANT_SWITCHED',
        entity: 'Tenant',
        entityId: targetMembership.tenant.id,
        details: { targetTenantCode: targetMembership.tenant.code, role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
        tenantId: targetMembership.tenant.id,
        tenantName: targetMembership.tenant.name,
        tenantCode: targetMembership.tenant.code,
        permissions,
      },
      tokens,
    };
  }

  /**
   * Lists active sessions for a user.
   */
  async listSessions(userId: string, currentToken?: string): Promise<SessionInfo[]> {
    const currentHash = currentToken ? this.hashToken(currentToken) : null;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.tokenHash === currentHash,
    }));
  }

  /**
   * Revokes a specific session belonging to the user.
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already revoked');
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTH_SESSION_REVOKED',
        entity: 'Session',
        entityId: sessionId,
      },
    });
  }

  /**
   * Changes password, upgrades to Argon2id, and revokes all other active sessions for security.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    meta?: RequestMetadata,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const verification = await this.passwordHasher.verify(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!verification.isValid) {
      throw new UnauthorizedException('Current password does not match');
    }

    const newHash = await this.passwordHasher.hash(dto.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      // Revoke all existing sessions to enforce re-authentication
      prisma.session.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_PASSWORD_CHANGED',
          entity: 'User',
          entityId: user.id,
          details: { ip: meta?.ipAddress },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      }),
    ]);
  }

  /**
   * Generates a signed short-lived JWT access token and cryptographically secure refresh token.
   */
  private async generateTokenPair(
    user: { id: string; email: string },
    tenantId: string,
    role: UserRole,
    meta?: RequestMetadata,
  ): Promise<AuthTokens> {
    const permissions = getPermissionsForRole(role);

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
      tenantId,
      permissions,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    // Generate random 40-byte cryptographically secure token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshToken);

    const refreshLifetimeDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshLifetimeDays);

    await prisma.session.create({
      data: {
        userId: user.id,
        activeTenantId: tenantId,
        tokenHash,
        familyId: crypto.randomUUID(),
        isRevoked: false,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes
    };
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
