import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Current password must be at least 6 characters long' })
  @ApiProperty({
    description: 'The current password of the user.',
    example: 'currentPassword123',
  })
  currentPassword: string;

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