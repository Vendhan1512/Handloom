import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AppConfigService } from '../../../config/app-config.service';
import { prisma, withTenantContext } from '@handloom/database';
import {
  JwtPayload,
  MembershipStatus,
  UserRole,
  UserStatus,
} from '@handloom/types';

jest.mock('@handloom/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    tenantMembership: {
      findUnique: jest.fn(),
    },
  },
  withTenantContext: jest.fn(),
}));

describe('JwtStrategy — Tenant-Aware Validation & RLS Context (Tests H & I)', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    jwt: {
      secret: 'test-jwt-secret-at-least-32-chars-long-security',
    },
  };

  const validPayload: JwtPayload = {
    sub: 'user-uuid-1',
    email: 'weaver@kanchipuram.org',
    role: UserRole.WEAVER,
    tenantId: 'tenant-uuid-1',
    permissions: ['orders.read'],
    type: 'access',
  };

  const activeUser = {
    id: 'user-uuid-1',
    email: 'weaver@kanchipuram.org',
    firstName: 'Murugan',
    lastName: 'K',
    status: UserStatus.ACTIVE,
  };

  const activeMembership = {
    id: 'membership-uuid-1',
    userId: 'user-uuid-1',
    tenantId: 'tenant-uuid-1',
    role: UserRole.WEAVER,
    status: MembershipStatus.ACTIVE,
    tenant: {
      id: 'tenant-uuid-1',
      name: 'Kanchipuram Silk Weavers Society',
      code: 'KANCHI-01',
      status: 'ACTIVE',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('TEST H: Valid active membership within tenant context', () => {
    it('should validate user and resolve membership inside withTenantContext', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);

      (withTenantContext as jest.Mock).mockImplementation(
        async (tenantId: string, op: any) => {
          expect(tenantId).toBe(validPayload.tenantId);
          const mockTx = {
            tenantMembership: {
              findUnique: jest.fn().mockResolvedValue(activeMembership),
            },
          };
          return op(mockTx);
        },
      );

      const user = await strategy.validate(validPayload);

      expect(user).toBeDefined();
      expect(user.id).toBe(activeUser.id);
      expect(user.email).toBe(activeUser.email);
      expect(user.tenantId).toBe(activeMembership.tenant.id);
      expect(user.tenantName).toBe(activeMembership.tenant.name);
      expect(user.role).toBe(UserRole.WEAVER);
      expect(withTenantContext).toHaveBeenCalledWith(
        validPayload.tenantId,
        expect.any(Function),
      );
    });
  });

  describe('TEST I: Inactive or invalid membership rejected', () => {
    it('should reject non-access token types', async () => {
      const refreshPayload = { ...validPayload, type: 'refresh' as const };
      await expect(strategy.validate(refreshPayload as any)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(refreshPayload as any)).rejects.toThrow(
        'Invalid token type',
      );
    });

    it('should reject if user is not found in global users table', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'User account is inactive or not found',
      );
    });

    it('should reject if user account is inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...activeUser,
        status: UserStatus.INACTIVE,
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'User account is inactive or not found',
      );
    });

    it('should reject if membership is not found for tenant', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);
      (withTenantContext as jest.Mock).mockImplementation(
        async (_tenantId: string, op: any) => {
          const mockTx = {
            tenantMembership: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
          };
          return op(mockTx);
        },
      );

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'Active membership not found for this tenant',
      );
    });

    it('should reject if membership status is suspended or inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);
      (withTenantContext as jest.Mock).mockImplementation(
        async (_tenantId: string, op: any) => {
          const mockTx = {
            tenantMembership: {
              findUnique: jest.fn().mockResolvedValue({
                ...activeMembership,
                status: MembershipStatus.SUSPENDED,
              }),
            },
          };
          return op(mockTx);
        },
      );

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'Active membership not found for this tenant',
      );
    });

    it('should reject if tenant society account is inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);
      (withTenantContext as jest.Mock).mockImplementation(
        async (_tenantId: string, op: any) => {
          const mockTx = {
            tenantMembership: {
              findUnique: jest.fn().mockResolvedValue({
                ...activeMembership,
                tenant: {
                  ...activeMembership.tenant,
                  status: 'INACTIVE',
                },
              }),
            },
          };
          return op(mockTx);
        },
      );

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'Tenant society account is inactive',
      );
    });
  });
});
