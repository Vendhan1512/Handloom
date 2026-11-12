import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WorkerCategoriesService } from './worker-categories.service';
import { CreateWorkerCategoryDto } from './dto/create-worker-category.dto';
import { UpdateWorkerCategoryDto } from './dto/update-worker-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, Permission, WorkerCategoryInfo } from '@handloom/types';

@ApiTags('Worker Skill Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('worker-categories')
export class WorkerCategoriesController {
  constructor(private readonly categoriesService: WorkerCategoriesService) {}

  @Get()
  @RequirePermissions(Permission.WORKERS_READ)
  @ApiOperation({ summary: 'List all operational worker skill categories' })
  @SwaggerResponse({ status: 200, description: 'List of worker skill categories' })
  async listCategories(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkerCategoryInfo[]> {
    return this.categoriesService.listCategories(user.tenantId);
  }

  @Post()
  @RequirePermissions(Permission.WORKERS_CREATE)
  @ApiOperation({ summary: 'Create a custom worker skill category' })
  @SwaggerResponse({ status: 201, description: 'Worker category successfully created' })
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkerCategoryDto,
  ): Promise<WorkerCategoryInfo> {
    return this.categoriesService.createCategory(user.tenantId, dto, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.WORKERS_UPDATE)
  @ApiOperation({ summary: 'Update a worker skill category' })
  @ApiParam({ name: 'id', description: 'Worker Category UUID' })
  @SwaggerResponse({ status: 200, description: 'Worker category successfully updated' })
  async updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkerCategoryDto,
  ): Promise<WorkerCategoryInfo> {
    return this.categoriesService.updateCategory(
      user.tenantId,
      id,
      dto,
      user.id,
    );
  }
}
