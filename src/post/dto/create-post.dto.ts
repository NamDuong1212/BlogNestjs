import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'The title of the post.',
    example: 'How to learn NestJS',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The content of the post.',
    example: 'This post will cover how to get started with NestJS...',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'List of category IDs the post belongs to.',
    example: ['1', '2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @ApiProperty({
    description: 'Array of tag names for the post',
    example: ['programming', 'nestjs', 'typescript'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Category ID level 1',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  categoryId1: string;

  @ApiProperty({
    description: 'Category ID level 2',
    example: '2',
  })
  @IsNotEmpty()
  @IsString()
  categoryId2: string;

  @ApiProperty({
    description: 'Category ID level 3',
    example: '3',
  })
  @IsNotEmpty()
  @IsString()
  categoryId3: string;

  @ApiProperty({
    description: 'Category ID level 4',
    example: '4',
  })
  @IsNotEmpty()
  @IsString()
  categoryId4: string;
}
