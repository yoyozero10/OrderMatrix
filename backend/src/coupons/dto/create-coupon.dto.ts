import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ example: 'DISCOUNT10', description: 'Mã coupon' })
  @IsNotEmpty({ message: 'Mã giảm giá không được để trống' })
  @IsString({ message: 'Mã giảm giá phải là chuỗi ký tự' })
  code: string;

  @ApiProperty({
    example: 'percentage',
    enum: ['percentage', 'fixed'],
    description: 'Loại giảm giá (percentage hoặc fixed)',
  })
  @IsNotEmpty({ message: 'Loại giảm giá không được để trống' })
  @IsEnum(['percentage', 'fixed'], {
    message: 'Loại giảm giá phải là percentage hoặc fixed',
  })
  discountType: 'percentage' | 'fixed';

  @ApiProperty({ example: 10, description: 'Giá trị giảm (% hoặc số tiền)' })
  @IsNotEmpty({ message: 'Giá trị giảm không được để trống' })
  @IsNumber({}, { message: 'Giá trị giảm phải là số' })
  @Min(0, { message: 'Giá trị giảm không được âm' })
  discountValue: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Số tiền giảm tối đa (với %)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Số tiền giảm tối đa phải là số' })
  @Min(0, { message: 'Số tiền giảm tối đa không được âm' })
  maxDiscountAmount?: number;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Giá trị đơn hàng tối thiểu',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Giá trị đơn hàng tối thiểu phải là số' })
  @Min(0, { message: 'Giá trị đơn hàng tối thiểu không được âm' })
  minOrderValue?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Tổng số lượt dùng tối đa',
  })
  @IsOptional()
  @IsInt({ message: 'Tổng lượt dùng phải là số nguyên' })
  @Min(1, { message: 'Tổng lượt dùng tối thiểu là 1' })
  usageLimit?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số lượt dùng tối đa mỗi user',
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Số lượt dùng mỗi user phải là số nguyên' })
  @Min(1, { message: 'Số lượt dùng mỗi user tối thiểu là 1' })
  userUsageLimit?: number;

  @ApiProperty({
    example: '2026-03-01T00:00:00.000Z',
    description: 'Ngày bắt đầu áp dụng',
  })
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ISO date' })
  startDate: string | Date;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Ngày kết thúc áp dụng',
  })
  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ISO date' })
  endDate: string | Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái phải là boolean' })
  isActive?: boolean;
}
