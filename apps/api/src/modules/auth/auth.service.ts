import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { prisma } from '@handloom/database';
import {
  AuthenticatedUser,
  AuthResponseData,
  AuthTokens,
  JwtPayload,
  TenantType,
  UserRole,
  UserStatus,
} from '@handloom/types';
import { RegisterSocietyDto } from './dto/register-society.dto';
import { LoginDto } from './dto/login.dto';
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
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'handloom_default_secret_key_change_in_production_32chars';
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.refreshExpiresIn =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d';
  }

  async registerSociety(
    dto: RegisterSocietyDto,
    meta?: RequestMetadata,
  ): Promise<AuthResponseData> {
    const existingCode = await prisma.tenant.findUnique({
      where: { code: dto.societyCode },
    });

    if (existingCode) {
      throw new ConflictException(
        `Society code '${dto.societyCode}' is already registered.`,
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.adminPassword, saltRounds);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.societyName,
          code: dto.societyCode,
          type: dto.societyType || TenantType.COOPERATIVE,
          contactEmail: dto.adminEmail,
          contactPhone: dto.phone,
          address: dto.address,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase().trim(),
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          phone: dto.phone,
          role: UserRole.SOCIETY_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'AUTH_REGISTER_SOCIETY',
          entity: 'Tenant',
          entityId: tenant.id,
          details: {
            societyName: dto.societyName,
            societyCode: dto.societyCode,
            adminEmail: dto.adminEmail,
          },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });

      return { tenant, user };
    });

    const tokens = await this.generateTokenPair(result.user, result.tenant.id, meta);

    logger.info(
      { tenantId: result.tenant.id, userId: result.user.id },
      `New society registered: ${dto.societyName} (${dto.societyCode})`,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role as UserRole,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        tenantCode: result.tenant.code,
      },
      tokens,
    };
  }

  async login(dto: LoginDto, meta?: RequestMetadata): Promise<AuthResponseData> {
    const email = dto.email.toLowerCase().trim();

    let user;
    if (dto.societyCode) {
      const tenant = await prisma.tenant.findUnique({
        where: { code: dto.societyCode },
      });
      if (!tenant) {
        throw new UnauthorizedException('Invalid credentials or society code');
      }
      user = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId: tenant.id, email } },
        include: { tenant: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { email },
        include: { tenant: true },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is suspended or inactive');
    }

    if (user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Society account is suspended or inactive');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokenPair(user, user.tenantId, meta);

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'AUTH_LOGIN',
        entity: 'User',
        entityId: user.id,
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
        role: user.role as UserRole,
        tenantId: user.tenant.id,
        tenantName: user.tenant.name,
        tenantCode: user.tenant.code,
      },
      tokens,
    };
  }

  async refresh(
    refreshToken: string,
    meta?: RequestMetadata,
  ): Promise<AuthResponseData> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token is not a valid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { tenant: true },
        },
      },
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token is invalid or has been revoked');
    }

    // Revoke previous session (Token Rotation)
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = session.user;
    if (user.status !== UserStatus.ACTIVE || user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account or society is inactive');
    }

    const newTokens = await this.generateTokenPair(user, user.tenantId, meta);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        tenantId: user.tenant.id,
        tenantName: user.tenant.name,
        tenantCode: user.tenant.code,
      },
      tokens: newTokens,
    };
  }

  async logout(userId: string, token?: string): Promise<void> {
    if (token) {
      const tokenHash = this.hashToken(token);
      await prisma.session.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      tenantId: user.tenant.id,
      tenantName: user.tenant.name,
      tenantCode: user.tenant.code,
    };
  }

  private async generateTokenPair(
    user: { id: string; email: string; role: string },
    tenantId: string,
    meta?: RequestMetadata,
  ): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.jwtSecret,
      expiresIn: this.refreshExpiresIn,
    });

    // Store hashed refresh token in Session table
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
