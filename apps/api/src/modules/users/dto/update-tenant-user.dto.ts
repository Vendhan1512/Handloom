import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@handloom/types';

export class UpdateTenantUserDto {
  @ApiPropertyOptional({ example: 'Murugan' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'S' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+91 98402 34567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
