import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { CreatorRequestStatus } from '../creator-request.entity';

export class ReviewCreatorRequestDto {
  @ApiProperty({
    description: 'Decision on the creator request',
    enum: [CreatorRequestStatus.APPROVED, CreatorRequestStatus.REJECTED],
    example: CreatorRequestStatus.APPROVED
  })
  @IsNotEmpty()
  @IsEnum([CreatorRequestStatus.APPROVED, CreatorRequestStatus.REJECTED])
  status: CreatorRequestStatus;

  @ApiProperty({
    description: 'Admin note for the decision',
    example: 'Your request has been approved. Welcome to creators!',
    required: false
  })
  @IsOptional()
  @IsString()
  adminNote?: string;
}