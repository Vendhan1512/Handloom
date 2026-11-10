import { Injectable } from '@nestjs/common';
import { HealthCheckResponse } from '@handloom/types';
import { prisma } from '@handloom/database';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  async getHealth(): Promise<HealthCheckResponse> {
    let dbStatus: 'connected' | 'disconnected' | 'unconfigured' = 'unconfigured';

    if (process.env['DATABASE_URL']) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch {
        dbStatus = 'disconnected';
      }
    }

    return {
      status: dbStatus === 'disconnected' ? 'degraded' : 'healthy',
      version: process.env['npm_package_version'] || '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: process.env['REDIS_URL'] ? 'connected' : 'unconfigured',
      },
    };
  }
}

