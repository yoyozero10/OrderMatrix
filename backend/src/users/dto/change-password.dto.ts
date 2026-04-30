import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123', description: 'Mật khẩu cũ' })
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: 'NewPass456',
    description: 'Mật khẩu mới (6-50 ký tự)',
    minLength: 6,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu mới không được vượt quá 50 ký tự' })
  newPassword: string;

  @ApiProperty({ example: 'NewPass456', description: 'Xác nhận mật khẩu mới' })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString()
  confirmPassword: string;
}
