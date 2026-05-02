import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'admin',
    enum: ['customer', 'admin'],
    description: 'Role mới',
  })
  @IsNotEmpty({ message: 'Role không được để trống' })
  @IsEnum(['customer', 'admin'], {
    message: 'Role phải là: customer, admin',
  })
  role: string;
}
