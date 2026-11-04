import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateSetupDto {
  @ApiProperty({
    example: [
      'd5e8c2da-5b88-4b8f-b69a-7a285c647c68',
      'a650a36c-189c-4e74-ae35-fca9cb01c860',
    ],
    description: 'Danh sách ID các biến thể (ProductVariant) được đặt trên bàn làm việc',
    type: [String],
  })
  @IsArray({ message: 'variantIds phải là một mảng' })
  @ArrayNotEmpty({ message: 'variantIds không được để trống' })
  @IsString({ each: true, message: 'Mỗi variantId phải là chuỗi ký tự' })
  variantIds: string[];
}
