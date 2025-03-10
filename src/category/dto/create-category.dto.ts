import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The name of the category.',
    example: 'Technology',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'A brief description of the category.',
    example: 'Category for all tech-related posts.',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The ID of the parent category.',
    example: '123',
    required: false,
  })
  parentId?: string;
}
