import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { UpdateWorkerStatusDto } from './dto/update-worker-status.dto';
import { WorkerQueryDto } from './dto/worker-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, PaginatedResult, Permission, WorkerInfo } from '@handloom/types';

@ApiTags('Worker & Artisan Directory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @RequirePermissions(Permission.WORKERS_READ)
  @ApiOperation({ summary: 'List organization workers with pagination, search, and category filters' })
  @SwaggerResponse({ status: 200, description: 'Paginated list of workers' })
  async listWorkers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WorkerQueryDto,
  ): Promise<PaginatedResult<WorkerInfo>> {
    return this.workersService.listWorkers(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.WORKERS_READ)
  @ApiOperation({ summary: 'Retrieve specific worker details and skills' })
  @ApiParam({ name: 'id', description: 'Worker UUID' })
  @SwaggerResponse({ status: 200, description: 'Worker profile and skills' })
  async getWorker(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<WorkerInfo> {
    return this.workersService.getWorker(user.tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.WORKERS_CREATE)
  @ApiOperation({ summary: 'Register an operational worker (independent of login accounts)' })
  @SwaggerResponse({ status: 201, description: 'Worker successfully registered' })
  async createWorker(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkerDto,
  ): Promise<WorkerInfo> {
    return this.workersService.createWorker(user.tenantId, dto, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.WORKERS_UPDATE)
  @ApiOperation({ summary: 'Update worker profile details and skill proficiencies' })
  @ApiParam({ name: 'id', description: 'Worker UUID' })
  @SwaggerResponse({ status: 200, description: 'Worker successfully updated' })
  async updateWorker(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkerDto,
  ): Promise<WorkerInfo> {
    return this.workersService.updateWorker(user.tenantId, id, dto, user.id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.WORKERS_UPDATE)
  @ApiOperation({ summary: 'Update worker status (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)' })
  @ApiParam({ name: 'id', description: 'Worker UUID' })
  @SwaggerResponse({ status: 200, description: 'Worker status successfully updated' })
  async updateWorkerStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkerStatusDto,
  ): Promise<WorkerInfo> {
    return this.workersService.updateWorkerStatus(
      user.tenantId,
      id,
      dto.status,
      user.id,
    );
  }
}
