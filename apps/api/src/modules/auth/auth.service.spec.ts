import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { prisma } from '@handloom/database';
import { TenantType, UserRole, UserStatus } from '@handloom/types';
import * as bcrypt from 'bcryptjs';

jest.mock('@handloom/database', () => ({
  prisma: {
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
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

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
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test_secret_key_32_characters_long';
              if (key === 'JWT_EXPIRES_IN') return '15m';
              if (key === 'REFRESH_TOKEN_EXPIRES_IN') return '7d';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerSociety', () => {
    const dto = {
      societyName: 'Salem Silk Weavers',
      societyCode: 'SALEM-01',
      societyType: TenantType.COOPERATIVE,
      adminEmail: 'admin@salem.org',
      adminPassword: 'Password@123',
      adminFirstName: 'Kavitha',
      adminLastName: 'Raman',
    };

    it('should throw ConflictException if society code already exists', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      await expect(service.registerSociety(dto)).rejects.toThrow(ConflictException);
    });

    it('should register society and return user and tokens', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          tenant: {
            create: jest.fn().mockResolvedValue({
              id: 'tenant-123',
              name: dto.societyName,
              code: dto.societyCode,
            }),
          },
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-123',
              email: dto.adminEmail,
              firstName: dto.adminFirstName,
              lastName: dto.adminLastName,
              role: UserRole.SOCIETY_ADMIN,
            }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({ id: 'audit-123' }),
          },
        });
      });
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-123' });

      const result = await service.registerSociety(dto);

      expect(result.user.email).toBe(dto.adminEmail);
      expect(result.user.role).toBe(UserRole.SOCIETY_ADMIN);
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should authenticate user and return tokens when credentials match', async () => {
      const password = 'Password@123';
      const passwordHash = await bcrypt.hash(password, 10);
      const mockUser = {
        id: 'user-123',
        email: 'test@weaver.org',
        passwordHash,
        firstName: 'Murugan',
        lastName: 'P',
        role: UserRole.WEAVER,
        status: UserStatus.ACTIVE,
        tenantId: 'tenant-123',
        tenant: {
          id: 'tenant-123',
          name: 'Co-op Hub',
          code: 'HUB-01',
          status: 'ACTIVE',
        },
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-123' });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-123' });

      const result = await service.login({ email: 'test@weaver.org', password });

      expect(result.user.id).toBe('user-123');
      expect(result.user.role).toBe(UserRole.WEAVER);
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
    });
  });
});
