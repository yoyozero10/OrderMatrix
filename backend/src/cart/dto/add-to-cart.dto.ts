import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-product-id', description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2, description: 'Số lượng (tối thiểu 1)' })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number;
}
