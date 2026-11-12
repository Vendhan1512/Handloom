import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@handloom/types';
import { PERMISSIONS_KEY } from '../../../common/decorators/require-permissions.decorator';
import { hasAllPermissions } from '../../../common/permissions/permission-catalog';
import { logger } from '@handloom/logger';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no specific permissions are annotated on the handler or controller, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: Unauthenticated identity context');
    }

    const userPermissions = user.permissions || [];
    const isAuthorized = hasAllPermissions(userPermissions, requiredPermissions);

    if (!isAuthorized) {
      logger.warn(
        {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role,
          requiredPermissions,
        },
        '[RBAC] Permission denied: insufficient privileges',
      );
      throw new ForbiddenException(
        'Access denied: You do not have the required permissions to perform this operation',
      );
    }

    return true;
  }
}
