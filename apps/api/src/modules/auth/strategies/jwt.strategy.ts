import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AppConfigService } from '../../../config/app-config.service';
import { prisma, withTenantContext } from '@handloom/database';
import {
  AuthenticatedUser,
  JwtPayload,
  MembershipStatus,
  UserRole,
  UserStatus,
} from '@handloom/types';
import { getPermissionsForRole } from '../../../common/permissions/permission-catalog';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.['access_token'] || null,
      ]),
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
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    // Resolve tenant membership within RLS tenant context
    // After fail-closed RLS remediation, direct queries without context return zero rows.
    // withTenantContext sets app.current_tenant_id so RLS permits the lookup.
    const membership = await withTenantContext(payload.tenantId, async (tx) => {
      return tx.tenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: payload.tenantId,
          },
        },
        include: { tenant: true },
      });
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new UnauthorizedException('Active membership not found for this tenant');
    }

    if (membership.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant society account is inactive');
    }

    const permissions = getPermissionsForRole(membership.role as UserRole);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: membership.role as UserRole,
      tenantId: membership.tenant.id,
      tenantName: membership.tenant.name,
      tenantCode: membership.tenant.code,
      permissions,
    };
  }
}
