import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOptionValueDto {
  @ApiProperty({
    example: 'Xanh Titan',
    description: 'Giá trị của option (e.g. Xanh Titan, 256GB)',
  })
  @IsNotEmpty({ message: 'Giá trị không được để trống' })
  @IsString()
  value: string;

  @ApiPropertyOptional({
    example: '#4B6CB7',
    description:
      'Hex color code cho color swatch (nullable). Chỉ dùng cho option màu sắc.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'colorCode phải là hex color hợp lệ (e.g. #4B6CB7)',
  })
  colorCode?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/colors/blue.jpg',
    description: 'URL ảnh thumbnail cho option value này',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Thứ tự hiển thị',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
