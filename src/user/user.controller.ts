import { BadRequestException, Body, Controller, Patch, Request, UploadedFile, UseGuards, UseInterceptors, InternalServerErrorException } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService
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
    type: UpdateUserDto
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
          return callback(new BadRequestException('Only image files are allowed!'), false);
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
}
