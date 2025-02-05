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
  InternalServerErrorException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

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
    @Body('tags') tags?: string[],
  ) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }
    const userId = req.user.id;
    return this.postService.createPost(
      userId,
      title,
      content,
      categoryId,
      tags,
    );
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
  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const updatePost = await this.postService.updatePost(id, updatePostDto);
    return { data: updatePost };
  }

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
  @Get('/getAll')
  async getAllPosts(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.postService.getAllPost(page, limit);
  }

  @ApiTags('Post')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Get posts by category',
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
    @Query('limit') limit = 20,
  ) {
    return this.postService.getPostByCategory(id, page, limit);
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
  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @Request() req) {
    const isCreator = req.user?.isCreator;
    const post = await this.postService.deletePost(id, isCreator);
    return post;
  }

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
  @Patch('/:id/upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/posts',
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

    const imageUrl = `/uploads/posts/${file.filename}`;

    const isCreator = req.user?.isCreator;
    const updatedImg = await this.postService.updatePostImage(
      id,
      imageUrl,
      isCreator,
    );
    if (!updatedImg) {
      throw new InternalServerErrorException('Failed to upload image');
    }

    return {
      message: 'Image uploaded successfully',
      data: {
        data: updatedImg,
      },
    };
  }

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
  @Get('/:postId')
  async viewPost(@Param('postId') postId: string) {
    return this.postService.getPostById(postId);
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
    @Query('limit') limit = 20,
  ) {
    return this.postService.getPostByCreator(userId, page, limit);
  }

  @ApiTags('Post')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Download a post',
    description: 'Allows a creator to download a post by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post downloaded successfully',
  })
  @Get(':postId/download')
  @UseGuards(JwtAuthGuard)
  async downloadPost(@Param('postId') postId: string, @Res() res: Response) {
    const post = await this.postService.findOneById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const doc = new PDFDocument();
    const sanitizedTitle = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const fontPath = './src/assets/fonts/times.TTF';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizedTitle}.pdf"`,
    );

    doc.pipe(res);

    doc.font(fontPath);

    doc.fontSize(20).text(post.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Author: ${post.user.username}`, { align: 'left' });
    doc.moveDown();
    doc.fontSize(14).text(post.content, { align: 'justify', lineGap: 6 });

    doc.end();
  }
}
