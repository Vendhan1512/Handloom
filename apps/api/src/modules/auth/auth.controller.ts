import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService, RequestMetadata } from './auth.service';
import { RegisterSocietyDto } from './dto/register-society.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser, AuthResponseData } from '@handloom/types';

@ApiTags('Authentication & Tenant Management')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-society')
  @ApiOperation({
    summary: 'Onboard new handloom cooperative society with initial root admin',
  })
  @SwaggerResponse({
    status: 201,
    description: 'Society and administrator successfully registered',
  })
  async registerSociety(
    @Body() dto: RegisterSocietyDto,
    @Req() req: Request,
  ): Promise<AuthResponseData> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    return this.authService.registerSociety(dto, meta);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue JWT token pair' })
  @SwaggerResponse({
    status: 200,
    description: 'Authentication successful',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseData> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    return this.authService.login(dto, meta);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and issue new cryptographic token pair',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Token successfully rotated',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthResponseData> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    return this.authService.refresh(dto.refreshToken, meta);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke current user authentication session' })
  @SwaggerResponse({
    status: 200,
    description: 'Session successfully revoked',
  })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Partial<RefreshTokenDto>,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id, body.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Retrieve authenticated user profile and active tenant context',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Current user profile details',
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    return this.authService.getMe(user.id);
  }
}
