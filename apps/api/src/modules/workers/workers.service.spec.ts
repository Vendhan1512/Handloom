import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { withTenantContext } from '@handloom/database';
import { SkillProficiency, WorkerStatus } from '@handloom/types';

jest.mock('@handloom/database', () => ({
  prisma: {},
  withTenantContext: jest.fn(),
}));

describe('WorkersService', () => {
  let service: WorkersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkersService],
    }).compile();

    service = module.get<WorkersService>(WorkersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorker', () => {
    it('should register a worker without login credentials and assign skills', async () => {
      const mockCreatedWorker = {
        id: 'worker-1',
        tenantId: 'tenant-1',
        workerCode: 'WRK-001',
        fullName: 'K. Subramanian',
        status: WorkerStatus.ACTIVE,
        joiningDate: new Date(),
        skills: [
          {
            id: 'skill-1',
            workerId: 'worker-1',
            categoryId: 'cat-weaving',
            proficiency: SkillProficiency.MASTER,
            experienceYears: 12,
            isPrimary: true,
            category: { name: 'Weaving', code: 'WEAVING' },
          },
        ],
      };

      const mockTx = {
        worker: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(null) // Check workerCode unique
            .mockResolvedValueOnce(mockCreatedWorker), // Fetch created with skills
          create: jest.fn().mockResolvedValue({ id: 'worker-1' }),
        },
        workerSkill: {
          create: jest.fn().mockResolvedValue({ id: 'skill-1' }),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      const result = await service.createWorker(
        'tenant-1',
        {
          workerCode: 'WRK-001',
          fullName: 'K. Subramanian',
          skills: [
            {
              categoryId: 'cat-weaving',
              proficiency: SkillProficiency.MASTER,
              experienceYears: 12,
              isPrimary: true,
            },
          ],
        },
        'user-admin-1',
      );

      expect(result.workerCode).toBe('WRK-001');
      expect(result.fullName).toBe('K. Subramanian');
      expect(result.skills.length).toBe(1);
      expect(result.skills[0].categoryName).toBe('Weaving');
      expect(mockTx.worker.create).toHaveBeenCalled();
      expect(mockTx.workerSkill.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if duplicate workerCode within the same tenant', async () => {
      const existingWorker = { id: 'worker-existing', workerCode: 'WRK-001' };

      const mockTx = {
        worker: {
          findUnique: jest.fn().mockResolvedValue(existingWorker),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      await expect(
        service.createWorker(
          'tenant-1',
          { workerCode: 'WRK-001', fullName: 'Duplicate Worker' },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateWorkerStatus', () => {
    it('should update worker status and log audit trail', async () => {
      const existingWorker = {
        id: 'worker-1',
        tenantId: 'tenant-1',
        status: WorkerStatus.ACTIVE,
      };

      const updatedWorker = {
        id: 'worker-1',
        tenantId: 'tenant-1',
        status: WorkerStatus.ON_LEAVE,
        skills: [],
      };

      const mockTx = {
        worker: {
          findFirst: jest.fn().mockResolvedValue(existingWorker),
          update: jest.fn().mockResolvedValue(updatedWorker),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };

      (withTenantContext as jest.Mock).mockImplementationOnce((tenantId, cb) =>
        cb(mockTx),
      );

      const result = await service.updateWorkerStatus(
        'tenant-1',
        'worker-1',
        WorkerStatus.ON_LEAVE,
        'user-1',
      );

      expect(result.status).toBe(WorkerStatus.ON_LEAVE);
      expect(mockTx.worker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: WorkerStatus.ON_LEAVE },
        }),
      );
      expect(mockTx.auditLog.create).toHaveBeenCalled();
    });
  });
});
