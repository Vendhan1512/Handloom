import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole, TenantType, Permission } from '@handloom/types';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    user: {
      id: 'user-uuid-1',
      email: 'admin@kanchiweavers.org',
      firstName: 'Arun',
      lastName: 'Kumar',
      role: UserRole.OWNER,
      tenantId: 'tenant-uuid-1',
      tenantName: 'Kanchipuram Silk Co-op',
      tenantCode: 'KANCHI-01',
      permissions: [Permission.TENANT_READ, Permission.USERS_READ],
    },
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    },
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerSociety: jest.fn().mockResolvedValue(mockAuthResponse),
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            refresh: jest.fn().mockResolvedValue(mockAuthResponse),
            logout: jest.fn().mockResolvedValue(undefined),
            getMe: jest.fn().mockResolvedValue(mockAuthResponse.user),
            selectTenant: jest.fn().mockResolvedValue(mockAuthResponse),
            listSessions: jest.fn().mockResolvedValue([]),
            revokeSession: jest.fn().mockResolvedValue(undefined),
            changePassword: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a new society, return auth response and set cookies', async () => {
    const dto = {
      societyName: 'Kanchipuram Silk Co-op',
      societyCode: 'KANCHI-01',
      societyType: TenantType.COOPERATIVE,
      adminEmail: 'admin@kanchiweavers.org',
      adminPassword: 'Password@123',
      adminFirstName: 'Arun',
      adminLastName: 'Kumar',
    };
    const req = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('Jest') } as any;

    const result = await controller.registerSociety(dto, req, mockRes);
    expect(result).toEqual(mockAuthResponse);
    expect(service.registerSociety).toHaveBeenCalledWith(dto, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
  });

  it('should authenticate user via login and set cookies', async () => {
    const dto = {
      email: 'admin@kanchiweavers.org',
      password: 'Password@123',
    };
    const req = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('Jest') } as any;

    const result = await controller.login(dto, req, mockRes);
    expect(result).toEqual(mockAuthResponse);
    expect(service.login).toHaveBeenCalledWith(dto, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
  });

  it('should rotate token via refresh and set cookies', async () => {
    const dto = { refreshToken: 'valid-token' };
    const req = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Jest'),
      cookies: {},
    } as any;

    const result = await controller.refresh(dto, req, mockRes);
    expect(result).toEqual(mockAuthResponse);
    expect(service.refresh).toHaveBeenCalledWith(dto.refreshToken, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
  });

  it('should logout and clear cookies', async () => {
    const user = mockAuthResponse.user;
    const req = { cookies: { refresh_token: 'valid-token' } } as any;

    const result = await controller.logout(user, {}, req, mockRes);
    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(service.logout).toHaveBeenCalledWith(user.id, 'valid-token');
    expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('should return current user profile on getMe', async () => {
    const user = mockAuthResponse.user;
    const result = await controller.getMe(user);
    expect(result).toEqual(mockAuthResponse.user);
    expect(service.getMe).toHaveBeenCalledWith(user.id, user.tenantId);
  });

  it('should switch tenant and set new cookies on selectTenant', async () => {
    const user = mockAuthResponse.user;
    const req = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('Jest') } as any;

    const result = await controller.selectTenant(
      user,
      { tenantId: 'tenant-uuid-2' },
      req,
      mockRes,
    );
    expect(result).toEqual(mockAuthResponse);
    expect(service.selectTenant).toHaveBeenCalledWith(user.id, 'tenant-uuid-2', {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
  });
});
