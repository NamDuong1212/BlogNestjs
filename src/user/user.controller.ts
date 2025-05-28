import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  Param,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationService } from 'src/notification/notification.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  @ApiTags('User')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update a user profile with JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
    type: UpdateUserDto,
  })
  @Patch('/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id;
    const updatedUser = await this.userService.updateProfile(
      userId,
      updateUserDto,
    );
    return { message: 'Profile updated successfully', data: updatedUser };
  }

  @ApiTags('User')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Upload user avatar',
    description: 'Upload a user avatar with JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully.',
  })
  @Patch('/profile/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './temp/avatars',
        filename: (req, file, callback) => {
          const fileName = Date.now() + path.extname(file.originalname);
          callback(null, fileName);
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
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Upload to Cloudinary
    let avatarUrl: string;
    try {
      avatarUrl = await this.cloudinaryService.uploadImage(file);
    } catch (err) {
      throw new InternalServerErrorException('Cloudinary upload failed');
    }

    const userId = req.user.id;
    const updatedUser = await this.userService.updateProfileAvatar(
      userId,
      avatarUrl,
    );

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user avatar');
    }

    return {
      message: 'Avatar uploaded successfully',
      data: updatedUser,
    };
  }
  @ApiTags('User')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Get all notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @Get('/notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Request() req) {
    const notifications = await this.notificationService.getUserNotifications(
      req.user.id,
    );
    return {
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  @ApiTags('User')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @Patch('/notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(@Param('id') id: string, @Request() req) {
    const notification = await this.notificationService.markAsRead(
      id,
      req.user.id,
    );
    return {
      message: 'Notification marked as read',
      data: notification,
    };
  }

  @ApiTags('User')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  @Patch('/notifications/read-all')
  @UseGuards(JwtAuthGuard)
  async markAllNotificationsAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);
    return {
      message: 'All notifications marked as read',
    };
  }
}
