import {
  Controller,
  Body,
  UseGuards,
  Patch,
  Param,
  Get,
  Query,
  Post,
  Req,
  UnauthorizedException,
  Delete,
  Request,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  UploadedFiles,
  InternalServerErrorException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Create a new post',
    description: 'Allows a creator to create a new post.',
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully.',
    type: CreatePostDto,
  })
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Req() req,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('categoryId') categoryId: string,
  ) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }
    const userId = req.user.id;
    return this.postService.createPost(userId, title, content, categoryId);
  }

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Update a post',
    description: 'Allows a creator to update an existing post by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully.',
    type: UpdatePostDto,
  })
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const updatePost = await this.postService.updatePost(id, updatePostDto);
    return { data: updatePost };
  }

  // ENDPOINTS CỐ ĐỊNH đặt trước các endpoints với tham số động
  @ApiTags('Post')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Get all posts',
    description: 'Fetches a paginated list of all posts.',
  })
  @ApiResponse({
    status: 200,
    description: 'All posts',
    type: CreatePostDto,
  })
  @Get('getAll')
  async getAllPosts(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.postService.getAllPost(page, limit);
  }

  // ENDPOINT SEARCH đặt trước các endpoints với tham số động
  @ApiTags('Post')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Search posts',
    description: 'Search posts by title with pagination support.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: CreatePostDto,
  })
  @Get('search')
async searchPosts(
  @Query('query') query: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  if (!query || query.trim() === '') {
    throw new BadRequestException('Search query cannot be empty');
  }

  // chuyển hyphen thành space
  const normalizedQuery = query.replace(/-/g, ' ');

  return this.postService.searchPosts(normalizedQuery, page, limit);
}

  @ApiTags('Post')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Get posts by Category',
    description: 'Fetches posts belonging to a specific category.',
  })
  @ApiResponse({
    status: 200,
    description: 'Posts belonging to a specific category',
    type: CreatePostDto,
  })
  @Get('GetByCategory/:id')
  async getPostsByCategory(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postService.getPostByCategory(id, page, limit);
  }

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Get posts by user',
    description: 'Fetches posts created by a specific user who is a creator.',
  })
  @ApiResponse({
    status: 200,
    description: 'Posts created by the user',
    type: CreatePostDto,
  })
  @Get('by-user/:userId')
  @UseGuards(JwtAuthGuard)
  async getPostByCreator(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postService.getPostByCreator(userId, page, limit);
  }

  @ApiTags('Post')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Get related posts',
    description:
      'Fetches related posts based on category hierarchy, excluding the current post.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of related posts',
    type: CreatePostDto,
  })
  @Get('related/:postId')
  async getRelatedPosts(
    @Param('postId') postId: string,
    @Query('categoryHierarchy') categoryHierarchy: string,
  ) {
    if (!categoryHierarchy) {
      const post = await this.postService.findOneById(postId);
      if (!post || !post.categoryHierarchy) {
        throw new NotFoundException('Post or category hierarchy not found');
      }
      categoryHierarchy = post.categoryHierarchy;
    }

    return this.postService.getRelatedPosts(categoryHierarchy, postId);
  }

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Delete a post',
    description: 'Allows a creator to delete a post by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post was deleted successfully',
    type: CreatePostDto,
  })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @Request() req) {
    const isCreator = req.user?.isCreator;
    const post = await this.postService.deletePost(id, isCreator);
    return post;
  }

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Upload images to a post',
    description: 'Allows a creator to upload up to 10 images for a post by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Images uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @Patch(':id/upload-images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './temp/uploads',
        filename: (req, file, callback) => {
          const filename = `${uuidv4()}-${file.originalname}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files,
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images are allowed per post');
    }

    try {
      const cloudinaryUrls = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadImage(file)),
      );

      const isCreator = req.user?.isCreator;
      const updatedPost = await this.postService.updatePostImages(
        id,
        cloudinaryUrls,
        isCreator,
      );

      if (!updatedPost) {
        throw new InternalServerErrorException('Failed to upload images');
      }

      return {
        message: 'Images uploaded successfully',
        data: {
          data: updatedPost,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload images: ${error.message}`,
      );
    }
  }

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Delete an image from a post',
    description: 'Allows a creator to delete a specific image from their post',
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
  })
  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  async deletePostImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @Request() req,
  ) {
    try {
      const isCreator = req.user?.isCreator;
      const updatedPost = await this.postService.deletePostImage(
        id,
        imageUrl,
        isCreator,
      );

      return {
        message: 'Image deleted successfully',
        data: updatedPost,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete image: ${error.message}`,
      );
    }
  }

  // Keep the original single image upload for backward compatibility
  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Upload an image to a post',
    description: 'Allows a creator to upload an image to a post by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    type: CreatePostDto,
  })
  @Patch(':id/upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './temp/uploads',
        filename: (req, file, callback) => {
          const filename = `${uuidv4()}-${file.originalname}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const cloudinaryUrl = await this.cloudinaryService.uploadImage(file);

    const isCreator = req.user?.isCreator;

    // Maintain backward compatibility but also add to images array
    const updatedPost = await this.postService.updatePostImage(
      id,
      cloudinaryUrl,
      isCreator,
    );

    if (!updatedPost) {
      throw new InternalServerErrorException('Failed to upload image');
    }

    return {
      message: 'Image uploaded successfully',
      data: {
        data: updatedPost,
      },
    };
  }

  // Đặt endpoint view post theo ID cuối cùng vì nó có thể xung đột với các route khác
  @ApiTags('Post')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'View a post',
    description: 'Fetches the details of a single post by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post details',
    type: CreatePostDto,
  })
  @Get(':postId')
  async viewPost(@Param('postId') postId: string) {
    return this.postService.getPostById(postId);
  }
}