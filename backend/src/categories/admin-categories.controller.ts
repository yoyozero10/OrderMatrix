import {
  Controller,
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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@ApiTags('Admin - Categories')
@ApiBearerAuth('access-token')
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  @ApiResponse({ status: 201, description: 'Tạo danh mục thành công' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({
    status: 400,
    description: 'Danh mục đang có sản phẩm, không thể xóa',
  })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async removeCategory(@Param('id') id: string) {
    return this.categoriesService.removeCategory(id);
  }
}
