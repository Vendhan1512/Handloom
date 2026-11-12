import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService, RequestMetadata } from './auth.service';
import { RegisterSocietyDto } from './dto/register-society.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  AuthResponseData,
  AuthTokens,
  SessionInfo,
  TenantMembershipInfo,
} from '@handloom/types';

@ApiTags('Authentication & Identity Management')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-society')
  @ApiOperation({
    summary: 'Onboard new handloom cooperative society with initial root owner',
  })
  @SwaggerResponse({
    status: 201,
    description: 'Society and owner administrator successfully registered',
  })
  async registerSociety(
    @Body() dto: RegisterSocietyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    const result = await this.authService.registerSociety(dto, meta);
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user via credentials and issue rotated tokens',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Authentication successful with active tenant context',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    const result = await this.authService.login(dto, meta);
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and issue new cryptographic token pair',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Token successfully rotated with reuse protection',
  })
  async refresh(
    @Body() dto: Partial<RefreshTokenDto>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const token = dto.refreshToken || (req.cookies && req.cookies['refresh_token']);
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    const result = await this.authService.refresh(token, meta);
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active authentication session' })
  @SwaggerResponse({
    status: 200,
    description: 'Session successfully revoked',
  })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Partial<RefreshTokenDto>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = body.refreshToken || (req.cookies && req.cookies['refresh_token']);
    await this.authService.logout(user.id, token);
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Retrieve authenticated user identity, active tenant, and permissions',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Current user profile with active permissions',
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    return this.authService.getMe(user.id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('memberships')
  @ApiOperation({
    summary: 'List all tenant memberships and roles accessible by the user',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Array of tenant memberships',
  })
  async getMemberships(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantMembershipInfo[]> {
    const profile = await this.authService.getMe(user.id, user.tenantId);
    return profile.memberships || [];
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('select-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Switch active tenant context and issue re-scoped access token',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Successfully switched active tenant context',
  })
  async selectTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectTenantDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    const result = await this.authService.selectTenant(user.id, dto.tenantId, meta);
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({
    summary: 'List active sessions for the authenticated user',
  })
  @SwaggerResponse({
    status: 200,
    description: 'List of active sessions',
  })
  async listSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<SessionInfo[]> {
    const token = req.cookies && req.cookies['refresh_token'];
    return this.authService.listSessions(user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiParam({ name: 'id', description: 'Session UUID to revoke' })
  @SwaggerResponse({
    status: 200,
    description: 'Session successfully revoked',
  })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
  ): Promise<{ message: string }> {
    await this.authService.revokeSession(user.id, sessionId);
    return { message: 'Session successfully revoked' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change account password and revoke other active sessions',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const meta: RequestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    await this.authService.changePassword(user.id, dto, meta);
    this.clearAuthCookies(res);
    return { message: 'Password changed successfully. Please log in again.' };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }
}
