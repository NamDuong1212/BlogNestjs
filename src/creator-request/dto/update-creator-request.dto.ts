import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateCreatorStatusDto {
  @ApiProperty({
    description: 'New creator status',
    example: false
  })
  @IsBoolean()
  isCreator: boolean;

  @ApiProperty({
    description: 'Reason for status change (required when revoking creator status)',
    example: 'Violation of community guidelines',
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;
}