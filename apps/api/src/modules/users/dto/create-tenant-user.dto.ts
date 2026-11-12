import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@handloom/types';

export class CreateTenantUserDto {
  @ApiProperty({ example: 'supervisor@kanchiweavers.org' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Murugan' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'S' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: '+91 98402 34567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SUPERVISOR })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @ApiPropertyOptional({
    example: 'TempPassword#2026',
    description: 'Initial password for new account (minimum 8 characters)',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  initialPassword?: string;
}
