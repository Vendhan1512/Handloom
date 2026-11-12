import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SelectTenantDto {
  @ApiProperty({
    description: 'Unique identifier of the target tenant to activate',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4', { message: 'tenantId must be a valid UUID' })
  @IsNotEmpty()
  tenantId!: string;
}
