import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Laptop & Máy tính', description: 'Tên danh mục mới' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Laptop, máy tính bàn và phụ kiện', description: 'Mô tả danh mục' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/laptop.jpg', description: 'URL ảnh danh mục mới' })
  @IsOptional()
  @IsString()
  image?: string;
}
