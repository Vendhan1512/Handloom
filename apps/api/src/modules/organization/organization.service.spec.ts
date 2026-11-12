import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { prisma, withTenantContext } from '@handloom/database';
import { TenantType } from '@handloom/types';

jest.mock('@handloom/database', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
  withTenantContext: jest.fn((tenantId, cb) =>
    cb({
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    }),
  ),
}));

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrganization', () => {
    it('should return organization profile with counts', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Kanchipuram Silk Co-op',
        code: 'KANCHI-01',
        slug: 'kanchi-silk',
        type: TenantType.COOPERATIVE,
        _count: { memberships: 5, workers: 40, workerCategories: 10, workerAssignments: 15 },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb({
          tenant: {
            findUnique: jest.fn().mockResolvedValue(mockTenant),
          },
        }),
      );

      const result = await service.getOrganization('tenant-1');
      expect(result.id).toBe('tenant-1');
      expect(result.name).toBe('Kanchipuram Silk Co-op');
      expect(result.code).toBe('KANCHI-01');
      expect(result.memberCount).toBe(5);
      expect(result.workerCount).toBe(40);
    });

    it('should throw NotFoundException if organization not found', async () => {
      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb({
          tenant: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        }),
      );

      await expect(service.getOrganization('nonexistent-tenant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrganization', () => {
    it('should update organization profile and log audit trail', async () => {
      const existing = {
        id: 'tenant-1',
        name: 'Old Name',
        slug: 'old-slug',
      };
      const updated = {
        id: 'tenant-1',
        name: 'New Name',
        slug: 'new-slug',
      };

      const mockTx = {
        tenant: {
          findUnique: jest.fn().mockResolvedValueOnce(existing).mockResolvedValueOnce(null),
          update: jest.fn().mockResolvedValue(updated),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      const result = await service.updateOrganization(
        'tenant-1',
        { name: 'New Name', slug: 'new-slug' },
        'user-1',
      );

      expect(result).toEqual(updated);
      expect(mockTx.tenant.update).toHaveBeenCalled();
      expect(mockTx.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if updated slug is taken by another tenant', async () => {
      const existing = { id: 'tenant-1', slug: 'my-slug' };
      const otherTenantWithSameSlug = { id: 'tenant-2', slug: 'taken-slug' };

      const mockTx = {
        tenant: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(existing)
            .mockResolvedValueOnce(otherTenantWithSameSlug),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.updateOrganization(
          'tenant-1',
          { slug: 'taken-slug' },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
