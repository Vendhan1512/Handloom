import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { TenantType } from '@handloom/types';

export class RegisterSocietyDto {
  @ApiProperty({
    example: 'Kanchipuram Silk Weavers Co-operative',
    description: 'Legal registered name of the handloom society, cluster, or mill',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  societyName!: string;

  @ApiProperty({
    example: 'KANCHI-01',
    description: 'Unique alphanumeric code identifying the society across the platform',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_-]{3,20}$/, {
    message:
      'Society code must be uppercase alphanumeric (letters, numbers, hyphens, underscores) between 3 and 20 characters',
  })
  societyCode!: string;

  @ApiPropertyOptional({
    enum: TenantType,
    default: TenantType.COOPERATIVE,
    description: 'Type of production facility',
  })
  @IsEnum(TenantType)
  @IsOptional()
  societyType?: TenantType = TenantType.COOPERATIVE;

  @ApiProperty({
    example: 'admin@kanchiweavers.org',
    description: 'Email address of the initial root society administrator',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;

  @ApiProperty({
    example: 'SecurePass#2026',
    description: 'Administrator initial password (minimum 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  adminPassword!: string;

  @ApiProperty({ example: 'Arun', description: 'Administrator first name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  adminFirstName!: string;

  @ApiProperty({ example: 'Kumar', description: 'Administrator last name' })
  @IsString()
  @IsNotEmpty()
  adminLastName!: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Society primary contact phone',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '12 Weaver Street, Kanchipuram, Tamil Nadu 631501',
    description: 'Registered physical address',
  })
  @IsString()
  @IsOptional()
  address?: string;
}
