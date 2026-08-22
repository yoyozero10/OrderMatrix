import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'iPhone 15 Pro Max 512GB',
    description: 'Tên sản phẩm',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Mô tả chi tiết sản phẩm',
    description: 'Mô tả sản phẩm',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'uuid-category-id',
    description: 'ID danh mục mới',
  })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId?: string;

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
