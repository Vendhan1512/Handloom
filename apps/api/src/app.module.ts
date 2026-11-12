import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UserManagementModule } from './modules/users/user-management.module';
import { WorkersModule } from './modules/workers/workers.module';

@Module({
  imports: [
    AppConfigModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    UserManagementModule,
    WorkersModule,
  ],
})
export class AppModule {}
