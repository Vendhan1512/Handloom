import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssignmentStatus } from '@handloom/types';

export class UpdateWorkerAssignmentDto {
  @ApiPropertyOptional({ enum: AssignmentStatus, example: AssignmentStatus.IN_PROGRESS })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({ example: '2026-11-25T18:00:00.000Z' })
  @IsOptional()
  expectedCompletionDate?: string;

  @ApiPropertyOptional({ example: 'Updated instructions for double warp tie-up.' })
  @IsString()
  @IsOptional()
  instructions?: string;
}
