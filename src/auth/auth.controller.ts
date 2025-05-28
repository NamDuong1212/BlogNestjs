import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiTags('Auth')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'User Signup',
    description: 'Registers a new user and sends OTP for verification.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered and OTP sent.',
    type: SignupDto,
  })
  @Post('/signup')
  async signup(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    return await this.authService.signup(signupDto);
  }

  @ApiTags('Auth')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verifies the OTP sent to the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP successfully verified.',
    type: VerifyOtpDto,
  })
  @Post('/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    return await this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @ApiTags('Auth')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'User Login',
    description: 'Logs in a user and returns user information along with a JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in and token issued.',
    type: LoginDto,
  })
  @Post('/login')
  async login(@Body() loginDto: LoginDto): Promise<{ user: any; token: string }> {
    return await this.authService.login(loginDto);
  }

  @ApiTags('Auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Change Password',
    description: 'Changes the password of the authenticated user. Requires current password and new password (entered twice).',
  })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Passwords do not match or new password is same as current.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Current password is incorrect or user not authenticated.',
  })
  @Post('/change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return await this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @ApiTags('Auth')
  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Sends a password reset link to the user\'s email address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent (if email exists).',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If the email exists, a password reset link has been sent.'
        }
      }
    }
  })
  @Post('/forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiTags('Auth')
  @ApiOperation({
    summary: 'Reset Password',
    description: 'Resets the user\'s password using the reset token received via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset successfully'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Passwords do not match.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired reset token.',
  })
  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}