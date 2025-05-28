import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The reset token received via email.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @ApiProperty({
    description: 'The new password for the user. Must be at least 6 characters long.',
    example: 'newPassword123',
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  @ApiProperty({
    description: 'Confirmation of the new password. Must match the new password.',
    example: 'newPassword123',
  })
  confirmPassword: string;
}