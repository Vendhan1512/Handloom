import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResponse } from '@handloom/types';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Backend and infrastructure health verification' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Service is healthy or degraded',
  })
  async check(): Promise<HealthCheckResponse> {
    return this.healthService.getHealth();
  }
}
