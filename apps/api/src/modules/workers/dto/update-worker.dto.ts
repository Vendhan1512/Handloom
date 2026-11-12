import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { WorkerSkillInputDto } from './create-worker.dto';

export class UpdateWorkerDto {
  @ApiPropertyOptional({ example: 'K. Subramanian' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '+91 98403 45678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '+91 98403 99999' })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiPropertyOptional({ example: '45 South Mada Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Pillayarpalayam' })
  @IsString()
  @IsOptional()
  village?: string;

  @ApiPropertyOptional({ example: 'Kanchipuram' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Tamil Nadu' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '631502' })
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional({ example: 'PIECE_RATE' })
  @IsString()
  @IsOptional()
  paymentArrangement?: string;

  @ApiPropertyOptional({ example: 'Wife: Valli (+91 98403 11111)' })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Updated skills in jacquard loom conversion.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [WorkerSkillInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerSkillInputDto)
  @IsOptional()
  skills?: WorkerSkillInputDto[];
}
