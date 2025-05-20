import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { ArrayMaxSize, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiProperty({
    description: 'The title of the post.',
    example: 'Updated title for the post.',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'The content of the post.',
    example: 'Updated content for the post...',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'List of category IDs the post belongs to.',
    example: ['1', '3'],
    required: false,
  })
  categoryIds?: string[];

  @ApiProperty({
    description: 'Array of image URLs for the post (max 10)',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'A post can have a maximum of 10 images' })
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Array of tag names for the post',
    example: ['programming', 'nestjs', 'typescript'],
    required: false,
    type: [String],
  })
  tags?: string[];

  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
}