import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, description: 'Số lượng mới (tối thiểu 1)' })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number;
}
