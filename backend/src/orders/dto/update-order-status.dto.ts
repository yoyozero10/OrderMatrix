import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'processing',
    enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
    description: 'Trạng thái mới',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(['pending', 'processing', 'shipping', 'completed', 'cancelled'], {
    message:
      'Status phải là: pending, processing, shipping, completed, cancelled',
  })
  status: string;

  @ApiPropertyOptional({
    example: 'Đã xác nhận đơn hàng',
    description: 'Ghi chú (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
