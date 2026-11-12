import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, OrganizationProfile, Permission } from '@handloom/types';

@ApiTags('Organization & Cooperative Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @RequirePermissions(Permission.TENANT_READ)
  @ApiOperation({
    summary: 'Retrieve authenticated organization profile and metadata',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Organization profile details',
  })
  async getOrganization(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationProfile> {
    return this.organizationService.getOrganization(user.tenantId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.TENANT_UPDATE)
  @ApiOperation({
    summary: 'Update organization profile and configuration within tenant context',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Organization successfully updated',
  })
  async updateOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationProfile> {
    return this.organizationService.updateOrganization(
      user.tenantId,
      dto,
      user.id,
    );
  }
}
