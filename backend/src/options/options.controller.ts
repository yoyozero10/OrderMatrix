import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OptionsService } from './options.service';
import { CreateOptionTypeDto } from './dto/create-option-type.dto';
import { CreateOptionValueDto } from './dto/create-option-value.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin - Options')
@ApiBearerAuth('access-token')
@Controller('admin/options')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả option types kèm values' })
  @ApiResponse({ status: 200, description: 'Danh sách option types' })
  async findAll() {
    return this.optionsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo option type mới (e.g. Màu sắc, Dung lượng)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createOptionType(@Body() dto: CreateOptionTypeDto) {
    return this.optionsService.createOptionType(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật option type' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Option type không tồn tại' })
  async updateOptionType(
    @Param('id') id: string,
    @Body() dto: CreateOptionTypeDto,
  ) {
    return this.optionsService.updateOptionType(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa option type (cascade xóa values)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Option type không tồn tại' })
  async deleteOptionType(@Param('id') id: string) {
    return this.optionsService.deleteOptionType(id);
  }

  @Post(':id/values')
  @ApiOperation({ summary: 'Thêm option value vào option type' })
  @ApiResponse({ status: 201, description: 'Thêm thành công' })
  @ApiResponse({ status: 404, description: 'Option type không tồn tại' })
  @ApiResponse({ status: 400, description: 'Giá trị đã tồn tại' })
  async addOptionValue(
    @Param('id') typeId: string,
    @Body() dto: CreateOptionValueDto,
  ) {
    return this.optionsService.addOptionValue(typeId, dto);
  }

  @Put(':typeId/values/:valueId')
  @ApiOperation({ summary: 'Cập nhật option value' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Option value không tồn tại' })
  async updateOptionValue(
    @Param('typeId') typeId: string,
    @Param('valueId') valueId: string,
    @Body() dto: CreateOptionValueDto,
  ) {
    return this.optionsService.updateOptionValue(typeId, valueId, dto);
  }

  @Delete(':typeId/values/:valueId')
  @ApiOperation({ summary: 'Xóa option value' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Option value không tồn tại' })
  async deleteOptionValue(
    @Param('typeId') typeId: string,
    @Param('valueId') valueId: string,
  ) {
    return this.optionsService.deleteOptionValue(typeId, valueId);
  }
}
