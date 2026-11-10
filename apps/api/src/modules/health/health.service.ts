import { Injectable } from '@nestjs/common';
import { HealthCheckResponse } from '@handloom/types';
import { prisma } from '@handloom/database';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly config: AppConfigService) {}

  async getHealth(): Promise<HealthCheckResponse> {
    let dbStatus: 'connected' | 'disconnected' | 'unconfigured' = 'unconfigured';

    if (this.config.databaseUrl) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch {
        dbStatus = 'disconnected';
      }
    }

    return {
      status: dbStatus === 'disconnected' ? 'degraded' : 'healthy',
      version: '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: this.config.redisUrl ? 'connected' : 'unconfigured',
      },
    };
  }
}
