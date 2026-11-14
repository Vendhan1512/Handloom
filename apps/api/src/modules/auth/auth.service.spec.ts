import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { AppConfigService } from '../../config/app-config.service';
import { prisma, withSuperAdminContext, withTenantContext } from '@handloom/database';
import {
  MembershipStatus,
  Permission,
  TenantType,
  UserRole,
  UserStatus,
} from '@handloom/types';

jest.mock('@handloom/database', () => {
  const internalPrisma: any = {
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenantMembership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) =>
      typeof cb === 'function' ? cb(internalPrisma) : Promise.all(cb),
    ),
  };

  return {
    prisma: internalPrisma,
    withSuperAdminContext: jest.fn((cb: any) => {
      internalPrisma.$transaction(cb);
      return cb(internalPrisma);
    }),
    withTenantContext: jest.fn((_tenantId: string, cb: any) => {
      internalPrisma.$transaction(cb);
      return cb(internalPrisma);
    }),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let passwordHasher: PasswordHasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            jwt: {
              secret: 'test_secret_key_32_characters_long_min',
              expiresIn: '15m',
              refreshSecret: 'test_refresh_secret_32_characters_long',
              refreshExpiresIn: '7d',
            },
          },
        },
        {
          provide: PasswordHasherService,
          useValue: {
            hash: jest.fn().mockResolvedValue('$argon2id$v=19$m=19456,t=2,p=1$mockedargon2hash'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    passwordHasher = module.get<PasswordHasherService>(PasswordHasherService);
    jest.clearAllMocks();
    (withSuperAdminContext as jest.Mock).mockImplementation((cb: any) => {
      (prisma.$transaction as jest.Mock)(cb);
      return cb(prisma);
    });
    (withTenantContext as jest.Mock).mockImplementation((_tenantId: string, cb: any) => {
      (prisma.$transaction as jest.Mock)(cb);
      return cb(prisma);
    });
    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) =>
      typeof cb === 'function' ? cb(prisma) : Promise.all(cb),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerSociety', () => {
    const dto = {
      societyName: 'Salem Silk Weavers Co-op',
      societyCode: 'SALEM-01',
      societyType: TenantType.COOPERATIVE,
      adminEmail: 'admin@salem.org',
      adminPassword: 'SecurePassword#2026',
      adminFirstName: 'Kavitha',
      adminLastName: 'Raman',
    };

    it('should throw ConflictException if society code already registered', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-tenant-id' });

      await expect(service.registerSociety(dto)).rejects.toThrow(ConflictException);
    });

    it('should register tenant, user and OWNER membership in a transaction and return tokens', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      const mockRegisterTx = {
        tenant: {
          create: jest.fn().mockResolvedValue({
            id: 'tenant-salem-1',
            name: dto.societyName,
            code: dto.societyCode,
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-admin-1',
            email: dto.adminEmail,
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
          }),
        },
        tenantMembership: {
          create: jest.fn().mockResolvedValue({
            id: 'membership-1',
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
          }),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
        },
      };
      (withSuperAdminContext as jest.Mock).mockImplementationOnce(async (callback) => {
        return callback(mockRegisterTx);
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockRegisterTx);
      });
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });

      const result = await service.registerSociety(dto);

      expect(result.user.email).toBe(dto.adminEmail);
      expect(result.user.role).toBe(UserRole.OWNER);
      expect(result.user.tenantCode).toBe(dto.societyCode);
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.tokens.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Kanchipuram Silk Co-op',
      code: 'KANCHI-01',
      status: 'ACTIVE',
    };

    const mockMembership = {
      id: 'membership-1',
      tenantId: 'tenant-1',
      role: UserRole.OWNER,
      status: MembershipStatus.ACTIVE,
      createdAt: new Date(),
      tenant: mockTenant,
    };

    const mockUser = {
      id: 'user-1',
      email: 'owner@kanchi.org',
      passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$argonhash',
      firstName: 'Arun',
      lastName: 'Kumar',
      status: UserStatus.ACTIVE,
      memberships: [mockMembership],
    };

    it('should throw UnauthorizedException if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password verification fails', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: false,
        needsRehash: false,
        algorithm: 'argon2id',
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

      await expect(
        service.login({ email: mockUser.email, password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should authenticate user with Argon2id hash successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: true,
        needsRehash: false,
        algorithm: 'argon2id',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

      const result = await service.login({
        email: mockUser.email,
        password: 'ValidPassword#123',
      });

      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe(UserRole.OWNER);
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(passwordHasher.hash).not.toHaveBeenCalled(); // No rehash needed
    });

    it('should transparently migrate legacy bcrypt hash to Argon2id on successful login', async () => {
      const userWithBcrypt = {
        ...mockUser,
        passwordHash: '$2b$10$legacybcrypthashvalue',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithBcrypt);
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: true,
        needsRehash: true,
        algorithm: 'bcrypt',
      });
      (passwordHasher.hash as jest.Mock).mockResolvedValue('$argon2id$v=19$newArgonHash');
      (prisma.user.update as jest.Mock).mockResolvedValue(userWithBcrypt);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

      const result = await service.login({
        email: userWithBcrypt.email,
        password: 'LegacyPassword#123',
      });

      expect(result.user.email).toBe(userWithBcrypt.email);
      expect(passwordHasher.hash).toHaveBeenCalledWith('LegacyPassword#123');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userWithBcrypt.id },
        data: { passwordHash: '$argon2id$v=19$newArgonHash' },
      });
    });

    it('should throw UnauthorizedException if user account is suspended', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: true,
        needsRehash: false,
        algorithm: 'argon2id',
      });

      await expect(
        service.login({ email: mockUser.email, password: 'ValidPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should filter by societyCode and reject if code does not match active membership', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: true,
        needsRehash: false,
        algorithm: 'argon2id',
      });

      await expect(
        service.login({
          email: mockUser.email,
          password: 'ValidPassword',
          societyCode: 'NON-EXISTENT-CODE',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh & Token Rotation with Reuse Detection', () => {
    const rawRefreshToken = 'sample-refresh-token-bytes';
    const tokenHash = 'mocked-hash-of-sample-refresh-token';

    beforeEach(() => {
      jest.spyOn(service, 'hashToken').mockReturnValue(tokenHash);
    });

    it('should rotate token successfully and issue new token pair', async () => {
      const validSession = {
        id: 'session-1',
        userId: 'user-1',
        activeTenantId: 'tenant-1',
        familyId: 'family-uuid-1',
        tokenHash,
        isRevoked: false,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: {
          id: 'user-1',
          email: 'user@test.org',
          firstName: 'User',
          lastName: 'One',
          status: UserStatus.ACTIVE,
          memberships: [
            {
              tenantId: 'tenant-1',
              role: UserRole.ADMIN,
              status: MembershipStatus.ACTIVE,
              tenant: { id: 'tenant-1', name: 'Co-op', code: 'CO-01', status: 'ACTIVE' },
            },
          ],
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(validSession);
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: 'session-1', isRevoked: true },
        { id: 'session-2', familyId: 'family-uuid-1' },
      ]);

      const result = await service.refresh(rawRefreshToken);

      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('CRITICAL: should detect refresh token reuse, revoke entire token family and throw UnauthorizedException', async () => {
      const alreadyRevokedSession = {
        id: 'session-revoked-1',
        userId: 'user-1',
        familyId: 'compromised-family-uuid-999',
        tokenHash,
        isRevoked: true,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: { id: 'user-1', status: UserStatus.ACTIVE, memberships: [] },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(alreadyRevokedSession);
      (prisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-alert' });

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(
        'Security violation: Refresh token reuse detected. Please log in again.',
      );

      // Verify entire family is revoked
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'compromised-family-uuid-999' },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
      // Verify audit security alert logged
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
          }),
        }),
      );
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      const expiredSession = {
        id: 'session-expired',
        userId: 'user-1',
        familyId: 'family-1',
        tokenHash,
        isRevoked: false,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000 * 60), // In past
        user: { id: 'user-1', status: UserStatus.ACTIVE, memberships: [] },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(expiredSession);
      (prisma.session.update as jest.Mock).mockResolvedValue(expiredSession);

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('selectTenant', () => {
    it('should switch tenant and issue re-scoped tokens if user has active membership', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.org',
        memberships: [
          {
            tenantId: 'tenant-target',
            role: UserRole.STOREKEEPER,
            status: MembershipStatus.ACTIVE,
            tenant: { id: 'tenant-target', name: 'Target Mill', code: 'TM-01', status: 'ACTIVE' },
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-new' });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-switch' });

      const result = await service.selectTenant('user-1', 'tenant-target');

      expect(result.user.tenantId).toBe('tenant-target');
      expect(result.user.role).toBe(UserRole.STOREKEEPER);
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
    });

    it('should throw ForbiddenException if user lacks active membership in target tenant', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.org',
        memberships: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.selectTenant('user-1', 'unauthorized-tenant-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    it('should update password with Argon2id and revoke all active sessions', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: '$argon2id$oldhash',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: true,
        needsRehash: false,
        algorithm: 'argon2id',
      });
      (passwordHasher.hash as jest.Mock).mockResolvedValue('$argon2id$newhash');
      (prisma.$transaction as jest.Mock).mockResolvedValue([]);

      await service.changePassword('user-1', {
        currentPassword: 'OldPassword#123',
        newPassword: 'NewPassword#456',
      });

      expect(passwordHasher.hash).toHaveBeenCalledWith('NewPassword#456');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if current password verification fails', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: '$argon2id$oldhash',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordHasher.verify as jest.Mock).mockResolvedValue({
        isValid: false,
        needsRehash: false,
        algorithm: 'argon2id',
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'IncorrectOldPassword',
          newPassword: 'NewPassword#456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
