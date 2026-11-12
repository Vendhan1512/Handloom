import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TenantType } from '@handloom/types';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Kanchipuram Master Weaver Co-operative' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'kanchi-master-weavers' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ enum: TenantType, example: TenantType.COOPERATIVE })
  @IsEnum(TenantType)
  @IsOptional()
  type?: TenantType;

  @ApiPropertyOptional({ example: 'S. Ramanathan' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'contact@kanchiweavers.org' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+91 98401 23456' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: '12 Weaver Colony, Gandhi Road' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Kanchipuram' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Tamil Nadu' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '631501' })
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional({ description: 'Custom tenant-specific settings in JSON format' })
  @IsOptional()
  settings?: Record<string, unknown>;
}
