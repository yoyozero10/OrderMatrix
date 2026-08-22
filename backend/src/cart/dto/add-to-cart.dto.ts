import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    example: 'uuid-variant-id',
    description: 'ID của ProductVariant (SKU cụ thể)',
  })
  @IsNotEmpty({ message: 'Variant ID không được để trống' })
  @IsString()
  variantId: string;

  @ApiProperty({ example: 2, description: 'Số lượng (tối thiểu 1)' })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number;
}
