import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { withTenantContext } from '@handloom/database';
import { WorkerCategoryInfo } from '@handloom/types';
import { CreateWorkerCategoryDto } from './dto/create-worker-category.dto';
import { UpdateWorkerCategoryDto } from './dto/update-worker-category.dto';
import { logger } from '@handloom/logger';

export const DEFAULT_WORKER_CATEGORIES = [
  { name: 'Weaving', code: 'WEAVING', description: 'Operating frame, pit, or jacquard handlooms' },
  { name: 'Bobbin Winding', code: 'WINDING', description: 'Winding warp and pirn yarn onto bobbins and shuttles' },
  { name: 'Warping', code: 'WARPING', description: 'Aligning warp ends across warping mill and drum' },
  { name: 'Beaming', code: 'BEAMING', description: 'Tensioning and rolling warp onto the loom warp beam' },
  { name: 'Sizing', code: 'SIZING', description: 'Applying natural starch dressing to strengthen yarn' },
  { name: 'Dyeing', code: 'DYEING', description: 'Hank dyeing with natural or azo-free chemical dyes' },
  { name: 'Loom Preparation', code: 'LOOM_PREP', description: 'Drafting, denting, and heddle tie-up' },
  { name: 'Quality Inspection', code: 'QUALITY_INSPECT', description: 'Inspecting woven pieces for density and defects' },
  { name: 'Folding & Packing', code: 'PACKING', description: 'Tasseling, folding, and packaging finished sarees' },
  { name: 'Transport & Delivery', code: 'TRANSPORT', description: 'Logistics between depot and artisan households' },
];

@Injectable()
export class WorkerCategoriesService {
  /**
   * Lists all active worker skill categories for the tenant.
   * Automatically initializes default categories if none exist.
   */
  async listCategories(tenantId: string): Promise<WorkerCategoryInfo[]> {
    return withTenantContext(tenantId, async (tx) => {
      let categories = await tx.workerCategory.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
      });

      // Auto-seed defaults if tenant categories have not been initialized yet
      if (categories.length === 0) {
        await tx.workerCategory.createMany({
          data: DEFAULT_WORKER_CATEGORIES.map((cat) => ({
            tenantId,
            name: cat.name,
            code: cat.code,
            description: cat.description,
            isActive: true,
          })),
        });

        categories = await tx.workerCategory.findMany({
          where: { tenantId },
          orderBy: { name: 'asc' },
        });
      }

      return categories.map((c) => ({
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        code: c.code,
        description: c.description,
        isActive: c.isActive,
        createdAt: c.createdAt,
      }));
    });
  }

  /**
   * Creates a custom category for the tenant.
   */
  async createCategory(
    tenantId: string,
    dto: CreateWorkerCategoryDto,
    userId: string,
  ): Promise<WorkerCategoryInfo> {
    const code = dto.code.trim().toUpperCase();

    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.workerCategory.findUnique({
        where: {
          tenantId_code: { tenantId, code },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Worker category with code '${code}' already exists in this organization.`,
        );
      }

      const category = await tx.workerCategory.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          code,
          description: dto.description?.trim() || null,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_CATEGORY_CREATE',
          entity: 'WorkerCategory',
          entityId: category.id,
          details: { name: category.name, code: category.code },
        },
      });

      logger.info(
        { tenantId, categoryId: category.id, code },
        `New worker category created: ${category.name} (${code})`,
      );

      return {
        id: category.id,
        tenantId: category.tenantId,
        name: category.name,
        code: category.code,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
      };
    });
  }

  /**
   * Updates category details.
   */
  async updateCategory(
    tenantId: string,
    categoryId: string,
    dto: UpdateWorkerCategoryDto,
    userId: string,
  ): Promise<WorkerCategoryInfo> {
    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.workerCategory.findFirst({
        where: { id: categoryId, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(`Worker category '${categoryId}' not found.`);
      }

      const updated = await tx.workerCategory.update({
        where: { id: categoryId },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WORKER_CATEGORY_UPDATE',
          entity: 'WorkerCategory',
          entityId: categoryId,
          details: { ...dto } as any,
        },
      });

      return {
        id: updated.id,
        tenantId: updated.tenantId,
        name: updated.name,
        code: updated.code,
        description: updated.description,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
      };
    });
  }
}
