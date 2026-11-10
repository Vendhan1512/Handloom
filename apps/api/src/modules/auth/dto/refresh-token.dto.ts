import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Cryptographic refresh token issued during login/registration',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
