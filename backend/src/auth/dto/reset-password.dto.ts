import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123def456...', description: 'Token đặt lại mật khẩu (nhận qua email)' })
  @IsString()
  @IsNotEmpty({ message: 'Token không được để trống' })
  token: string;

  @ApiProperty({ example: 'NewPass789', description: 'Mật khẩu mới (tối thiểu 6 ký tự)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  newPassword: string;
}
