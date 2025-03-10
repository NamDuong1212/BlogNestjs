import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({
    description: 'The name of the category.',
    example: 'Technology',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'A brief description of the category.',
    example: 'Updated category for all tech-related posts.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The ID of the parent category.',
    example: '123',
    required: false,
  })
  parentId?: string;
}
