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
  ApiQuery,
} from '@nestjs/swagger';
import {
  WorkerAssignmentsService,
  AssignmentQueryDto,
} from './worker-assignments.service';
import { CreateWorkerAssignmentDto } from './dto/create-worker-assignment.dto';
import { UpdateWorkerAssignmentDto } from './dto/update-worker-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AssignmentStatus,
  AuthenticatedUser,
  PaginatedResult,
  Permission,
  WorkerAssignmentInfo,
} from '@handloom/types';

@ApiTags('Worker Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('worker-assignments')
export class WorkerAssignmentsController {
  constructor(private readonly assignmentsService: WorkerAssignmentsService) {}

  @Get()
  @RequirePermissions(Permission.WORKERS_READ)
  @ApiOperation({ summary: 'List worker assignments with pagination and worker/status filters' })
  @ApiQuery({ name: 'workerId', required: false })
  @ApiQuery({ name: 'status', enum: AssignmentStatus, required: false })
  @SwaggerResponse({ status: 200, description: 'Paginated list of assignments' })
  async listAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AssignmentQueryDto,
  ): Promise<PaginatedResult<WorkerAssignmentInfo>> {
    return this.assignmentsService.listAssignments(user.tenantId, query);
  }

  @Post()
  @RequirePermissions(Permission.WORKERS_ASSIGN)
  @ApiOperation({
    summary: 'Allocate a work assignment to an artisan (does not imply completion, issue or payment)',
  })
  @SwaggerResponse({ status: 201, description: 'Assignment successfully created' })
  async createAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkerAssignmentDto,
  ): Promise<WorkerAssignmentInfo> {
    return this.assignmentsService.createAssignment(user.tenantId, dto, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.WORKERS_ASSIGN)
  @ApiOperation({ summary: 'Update assignment status or instructions' })
  @ApiParam({ name: 'id', description: 'Worker Assignment UUID' })
  @SwaggerResponse({ status: 200, description: 'Assignment successfully updated' })
  async updateAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkerAssignmentDto,
  ): Promise<WorkerAssignmentInfo> {
    return this.assignmentsService.updateAssignment(
      user.tenantId,
      id,
      dto,
      user.id,
    );
  }
}
