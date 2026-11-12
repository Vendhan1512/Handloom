import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SkillProficiency } from '@handloom/types';

export class WorkerSkillInputDto {
  @ApiProperty({ description: 'Category UUID representing the skill (e.g., Weaving, Dyeing)' })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ enum: SkillProficiency, default: SkillProficiency.INTERMEDIATE })
  @IsEnum(SkillProficiency)
  @IsOptional()
  proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYears: number = 0;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isPrimary: boolean = false;
}

export class CreateWorkerDto {
  @ApiProperty({ example: 'WRK-001', description: 'Unique operational worker code within tenant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  workerCode!: string;

  @ApiProperty({ example: 'K. Subramanian' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

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

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00.000Z' })
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 'PIECE_RATE', description: 'PIECE_RATE, DAILY_WAGE, or MONTHLY_SALARY' })
  @IsString()
  @IsOptional()
  paymentArrangement?: string;

  @ApiPropertyOptional({ example: 'Wife: Valli (+91 98403 11111)' })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Specialized in 3-ply traditional Kanchi border weaving.' })
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
