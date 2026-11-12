import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { withTenantContext } from '@handloom/database';
import {
  PaginatedResult,
  SkillProficiency,
  WorkerInfo,
  WorkerStatus,
} from '@handloom/types';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerQueryDto } from './dto/worker-query.dto';
import { logger } from '@handloom/logger';

@Injectable()
export class WorkersService {
  /**
   * Lists workers belonging to the tenant with pagination, search, and category filtering.
   */
  async listWorkers(
    tenantId: string,
    query: WorkerQueryDto,
  ): Promise<PaginatedResult<WorkerInfo>> {
    return withTenantContext(tenantId, async (tx) => {
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 20));
      const skip = (page - 1) * limit;

      const whereClause: any = {
        tenantId,
        ...(query.status && { status: query.status }),
      };

      if (query.categoryId) {
        whereClause.skills = {
          some: {
            categoryId: query.categoryId,
          },
        };
      }

      if (query.search && query.search.trim().length > 0) {
        const search = query.search.trim().toLowerCase();
        whereClause.OR = [
          { workerCode: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { village: { contains: search, mode: 'insensitive' } },
          { district: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, workers] = await Promise.all([
        tx.worker.count({ where: whereClause }),
        tx.worker.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            skills: {
              include: {
                category: true,
              },
            },
          },
        }),
      ]);

      const items: WorkerInfo[] = workers.map((w) => this.mapWorkerEntity(w));

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
   * Retrieves single worker details within tenant context.
   */
  async getWorker(tenantId: string, workerId: string): Promise<WorkerInfo> {
    return withTenantContext(tenantId, async (tx) => {
      const worker = await tx.worker.findFirst({
        where: { id: workerId, tenantId },
        include: {
          skills: {
            include: { category: true },
          },
        },
      });

      if (!worker) {
        throw new NotFoundException(
          `Worker '${workerId}' not found in organization '${tenantId}'.`,
        );
      }

      return this.mapWorkerEntity(worker);
    });
  }

  /**
   * Registers a new operational worker without requiring system user credentials.
   */
  async createWorker(
    tenantId: string,
    dto: CreateWorkerDto,
    userId: string,
  ): Promise<WorkerInfo> {
    const workerCode = dto.workerCode.trim().toUpperCase();

    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.worker.findUnique({
        where: {
          tenantId_workerCode: { tenantId, workerCode },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Worker code '${workerCode}' is already registered in this organization.`,
        );
      }

      const worker = await tx.worker.create({
        data: {
          tenantId,
          workerCode,
          fullName: dto.fullName.trim(),
          phone: dto.phone?.trim() || null,
          alternatePhone: dto.alternatePhone?.trim() || null,
          address: dto.address?.trim() || null,
          village: dto.village?.trim() || null,
          district: dto.district?.trim() || null,
          state: dto.state?.trim() || null,
          pinCode: dto.pinCode?.trim() || null,
          status: WorkerStatus.ACTIVE,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
          paymentArrangement: dto.paymentArrangement?.trim() || null,
          emergencyContact: dto.emergencyContact?.trim() || null,
          notes: dto.notes?.trim() || null,
        },
      });

      if (dto.skills && dto.skills.length > 0) {
        await Promise.all(
          dto.skills.map((s) =>
            tx.workerSkill.create({
              data: {
                workerId: worker.id,
                categoryId: s.categoryId,
                proficiency: s.proficiency || SkillProficiency.INTERMEDIATE,
                experienceYears: s.experienceYears || 0,
                isPrimary: s.isPrimary || false,
              },
            }),
          ),
        );
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_CREATE',
          entity: 'Worker',
          entityId: worker.id,
          details: { workerCode, fullName: worker.fullName },
        },
      });

      logger.info(
        { tenantId, workerId: worker.id, workerCode },
        `New worker registered: ${worker.fullName} (${workerCode})`,
      );

      const created = await tx.worker.findUnique({
        where: { id: worker.id },
        include: {
          skills: {
            include: { category: true },
          },
        },
      });

      return this.mapWorkerEntity(created!);
    });
  }

  /**
   * Updates operational worker details and skill assignments.
   */
  async updateWorker(
    tenantId: string,
    workerId: string,
    dto: UpdateWorkerDto,
    userId: string,
  ): Promise<WorkerInfo> {
    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.worker.findFirst({
        where: { id: workerId, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(
          `Worker '${workerId}' not found in organization '${tenantId}'.`,
        );
      }

      await tx.worker.update({
        where: { id: workerId },
        data: {
          ...(dto.fullName && { fullName: dto.fullName.trim() }),
          ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
          ...(dto.alternatePhone !== undefined && { alternatePhone: dto.alternatePhone?.trim() || null }),
          ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
          ...(dto.village !== undefined && { village: dto.village?.trim() || null }),
          ...(dto.district !== undefined && { district: dto.district?.trim() || null }),
          ...(dto.state !== undefined && { state: dto.state?.trim() || null }),
          ...(dto.pinCode !== undefined && { pinCode: dto.pinCode?.trim() || null }),
          ...(dto.paymentArrangement !== undefined && { paymentArrangement: dto.paymentArrangement?.trim() || null }),
          ...(dto.emergencyContact !== undefined && { emergencyContact: dto.emergencyContact?.trim() || null }),
          ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
        },
      });

      if (dto.skills !== undefined) {
        // Replace existing skills
        await tx.workerSkill.deleteMany({
          where: { workerId },
        });

        if (dto.skills.length > 0) {
          await Promise.all(
            dto.skills.map((s) =>
              tx.workerSkill.create({
                data: {
                  workerId,
                  categoryId: s.categoryId,
                  proficiency: s.proficiency || SkillProficiency.INTERMEDIATE,
                  experienceYears: s.experienceYears || 0,
                  isPrimary: s.isPrimary || false,
                },
              }),
            ),
          );
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_UPDATE',
          entity: 'Worker',
          entityId: workerId,
          details: { updatedFields: Object.keys(dto) },
        },
      });

      const updated = await tx.worker.findUnique({
        where: { id: workerId },
        include: {
          skills: {
            include: { category: true },
          },
        },
      });

      return this.mapWorkerEntity(updated!);
    });
  }

  /**
   * Updates worker operational status.
   */
  async updateWorkerStatus(
    tenantId: string,
    workerId: string,
    status: WorkerStatus,
    userId: string,
  ): Promise<WorkerInfo> {
    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.worker.findFirst({
        where: { id: workerId, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(
          `Worker '${workerId}' not found in organization '${tenantId}'.`,
        );
      }

      const updated = await tx.worker.update({
        where: { id: workerId },
        data: { status },
        include: {
          skills: {
            include: { category: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_STATUS_CHANGE',
          entity: 'Worker',
          entityId: workerId,
          details: { previousStatus: existing.status, newStatus: status },
        },
      });

      return this.mapWorkerEntity(updated);
    });
  }

  private mapWorkerEntity(w: any): WorkerInfo {
    return {
      id: w.id,
      tenantId: w.tenantId,
      workerCode: w.workerCode,
      fullName: w.fullName,
      phone: w.phone,
      alternatePhone: w.alternatePhone,
      address: w.address,
      village: w.village,
      district: w.district,
      state: w.state,
      pinCode: w.pinCode,
      status: w.status as WorkerStatus,
      joiningDate: w.joiningDate,
      paymentArrangement: w.paymentArrangement,
      emergencyContact: w.emergencyContact,
      notes: w.notes,
      skills: (w.skills || []).map((s: any) => ({
        id: s.id,
        workerId: s.workerId,
        categoryId: s.categoryId,
        categoryName: s.category?.name || '',
        categoryCode: s.category?.code || '',
        proficiency: s.proficiency as SkillProficiency,
        experienceYears: s.experienceYears,
        isPrimary: s.isPrimary,
      })),
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    };
  }
}
