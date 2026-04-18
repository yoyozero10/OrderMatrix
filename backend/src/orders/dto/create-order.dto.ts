import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ShippingAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Nguyễn Huệ' })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'Phường Bến Nghé' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 'Quận 1' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsNotEmpty({ message: 'Thành phố không được để trống' })
  @IsString()
  city: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Địa chỉ giao hàng', type: ShippingAddressDto })
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    example: 'COD',
    enum: ['COD', 'MOCK'],
    description: 'Phương thức thanh toán',
  })
  @IsOptional()
  @IsIn(['COD', 'MOCK'], {
    message: 'Phương thức thanh toán phải là COD hoặc MOCK',
  })
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: 'Giao hàng trong giờ hành chính',
    description: 'Ghi chú đơn hàng',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
