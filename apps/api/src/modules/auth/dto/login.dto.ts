import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@kanchiweavers.org',
    description: 'Registered user email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePass#2026', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    example: 'KANCHI-01',
    description:
      'Optional unique society code to disambiguate if user belongs to multiple societies',
  })
  @IsString()
  @IsOptional()
  societyCode?: string;
}
