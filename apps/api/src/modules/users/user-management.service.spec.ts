import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { PasswordHasherService } from '../auth/services/password-hasher.service';
import { withTenantContext } from '@handloom/database';
import { MembershipStatus, UserRole, UserStatus } from '@handloom/types';

jest.mock('@handloom/database', () => ({
  prisma: {},
  withTenantContext: jest.fn(),
}));

describe('UserManagementService', () => {
  let service: UserManagementService;
  let passwordHasher: PasswordHasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: PasswordHasherService,
          useValue: {
            hash: jest.fn().mockResolvedValue('$argon2id$mockedhash'),
          },
        },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
    passwordHasher = module.get<PasswordHasherService>(PasswordHasherService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should register a new user and membership, hashing initial password', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-new',
            email: 'supervisor@salem.org',
            firstName: 'M',
            lastName: 'Raman',
            status: UserStatus.ACTIVE,
          }),
        },
        tenantMembership: {
          create: jest.fn().mockResolvedValue({
            id: 'membership-1',
            role: UserRole.SUPERVISOR,
            status: MembershipStatus.ACTIVE,
            createdAt: new Date(),
          }),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      const result = await service.createUser(
        'tenant-1',
        {
          email: 'supervisor@salem.org',
          firstName: 'M',
          lastName: 'Raman',
          role: UserRole.SUPERVISOR,
        },
        'owner-user-id',
        UserRole.OWNER,
      );

      expect(result.email).toBe('supervisor@salem.org');
      expect(result.role).toBe(UserRole.SUPERVISOR);
      expect(passwordHasher.hash).toHaveBeenCalled();
      expect(mockTx.tenantMembership.create).toHaveBeenCalled();
    });

    it('should reject assigning OWNER role if requester is not OWNER or SUPER_ADMIN', async () => {
      await expect(
        service.createUser(
          'tenant-1',
          {
            email: 'newowner@test.com',
            firstName: 'A',
            lastName: 'B',
            role: UserRole.OWNER,
          },
          'admin-user-id',
          UserRole.ADMIN, // Requester is only ADMIN
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user already has membership in this tenant', async () => {
      const existingUser = { id: 'user-exist', email: 'existing@salem.org' };
      const existingMembership = { id: 'mem-1', tenantId: 'tenant-1' };

      const mockTx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(existingUser),
        },
        tenantMembership: {
          findUnique: jest.fn().mockResolvedValue(existingMembership),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.createUser(
          'tenant-1',
          {
            email: 'existing@salem.org',
            firstName: 'A',
            lastName: 'B',
            role: UserRole.STOREKEEPER,
          },
          'owner-user-id',
          UserRole.OWNER,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUser (Privilege Escalation Defense)', () => {
    it('should reject when user attempts to elevate their own role', async () => {
      await expect(
        service.updateUser(
          'tenant-1',
          'my-user-id',
          { role: UserRole.OWNER },
          'my-user-id', // current user is same as target user
          UserRole.SUPERVISOR,
        ),
      ).rejects.toThrow('Users cannot elevate or change their own assigned role.');
    });
  });

  describe('updateUserStatus (Last Active Owner Protection)', () => {
    it('CRITICAL: should reject deactivating the last active OWNER of the organization', async () => {
      const mockTx = {
        tenantMembership: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'mem-owner-1',
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
            user: { id: 'owner-user-1' },
          }),
          count: jest.fn().mockResolvedValue(1), // Only 1 active owner!
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.updateUserStatus(
          'tenant-1',
          'owner-user-1',
          { status: MembershipStatus.INACTIVE },
          'other-admin-id',
        ),
      ).rejects.toThrow('Cannot deactivate or suspend the last active Owner of the organization.');
    });
  });

  describe('removeUser (Last Active Owner Protection)', () => {
    it('CRITICAL: should reject removing the last active OWNER of the organization', async () => {
      const mockTx = {
        tenantMembership: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'mem-owner-1',
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
          }),
          count: jest.fn().mockResolvedValue(1), // Only 1 active owner!
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.removeUser('tenant-1', 'owner-user-1', 'other-admin-id'),
      ).rejects.toThrow('Cannot remove the last active Owner of the organization.');
    });
  });
});
