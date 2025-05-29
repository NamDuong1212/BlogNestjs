import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeletePostDto {
  @ApiProperty({
    description: 'Reason for deleting the post',
    example: 'Post violates community guidelines'
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}