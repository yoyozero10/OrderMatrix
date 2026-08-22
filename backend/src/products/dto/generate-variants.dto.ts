import { IsArray, IsUUID, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OptionSelectionDto {
  @ApiProperty({
    example: 'uuid-option-type-id',
    description: 'ID của OptionType (e.g. Màu sắc)',
  })
  @IsUUID('4')
  optionTypeId: string;

  @ApiProperty({
    example: ['uuid-val-1', 'uuid-val-2'],
    description: 'Danh sách ID của các OptionValue được chọn',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  optionValueIds: string[];
}

export class GenerateVariantsDto {
  @ApiProperty({
    type: [OptionSelectionDto],
    description:
      'Danh sách option types và values để generate Cartesian product',
    example: [
      {
        optionTypeId: 'uuid-color-type',
        optionValueIds: ['uuid-blue', 'uuid-black'],
      },
      {
        optionTypeId: 'uuid-storage-type',
        optionValueIds: ['uuid-256gb', 'uuid-512gb'],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OptionSelectionDto)
  options: OptionSelectionDto[];
}
