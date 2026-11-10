import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/app-config.service';
import { prisma } from '@handloom/database';
import {
  AuthenticatedUser,
  JwtPayload,
  UserRole,
  UserStatus,
} from '@handloom/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    if (user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant society account is inactive');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantCode: user.tenant.code,
    };
  }
}
