import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The name of the tag.',
    example: 'Technology',
  })
  name: string;
}
