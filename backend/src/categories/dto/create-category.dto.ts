import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Điện thoại', description: 'Tên danh mục' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Các loại điện thoại thông minh', description: 'Mô tả danh mục' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/phone.jpg', description: 'URL ảnh danh mục' })
  @IsOptional()
  @IsString()
  image?: string;
}
