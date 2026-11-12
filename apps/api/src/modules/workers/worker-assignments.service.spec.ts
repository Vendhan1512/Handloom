import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WorkerAssignmentsService } from './worker-assignments.service';
import { withTenantContext } from '@handloom/database';
import { AssignmentStatus, WorkerStatus } from '@handloom/types';

jest.mock('@handloom/database', () => ({
  prisma: {},
  withTenantContext: jest.fn(),
}));

describe('WorkerAssignmentsService', () => {
  let service: WorkerAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkerAssignmentsService],
    }).compile();

    service = module.get<WorkerAssignmentsService>(WorkerAssignmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAssignment', () => {
    it('should create assignment when worker and category belong to identical tenant', async () => {
      const mockWorker = {
        id: 'worker-1',
        fullName: 'K. Subramanian',
        workerCode: 'WRK-001',
        status: WorkerStatus.ACTIVE,
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Weaving',
        code: 'WEAVING',
      };

      const mockCreatedAssignment = {
        id: 'assignment-1',
        tenantId: 'tenant-1',
        workerId: 'worker-1',
        categoryId: 'cat-1',
        assignmentDate: new Date(),
        expectedCompletionDate: null,
        status: AssignmentStatus.ASSIGNED,
        instructions: 'Test instructions',
        createdById: 'supervisor-1',
        createdAt: new Date(),
        worker: mockWorker,
        category: mockCategory,
      };

      const mockTx = {
        worker: {
          findFirst: jest.fn().mockResolvedValue(mockWorker),
        },
        workerCategory: {
          findFirst: jest.fn().mockResolvedValue(mockCategory),
        },
        workerAssignment: {
          create: jest.fn().mockResolvedValue(mockCreatedAssignment),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      const result = await service.createAssignment(
        'tenant-1',
        {
          workerId: 'worker-1',
          categoryId: 'cat-1',
          instructions: 'Test instructions',
        },
        'supervisor-1',
      );

      expect(result.workerCode).toBe('WRK-001');
      expect(result.categoryName).toBe('Weaving');
      expect(result.status).toBe(AssignmentStatus.ASSIGNED);
      expect(mockTx.workerAssignment.create).toHaveBeenCalled();
    });

    it('CRITICAL: should reject creating assignment if worker belongs to another tenant', async () => {
      const mockTx = {
        worker: {
          findFirst: jest.fn().mockResolvedValue(null), // Worker not in tenant-1!
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.createAssignment(
          'tenant-1',
          {
            workerId: 'foreign-worker-from-tenant-2',
            categoryId: 'cat-1',
          },
          'supervisor-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject creating assignment if worker is TERMINATED', async () => {
      const mockTerminatedWorker = {
        id: 'worker-1',
        fullName: 'Terminated Worker',
        workerCode: 'WRK-009',
        status: WorkerStatus.TERMINATED,
      };

      const mockTx = {
        worker: {
          findFirst: jest.fn().mockResolvedValue(mockTerminatedWorker),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.createAssignment(
          'tenant-1',
          {
            workerId: 'worker-1',
            categoryId: 'cat-1',
          },
          'supervisor-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
