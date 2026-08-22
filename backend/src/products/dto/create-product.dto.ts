import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max', description: 'Tên sản phẩm' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Điện thoại Apple iPhone 15 Pro Max chip A17 Pro',
    description: 'Mô tả sản phẩm',
  })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'uuid-category-id', description: 'ID danh mục' })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId: string;

  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'inactive'],
    description: 'Trạng thái sản phẩm (mặc định: active)',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'], {
    message: 'Status phải là active hoặc inactive',
  })
  status?: string;
}
