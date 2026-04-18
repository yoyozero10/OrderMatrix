import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetOrdersDto {
  @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Số lượng mỗi trang (tối đa 50)', minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'pending',
    enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
    description: 'Lọc theo trạng thái đơn hàng',
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'shipping', 'completed', 'cancelled'], {
    message:
      'orderStatus phải là: pending, processing, shipping, completed, cancelled',
  })
  orderStatus?: string;
}
