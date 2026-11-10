import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole, TenantType } from '@handloom/types';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    user: {
      id: 'user-uuid-1',
      email: 'admin@kanchiweavers.org',
      firstName: 'Arun',
      lastName: 'Kumar',
      role: UserRole.SOCIETY_ADMIN,
      tenantId: 'tenant-uuid-1',
      tenantName: 'Kanchipuram Silk Co-op',
      tenantCode: 'KANCHI-01',
    },
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    },
  };

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
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a new society and return auth response', async () => {
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

    const result = await controller.registerSociety(dto, req);
    expect(result).toEqual(mockAuthResponse);
    expect(service.registerSociety).toHaveBeenCalledWith(dto, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
  });

  it('should authenticate user via login', async () => {
    const dto = {
      email: 'admin@kanchiweavers.org',
      password: 'Password@123',
    };
    const req = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('Jest') } as any;

    const result = await controller.login(dto, req);
    expect(result).toEqual(mockAuthResponse);
    expect(service.login).toHaveBeenCalledWith(dto, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
  });

  it('should rotate token via refresh', async () => {
    const dto = { refreshToken: 'valid-token' };
    const req = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('Jest') } as any;

    const result = await controller.refresh(dto, req);
    expect(result).toEqual(mockAuthResponse);
    expect(service.refresh).toHaveBeenCalledWith(dto.refreshToken, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });
  });

  it('should return current user profile', async () => {
    const result = await controller.getMe(mockAuthResponse.user);
    expect(result).toEqual(mockAuthResponse.user);
    expect(service.getMe).toHaveBeenCalledWith(mockAuthResponse.user.id);
  });
});
