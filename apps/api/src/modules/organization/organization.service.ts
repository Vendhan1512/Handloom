import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { withTenantContext } from '@handloom/database';
import { OrganizationProfile, TenantStatus, TenantType } from '@handloom/types';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { logger } from '@handloom/logger';

@Injectable()
export class OrganizationService {
  /**
   * Retrieves organization details within trusted tenant context.
   */
  async getOrganization(tenantId: string): Promise<OrganizationProfile> {
    return withTenantContext(tenantId, async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          _count: {
            select: {
              memberships: true,
              workers: true,
              workerCategories: true,
              workerAssignments: true,
            },
          },
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Organization '${tenantId}' not found.`);
      }

      return {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        slug: tenant.slug,
        type: tenant.type as TenantType,
        status: tenant.status as TenantStatus,
        contactPerson: tenant.contactPerson,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        address: tenant.address,
        district: tenant.district,
        state: tenant.state,
        pinCode: tenant.pinCode,
        settings: tenant.settings as Record<string, unknown> | null,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        memberCount: tenant._count?.memberships || 0,
        workerCount: tenant._count?.workers || 0,
      };
    });
  }

  /**
   * Updates organization profile fields within tenant context and logs audit trail.
   */
  async updateOrganization(
    tenantId: string,
    dto: UpdateOrganizationDto,
    userId: string,
  ): Promise<OrganizationProfile> {
    return withTenantContext(tenantId, async (tx) => {
      const existing = await tx.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!existing) {
        throw new NotFoundException(`Organization '${tenantId}' not found.`);
      }

      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await tx.tenant.findUnique({
          where: { slug: dto.slug },
        });
        if (slugExists) {
          throw new ConflictException(
            `Organization slug '${dto.slug}' is already taken by another entity.`,
          );
        }
      }

      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.slug !== undefined && { slug: dto.slug ? dto.slug.trim() : null }),
          ...(dto.type && { type: dto.type }),
          ...(dto.contactPerson !== undefined && { contactPerson: dto.contactPerson?.trim() || null }),
          ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail?.trim().toLowerCase() || null }),
          ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone?.trim() || null }),
          ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
          ...(dto.district !== undefined && { district: dto.district?.trim() || null }),
          ...(dto.state !== undefined && { state: dto.state?.trim() || null }),
          ...(dto.pinCode !== undefined && { pinCode: dto.pinCode?.trim() || null }),
          ...(dto.settings && { settings: dto.settings as any }),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'TENANT_UPDATE',
          entity: 'Tenant',
          entityId: tenantId,
          details: { updatedFields: Object.keys(dto) },
        },
      });

      logger.info(
        { tenantId, userId },
        `Organization profile updated for '${updated.name}' (${updated.code})`,
      );

      return {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        slug: updated.slug,
        type: updated.type as TenantType,
        status: updated.status as TenantStatus,
        contactPerson: updated.contactPerson,
        contactEmail: updated.contactEmail,
        contactPhone: updated.contactPhone,
        address: updated.address,
        district: updated.district,
        state: updated.state,
        pinCode: updated.pinCode,
        settings: updated.settings as Record<string, unknown> | null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    });
  }
}
