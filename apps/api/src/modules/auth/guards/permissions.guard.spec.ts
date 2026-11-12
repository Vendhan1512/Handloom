import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission, UserRole } from '@handloom/types';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockExecutionContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no permissions are required by handler or class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.USERS_READ]);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user has all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.ORDERS_READ, Permission.ORDERS_CREATE]);

    const context = createMockExecutionContext({
      id: 'user-1',
      role: UserRole.ADMIN,
      permissions: [
        Permission.ORDERS_READ,
        Permission.ORDERS_CREATE,
        Permission.INVENTORY_READ,
      ],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user is missing one of the required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.ORDERS_READ, Permission.WAGES_APPROVE]);

    const context = createMockExecutionContext({
      id: 'user-2',
      role: UserRole.OFFICE_STAFF,
      permissions: [Permission.ORDERS_READ, Permission.INVENTORY_READ],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when user has empty permissions array', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.TENANT_UPDATE]);

    const context = createMockExecutionContext({
      id: 'user-3',
      role: UserRole.WEAVER,
      permissions: [],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
