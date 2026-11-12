import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { UserManagementService, UserSummary } from './user-management.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, PaginatedResult, Permission } from '@handloom/types';

@ApiTags('User & Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserManagementController {
  constructor(private readonly userService: UserManagementService) {}

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'List organization users with pagination and search' })
  @SwaggerResponse({ status: 200, description: 'Paginated list of organization users' })
  async listUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UserQueryDto,
  ): Promise<PaginatedResult<UserSummary>> {
    return this.userService.listUsers(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'Retrieve specific organization user details' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @SwaggerResponse({ status: 200, description: 'User details' })
  async getUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<UserSummary> {
    return this.userService.getUser(user.tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.USERS_INVITE, Permission.ROLES_ASSIGN)
  @ApiOperation({ summary: 'Register or invite new staff member to organization' })
  @SwaggerResponse({ status: 201, description: 'User successfully registered' })
  async createUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTenantUserDto,
  ): Promise<UserSummary> {
    return this.userService.createUser(
      user.tenantId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.USERS_UPDATE)
  @ApiOperation({ summary: 'Update user profile details or assigned role' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @SwaggerResponse({ status: 200, description: 'User successfully updated' })
  async updateUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTenantUserDto,
  ): Promise<UserSummary> {
    return this.userService.updateUser(
      user.tenantId,
      id,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.USERS_DEACTIVATE)
  @ApiOperation({ summary: 'Activate, suspend, or deactivate user membership' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @SwaggerResponse({ status: 200, description: 'User status successfully updated' })
  async updateUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserSummary> {
    return this.userService.updateUserStatus(
      user.tenantId,
      id,
      dto,
      user.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.USERS_DEACTIVATE)
  @ApiOperation({ summary: 'Remove user membership from organization' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @SwaggerResponse({ status: 200, description: 'User membership successfully removed' })
  async removeUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.userService.removeUser(user.tenantId, id, user.id);
    return { message: 'User membership successfully removed from organization.' };
  }
}
