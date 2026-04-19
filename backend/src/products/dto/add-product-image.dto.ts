import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddProductImageDto {
  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL ảnh sản phẩm' })
  @IsNotEmpty({ message: 'URL ảnh không được để trống' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ example: true, description: 'Đặt làm ảnh đại diện (primary)' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Thứ tự hiển thị (0 = đầu tiên)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
