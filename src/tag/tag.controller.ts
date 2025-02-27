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
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiKeyGuard } from 'src/auth/guard/api-key.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @ApiTags('Tag')
  @ApiBearerAuth('api-key')
  @ApiOperation({
    summary: 'Create a new tag',
    description: 'Allows a creator to create a new tag.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully.',
    type: CreateTagDto,
  })
  @Post('/create')
  @UseGuards(ApiKeyGuard)
  async createTag(@Request() req, @Body() createTagDto: CreateTagDto) {
    const tag = await this.tagService.createTag(createTagDto);
    return { message: 'Tag created successfully', data: tag };
  }

  @ApiTags('Tag')
  @ApiBearerAuth('')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    description: 'All tags',
    type: CreateTagDto,
  })
  @Get('/getAll')
  async getAllTags() {
    const tags = await this.tagService.getAllTags();
    return { message: 'All tags', data: tags };
  }

  @ApiTags('Tag')
  @ApiBearerAuth('')
  @ApiOperation({ summary: 'Get a single tag by id' })
  @ApiResponse({
    status: 200,
    description: 'A single tag',
    type: CreateTagDto,
  })
  @Get('/:id')
  async getTagById(@Param('id') id: string) {
    const tag = await this.tagService.getTagById(id);
    return { data: tag };
  }

  @ApiTags('Tag')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully.',
    type: UpdateTagDto,
  })
  @Patch('/:id')
  @UseGuards(ApiKeyGuard)
  async updateTag(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }
    const updatedTag = await this.tagService.updateTag(id, updateTagDto);
    return { data: updatedTag };
  }

  @ApiTags('Tag')
  @ApiBearerAuth('')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully.'
  })
  @Delete('/:id')
  @UseGuards(ApiKeyGuard)
  async deleteTag(@Param('id') id: string, @Request() req) {
    const isCreator = req.user?.isCreator;
    const tag = await this.tagService.deleteTag(id, isCreator);
    return tag;
  }
}
