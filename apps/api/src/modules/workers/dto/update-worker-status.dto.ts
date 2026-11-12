import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkerStatus } from '@handloom/types';

export class UpdateWorkerStatusDto {
  @ApiProperty({ enum: WorkerStatus, example: WorkerStatus.ON_LEAVE })
  @IsEnum(WorkerStatus)
  @IsNotEmpty()
  status!: WorkerStatus;
}
