import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a correct email address' })
  @ApiProperty({
    description: 'The email address of the user to send reset password link.',
    example: 'user@example.com',
  })
  email: string;
}