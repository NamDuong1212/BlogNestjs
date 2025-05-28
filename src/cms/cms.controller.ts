import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Patch,
  UnauthorizedException,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { SignupDto } from 'src/auth/dto/signup.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateCategoryDto } from 'src/category/dto/create-category.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateCategoryDto } from 'src/category/dto/update-category.dto';
import { CreatePostDto } from 'src/post/dto/create-post.dto';
import { UpdateCreatorStatusDto } from 'src/user/dto/update-creator-status.dto';
import { ReviewCreatorRequestDto } from 'src/creator-request/dto/review-creator-request.dto';

@Controller('cms')
export class CmsController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Create admin account',
    description: 'Creates a new admin account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Admin account created successfully.',
    type: SignupDto,
  })
  @Post('/signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.cmsService.signup(signupDto);
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Admin Login',
    description:
      'Logs in an admin and returns admin information along with a JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin successfully logged in and token issued.',
    type: LoginDto,
  })
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.cmsService.login({ email, password });
    return user;
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Create Category',
    description: 'Creates a new category.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully.',
    type: CreateCategoryDto,
  })
  @Post('/category/create')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async createCategory(
    @Request() req,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.cmsService.createCategory(createCategoryDto);
    return { message: 'Category created successfully', data: category };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Update Category',
    description: 'Updates a category.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully.',
    type: UpdateCategoryDto,
  })
  @Patch('/category/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async updateCategory(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }
    const updateCategory = await this.cmsService.updateCategory(
      id,
      updateCategoryDto,
    );
    return { data: updateCategory };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Delete Category',
    description: 'Deletes a category.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully.',
  })
  @Delete('/category/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteCategory(@Param('id') id: string, @Request() req) {
    const isCreator = req.user?.isCreator;
    const category = await this.cmsService.deleteCategory(id, isCreator);
    return category;
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Get All Categories',
    description: 'Returns all categories.',
  })
  @ApiResponse({
    status: 200,
    description: 'All categories returned successfully.',
    type: CreateCategoryDto,
  })
  @Get('/category/get-all')
  async getAllCategory() {
    const category = await this.cmsService.getAllCategory();
    return { message: 'All categories', data: category };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Get Category By Id',
    description: 'Returns a category by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category returned successfully.',
    type: CreateCategoryDto,
  })
  @Get('/category/:id')
  async getCategoryById(@Param('id') id: string) {
    const category = await this.cmsService.getCategoryById(id);
    return { data: category };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Get All Users',
    description: 'Returns all users with their basic information and statistics.',
  })
  @ApiResponse({
    status: 200,
    description: 'All users returned successfully.',
  })
  @Get('/user/get-all')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getAllUsers() {
    const users = await this.cmsService.getAllUsers();
    return { message: 'All users retrieved successfully', data: users };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Get User By Id',
    description: 'Returns detailed information about a specific user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details returned successfully.',
  })
  @Get('/user/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserById(@Param('id') id: string) {
    const user = await this.cmsService.getUserById(id);
    return { message: 'User details retrieved successfully', data: user };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Calculate Daily Earnings',
    description: 'Manually calculates daily earnings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily earnings calculated successfully.',
  })
  @Post('/wallet/daily')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async calculateDailyEarnings() {
    return this.cmsService.calculateDailyEarning();
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Delete User',
    description: 'Deletes a user by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
  })
  @Delete('/user/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteUser(@Param('id') id: string) {
    return this.cmsService.deleteUser(id);
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Delete a post',
    description: 'Allows a creator to delete a post by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post was deleted successfully',
    type: CreatePostDto,
  })
  @Delete('/post/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deletePost(@Param('id') id: string) {
    const post = await this.cmsService.deletePost(id);
    return post;
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Update a post image',
    description: 'Allows a creator to update a post image by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post image was updated successfully',
    type: CreatePostDto,
  })
  @Get('/report/get-all')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getAllReport() {
    const report = await this.cmsService.getAllReport();
    return { message: 'All reports', data: report };
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Delete Report',
    description: 'Deletes a report by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully.',
  })
  @Delete('/report/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteReport(@Param('id') id: string) {
    return this.cmsService.deleteReport(id);
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Notify posted report',
    description: 'Notifies a creator that their post has been deleted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully.',
  })
  @Post('/notify')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async notifyPostDeletion(@Body() body: { postId: string }) {
    const { postId } = body;

    const post = await this.cmsService.findPostById(postId);
    if (!post || !post.user || !post.user.isCreator) {
      throw new UnauthorizedException(
        'Post not found or user is not a creator',
      );
    }

    return this.cmsService.notifyPostDeletion(post.user.id, post.title);
  }

  @ApiTags('Cms')
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Get List of Views',
    description:
      'Returns a list of views for all posts along with the amount to be paid.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of views returned successfully.',
  })
  @Get('/views')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getListOfViews() {
    return this.cmsService.getListOfViews();
  }
  // Add these methods to your existing CmsController class

@ApiTags('Cms')
@ApiBearerAuth('admin')
@ApiOperation({
  summary: 'Get all creator requests',
  description: 'Returns all creator requests for admin review',
})
@ApiResponse({
  status: 200,
  description: 'Creator requests retrieved successfully',
})
@Get('/creator-requests')
@UseGuards(JwtAuthGuard, RoleGuard)
async getAllCreatorRequests() {
  const requests = await this.cmsService.getAllCreatorRequests();
  return {
    message: 'Creator requests retrieved successfully',
    data: requests,
  };
}

@ApiTags('Cms')
@ApiBearerAuth('admin')
@ApiOperation({
  summary: 'Review creator request',
  description: 'Approve or reject a creator request',
})
@ApiResponse({
  status: 200,
  description: 'Creator request reviewed successfully',
})
@Patch('/creator-requests/:id/review')
@UseGuards(JwtAuthGuard, RoleGuard)
async reviewCreatorRequest(
  @Param('id') id: string,
  @Body() reviewDto: ReviewCreatorRequestDto,
  @Request() req,
) {
  const request = await this.cmsService.reviewCreatorRequest(
    id,
    reviewDto,
    req.user.id,
  );
  return {
    message: 'Creator request reviewed successfully',
    data: request,
  };
}

@ApiTags('Cms')
@ApiBearerAuth('admin')
@ApiOperation({
  summary: 'Update user creator status',
  description: 'Enable or disable creator status for a user',
})
@ApiResponse({
  status: 200,
  description: 'Creator status updated successfully',
})
@Patch('/user/:id/creator-status')
@UseGuards(JwtAuthGuard, RoleGuard)
async updateCreatorStatus(
  @Param('id') id: string,
  @Body() updateDto: UpdateCreatorStatusDto,
  @Request() req,
) {
  const result = await this.cmsService.updateUserCreatorStatus(
    id,
    updateDto,
    req.user.id,
  );
  return {
    message: 'Creator status updated successfully',
    data: result,
  };
}
}
