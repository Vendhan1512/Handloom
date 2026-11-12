import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkerAssignmentDto {
  @ApiProperty({ description: 'Worker UUID to assign task to' })
  @IsUUID('4')
  @IsNotEmpty()
  workerId!: string;

  @ApiProperty({ description: 'Category UUID for the assigned work' })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ example: '2026-11-15T09:00:00.000Z' })
  @IsOptional()
  assignmentDate?: string;

  @ApiPropertyOptional({ example: '2026-11-20T18:00:00.000Z' })
  @IsOptional()
  expectedCompletionDate?: string;

  @ApiPropertyOptional({ example: 'Complete 3 saree pieces on Loom #4; verify zari tension carefully.' })
  @IsString()
  @IsOptional()
  instructions?: string;
}
