import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkerCategoryDto {
  @ApiProperty({ example: 'Weaving', description: 'Name of the operational skill category' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 'WEAVING', description: 'Unique category business code within tenant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;

  @ApiPropertyOptional({ example: 'Operating traditional pit looms or frame looms for silk production' })
  @IsString()
  @IsOptional()
  description?: string;
}
