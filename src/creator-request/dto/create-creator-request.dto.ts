import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCreatorRequestDto {
  @ApiProperty({
    description: 'Reason why user wants to become a creator',
    example: 'I want to share my cooking recipes and tutorials with the community.'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(20, { message: 'Reason must be at least 20 characters long' })
  reason: string;
}