import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AppConfigModule, HealthModule, AuthModule],
})
export class AppModule {}
