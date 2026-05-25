import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro Max 512GB', description: 'Tên sản phẩm' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Mô tả chi tiết sản phẩm', description: 'Mô tả sản phẩm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 39990000, description: 'Giá sản phẩm (VNĐ)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  price?: number;

  @ApiPropertyOptional({ example: 50, description: 'Số lượng tồn kho', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  stock?: number;

  @ApiPropertyOptional({ example: 'uuid-category-id', description: 'ID danh mục mới' })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'], description: 'Trạng thái sản phẩm' })
  @IsOptional()
  @IsEnum(['active', 'inactive'], {
    message: 'Status phải là active hoặc inactive',
  })
  status?: string;
}
