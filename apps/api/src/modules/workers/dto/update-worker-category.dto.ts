import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkerCategoryDto {
  @ApiPropertyOptional({ example: 'Jacquard Weaving' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: 'Operates complex jacquard harnesses and card punches' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
