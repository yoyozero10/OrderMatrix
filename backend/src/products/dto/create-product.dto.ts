import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max', description: 'Tên sản phẩm' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Điện thoại Apple iPhone 15 Pro Max 256GB',
    description: 'Mô tả sản phẩm',
  })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString()
  description: string;

  @ApiProperty({ example: 34990000, description: 'Giá sản phẩm (VNĐ)' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  price: number;

  @ApiProperty({ example: 100, description: 'Số lượng tồn kho' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  stock: number;

  @ApiProperty({ example: 'uuid-category-id', description: 'ID danh mục' })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId: string;

  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'inactive'],
    description: 'Trạng thái sản phẩm',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'], {
    message: 'Status phải là active hoặc inactive',
  })
  status?: string;
}
