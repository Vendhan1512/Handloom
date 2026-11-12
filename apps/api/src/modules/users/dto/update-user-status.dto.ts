import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { MembershipStatus } from '@handloom/types';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: MembershipStatus, example: MembershipStatus.SUSPENDED })
  @IsEnum(MembershipStatus)
  @IsNotEmpty()
  status!: MembershipStatus;
}
