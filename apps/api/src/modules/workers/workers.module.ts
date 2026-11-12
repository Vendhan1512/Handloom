import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { WorkerCategoriesController } from './worker-categories.controller';
import { WorkerCategoriesService } from './worker-categories.service';
import { WorkerAssignmentsController } from './worker-assignments.controller';
import { WorkerAssignmentsService } from './worker-assignments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    WorkersController,
    WorkerCategoriesController,
    WorkerAssignmentsController,
  ],
  providers: [
    WorkersService,
    WorkerCategoriesService,
    WorkerAssignmentsService,
  ],
  exports: [
    WorkersService,
    WorkerCategoriesService,
    WorkerAssignmentsService,
  ],
})
export class WorkersModule {}
