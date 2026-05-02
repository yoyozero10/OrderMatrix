import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: 'inactive',
    enum: ['active', 'inactive'],
    description: 'Trạng thái user',
  })
  @IsNotEmpty({ message: 'Status không được để trống' })
  @IsEnum(['active', 'inactive'], {
    message: 'Status phải là: active, inactive',
  })
  status: string;
}
