import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOptionTypeDto {
  @ApiProperty({
    example: 'Màu sắc',
    description: 'Tên option type (e.g. Màu sắc, Dung lượng, RAM)',
  })
  @IsNotEmpty({ message: 'Tên option type không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Thứ tự hiển thị (số nhỏ hơn hiển thị trước)',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
