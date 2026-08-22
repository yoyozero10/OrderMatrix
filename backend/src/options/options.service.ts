import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OptionType } from '../products/entities/option-type.entity';
import { OptionValue } from '../products/entities/option-value.entity';
import { CreateOptionTypeDto } from './dto/create-option-type.dto';
import { CreateOptionValueDto } from './dto/create-option-value.dto';

@Injectable()
export class OptionsService {
  constructor(
    @InjectRepository(OptionType)
    private optionTypeRepository: Repository<OptionType>,
    @InjectRepository(OptionValue)
    private optionValueRepository: Repository<OptionValue>,
  ) {}

  /**
   * GET /admin/options
   * Lấy tất cả option types kèm values, sắp xếp theo displayOrder
   */
  async findAll(): Promise<any[]> {
    const optionTypes = await this.optionTypeRepository.find({
      relations: ['values'],
      order: {
        displayOrder: 'ASC',
        values: { displayOrder: 'ASC' },
      },
    });

    return optionTypes.map((type) => this.formatOptionType(type));
  }

  /**
   * POST /admin/options
   * Tạo option type mới (e.g. "Màu sắc", "Dung lượng")
   */
  async createOptionType(dto: CreateOptionTypeDto): Promise<any> {
    const optionType = this.optionTypeRepository.create({
      name: dto.name,
      displayOrder: dto.displayOrder ?? 0,
    });
    const saved = await this.optionTypeRepository.save(optionType);

    // Reload with values relation
    const full = await this.optionTypeRepository.findOne({
      where: { id: saved.id },
      relations: ['values'],
    });
    return this.formatOptionType(full!);
  }

  /**
   * PUT /admin/options/:id
   * Cập nhật option type
   */
  async updateOptionType(id: string, dto: CreateOptionTypeDto): Promise<any> {
    const optionType = await this.optionTypeRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!optionType) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'OPTION_TYPE_NOT_FOUND',
        message: 'Không tìm thấy option type',
      });
    }

    if (dto.name !== undefined) optionType.name = dto.name;
    if (dto.displayOrder !== undefined)
      optionType.displayOrder = dto.displayOrder;

    const saved = await this.optionTypeRepository.save(optionType);
    return this.formatOptionType(saved);
  }

  /**
   * DELETE /admin/options/:id
   * Xóa option type (cascade xóa values)
   */
  async deleteOptionType(id: string): Promise<{ message: string }> {
    const optionType = await this.optionTypeRepository.findOne({
      where: { id },
    });

    if (!optionType) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'OPTION_TYPE_NOT_FOUND',
        message: 'Không tìm thấy option type',
      });
    }

    await this.optionTypeRepository.remove(optionType);
    return { message: 'Xóa option type thành công' };
  }

  /**
   * POST /admin/options/:id/values
   * Thêm một value vào option type
   */
  async addOptionValue(typeId: string, dto: CreateOptionValueDto): Promise<any> {
    const optionType = await this.optionTypeRepository.findOne({
      where: { id: typeId },
      relations: ['values'],
    });

    if (!optionType) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'OPTION_TYPE_NOT_FOUND',
        message: 'Không tìm thấy option type',
      });
    }

    // Check duplicate value trong cùng type
    const existingValue = optionType.values?.find(
      (v) => v.value.toLowerCase() === dto.value.toLowerCase(),
    );
    if (existingValue) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'OPTION_VALUE_DUPLICATE',
        message: `Giá trị "${dto.value}" đã tồn tại trong option type này`,
      });
    }

    const optionValueData: Partial<OptionValue> = {
      value: dto.value,
      colorCode: dto.colorCode ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
      displayOrder: dto.displayOrder ?? (optionType.values?.length ?? 0),
      optionType: { id: typeId } as OptionType,
    };
    const optionValue = this.optionValueRepository.create(
      optionValueData as OptionValue,
    );

    const saved = await this.optionValueRepository.save(optionValue);
    return this.formatOptionValue(saved);
  }

  /**
   * PUT /admin/options/:typeId/values/:valueId
   * Cập nhật một option value
   */
  async updateOptionValue(
    typeId: string,
    valueId: string,
    dto: CreateOptionValueDto,
  ): Promise<any> {
    const optionValue = await this.optionValueRepository.findOne({
      where: { id: valueId, optionType: { id: typeId } },
      relations: ['optionType'],
    });

    if (!optionValue) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'OPTION_VALUE_NOT_FOUND',
        message: 'Không tìm thấy option value',
      });
    }

    if (dto.value !== undefined) optionValue.value = dto.value;
    if (dto.colorCode !== undefined) optionValue.colorCode = dto.colorCode;
    if (dto.imageUrl !== undefined) optionValue.imageUrl = dto.imageUrl;
    if (dto.displayOrder !== undefined)
      optionValue.displayOrder = dto.displayOrder;

    const saved = await this.optionValueRepository.save(optionValue);
    return this.formatOptionValue(saved);
  }

  /**
   * DELETE /admin/options/:typeId/values/:valueId
   * Xóa một option value
   */
  async deleteOptionValue(
    typeId: string,
    valueId: string,
  ): Promise<{ message: string }> {
    const optionValue = await this.optionValueRepository.findOne({
      where: { id: valueId, optionType: { id: typeId } },
    });

    if (!optionValue) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'OPTION_VALUE_NOT_FOUND',
        message: 'Không tìm thấy option value',
      });
    }

    await this.optionValueRepository.remove(optionValue);
    return { message: 'Xóa option value thành công' };
  }

  // ========================
  // HELPERS
  // ========================

  private formatOptionType(optionType: OptionType): any {
    return {
      id: optionType.id,
      name: optionType.name,
      displayOrder: optionType.displayOrder,
      values: (optionType.values ?? [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((v) => this.formatOptionValue(v)),
      createdAt: optionType.createdAt,
      updatedAt: optionType.updatedAt,
    };
  }

  private formatOptionValue(optionValue: OptionValue): any {
    return {
      id: optionValue.id,
      value: optionValue.value,
      colorCode: optionValue.colorCode ?? null,
      imageUrl: optionValue.imageUrl ?? null,
      displayOrder: optionValue.displayOrder,
    };
  }
}
