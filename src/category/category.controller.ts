import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiKeyGuard } from 'src/auth/guard/api-key.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiTags('Category')
  @ApiBearerAuth('')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'All categories',
    type: CreateCategoryDto,
  })
  @Get('/getAll')
  async getAllCategory() {
    const category = await this.categoryService.getAllCategories();
    return { message: 'All categories', data: category };
  }

  @ApiTags('Category')
  @ApiBearerAuth('')
  @ApiOperation({ summary: 'Get a single category by id' })
  @ApiResponse({
    status: 200,
    description: 'A single category',
    type: CreateCategoryDto,
  })
  @Get('/:id')
  async getCategoryById(@Param('id') id: string) {
    const category = await this.categoryService.getCategoryById(id);
    return { data: category };
  }
}
