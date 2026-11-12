import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { withTenantContext } from '@handloom/database';
import {
  AssignmentStatus,
  PaginatedResult,
  WorkerAssignmentInfo,
  WorkerStatus,
} from '@handloom/types';
import { CreateWorkerAssignmentDto } from './dto/create-worker-assignment.dto';
import { UpdateWorkerAssignmentDto } from './dto/update-worker-assignment.dto';
import { logger } from '@handloom/logger';

export interface AssignmentQueryDto {
  page?: number;
  limit?: number;
  workerId?: string;
  status?: AssignmentStatus;
}

@Injectable()
export class WorkerAssignmentsService {
  /**
   * Lists assignments scoped to tenant with optional worker and status filters.
   */
  async listAssignments(
    tenantId: string,
    query: AssignmentQueryDto,
  ): Promise<PaginatedResult<WorkerAssignmentInfo>> {
    return withTenantContext(tenantId, async (tx) => {
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 20));
      const skip = (page - 1) * limit;

      const whereClause: any = {
        tenantId,
        ...(query.workerId && { workerId: query.workerId }),
        ...(query.status && { status: query.status }),
      };

      const [total, assignments] = await Promise.all([
        tx.workerAssignment.count({ where: whereClause }),
        tx.workerAssignment.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { assignmentDate: 'desc' },
          include: {
            worker: true,
            category: true,
          },
        }),
      ]);

      const items: WorkerAssignmentInfo[] = assignments.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        workerId: a.workerId,
        workerName: a.worker.fullName,
        workerCode: a.worker.workerCode,
        categoryId: a.categoryId,
        categoryName: a.category.name,
        assignmentDate: a.assignmentDate,
        expectedCompletionDate: a.expectedCompletionDate,
        status: a.status as AssignmentStatus,
        instructions: a.instructions,
        createdById: a.createdById,
        createdAt: a.createdAt,
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
   * Creates a worker assignment task allocation.
   * Strictly enforces that worker and category belong to the identical tenant.
   * Note: An assignment is NOT production completion, NOT material issuance, and NOT proof of payment.
   */
  async createAssignment(
    tenantId: string,
    dto: CreateWorkerAssignmentDto,
    userId: string,
  ): Promise<WorkerAssignmentInfo> {
    return withTenantContext(tenantId, async (tx) => {
      // 1. Strict Cross-Tenant Worker Validation
      const worker = await tx.worker.findFirst({
        where: { id: dto.workerId, tenantId },
      });

      if (!worker) {
        throw new NotFoundException(
          `Worker '${dto.workerId}' not found in organization '${tenantId}'.`,
        );
      }

      if (worker.status === WorkerStatus.TERMINATED) {
        throw new ConflictException(
          `Cannot allocate work assignments to terminated worker '${worker.fullName}' (${worker.workerCode}).`,
        );
      }

      // 2. Strict Category Validation
      const category = await tx.workerCategory.findFirst({
        where: { id: dto.categoryId, tenantId },
      });

      if (!category) {
        throw new NotFoundException(
          `Worker category '${dto.categoryId}' not found in organization '${tenantId}'.`,
        );
      }

      // 3. Create Assignment
      const assignment = await tx.workerAssignment.create({
        data: {
          tenantId,
          workerId: worker.id,
          categoryId: category.id,
          assignmentDate: dto.assignmentDate
            ? new Date(dto.assignmentDate)
            : new Date(),
          expectedCompletionDate: dto.expectedCompletionDate
            ? new Date(dto.expectedCompletionDate)
            : null,
          status: AssignmentStatus.ASSIGNED,
          instructions: dto.instructions?.trim() || null,
          createdById: userId,
        },
        include: {
          worker: true,
          category: true,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_ASSIGNMENT_CREATE',
          entity: 'WorkerAssignment',
          entityId: assignment.id,
          details: {
            workerCode: worker.workerCode,
            categoryCode: category.code,
            assignmentDate: assignment.assignmentDate,
          },
        },
      });

      logger.info(
        {
          tenantId,
          assignmentId: assignment.id,
          workerCode: worker.workerCode,
        },
        `Work assignment created for ${worker.fullName} (${category.name})`,
      );

      return {
        id: assignment.id,
        tenantId: assignment.tenantId,
        workerId: assignment.workerId,
        workerName: assignment.worker.fullName,
        workerCode: assignment.worker.workerCode,
        categoryId: assignment.categoryId,
        categoryName: assignment.category.name,
        assignmentDate: assignment.assignmentDate,
        expectedCompletionDate: assignment.expectedCompletionDate,
        status: assignment.status as AssignmentStatus,
        instructions: assignment.instructions,
        createdById: assignment.createdById,
        createdAt: assignment.createdAt,
      };
    });
  }

  /**
   * Updates assignment progress or instructions.
   */
  async updateAssignment(
    tenantId: string,
    assignmentId: string,
    dto: UpdateWorkerAssignmentDto,
    userId: string,
  ): Promise<WorkerAssignmentInfo> {
    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.workerAssignment.findFirst({
        where: { id: assignmentId, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(
          `Assignment '${assignmentId}' not found in organization '${tenantId}'.`,
        );
      }

      const updated = await tx.workerAssignment.update({
        where: { id: assignmentId },
        data: {
          ...(dto.status && { status: dto.status }),
          ...(dto.expectedCompletionDate !== undefined && {
            expectedCompletionDate: dto.expectedCompletionDate
              ? new Date(dto.expectedCompletionDate)
              : null,
          }),
          ...(dto.instructions !== undefined && {
            instructions: dto.instructions?.trim() || null,
          }),
        },
        include: {
          worker: true,
          category: true,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_ASSIGNMENT_UPDATE',
          entity: 'WorkerAssignment',
          entityId: assignmentId,
          details: { ...dto } as any,
        },
      });

      return {
        id: updated.id,
        tenantId: updated.tenantId,
        workerId: updated.workerId,
        workerName: updated.worker.fullName,
        workerCode: updated.worker.workerCode,
        categoryId: updated.categoryId,
        categoryName: updated.category.name,
        assignmentDate: updated.assignmentDate,
        expectedCompletionDate: updated.expectedCompletionDate,
        status: updated.status as AssignmentStatus,
        instructions: updated.instructions,
        createdById: updated.createdById,
        createdAt: updated.createdAt,
      };
    });
  }
}
