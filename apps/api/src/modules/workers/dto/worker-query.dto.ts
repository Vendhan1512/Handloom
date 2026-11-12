import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { WorkerStatus } from '@handloom/types';

export class WorkerQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Filter by search query matching name, code, phone, or village' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: WorkerStatus })
  @IsEnum(WorkerStatus)
  @IsOptional()
  status?: WorkerStatus;

  @ApiPropertyOptional({ description: 'Filter by skill category UUID' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;
}
