import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVariantDto {
  @ApiPropertyOptional({
    example: 'IP15PM-BLU-256',
    description: 'SKU code (unique). Chỉ chứa chữ hoa, số, dấu gạch ngang.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'SKU chỉ được chứa chữ hoa, số và dấu gạch ngang',
  })
  sku?: string;

  @ApiPropertyOptional({
    example: 29990000,
    description: 'Giá của variant này (VNĐ)',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  price?: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Số lượng tồn kho của variant này',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Stock phải là số' })
  @Min(0, { message: 'Stock không được âm' })
  stock?: number;

  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'inactive'],
    description: 'Trạng thái variant',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'], {
    message: 'Status phải là active hoặc inactive',
  })
  status?: 'active' | 'inactive';
}
