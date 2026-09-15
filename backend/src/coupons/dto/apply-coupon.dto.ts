import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ example: 'DISCOUNT10', description: 'Mã coupon' })
  @IsNotEmpty({ message: 'Mã giảm giá không được để trống' })
  @IsString({ message: 'Mã giảm giá phải là chuỗi ký tự' })
  code: string;

  @ApiProperty({
    example: 250000,
    description: 'Tổng tiền đơn hàng trước giảm giá',
  })
  @IsNotEmpty({ message: 'Tổng tiền đơn hàng không được để trống' })
  @IsNumber({}, { message: 'Tổng tiền đơn hàng phải là số' })
  @Min(0, { message: 'Tổng tiền đơn hàng không được âm' })
  orderTotal: number;
}
