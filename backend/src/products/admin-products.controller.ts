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
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto, UpdateProductDto, AddProductImageDto } from './dto';
import { GenerateVariantsDto } from './dto/generate-variants.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@ApiTags('Admin - Products')
@ApiBearerAuth('access-token')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo sản phẩm mới (không cần giá/stock)' })
  @ApiResponse({ status: 201, description: 'Tạo sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm (tên, mô tả, danh mục, status)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sản phẩm (cascade xóa variants + images)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async removeProduct(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Thêm ảnh cho sản phẩm' })
  @ApiResponse({ status: 201, description: 'Thêm ảnh thành công' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async addProductImage(
    @Param('id') id: string,
    @Body() dto: AddProductImageDto,
  ) {
    return this.productsService.addProductImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Xóa ảnh sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa ảnh thành công' })
  @ApiResponse({ status: 404, description: 'Ảnh không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async removeProductImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeProductImage(id, imageId);
  }

  // =========================================================
  // VARIANT MANAGEMENT ENDPOINTS
  // =========================================================

  @Post(':id/variants/generate')
  @ApiOperation({
    summary: 'Generate variant matrix từ Cartesian product của các option values',
    description:
      'Nhận danh sách option types + values → tự động tạo tất cả tổ hợp variants. Bỏ qua các tổ hợp đã tồn tại.',
  })
  @ApiResponse({ status: 201, description: 'Variants được tạo thành công, trả về product với variants đầy đủ' })
  @ApiResponse({ status: 400, description: 'Option type/value không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  async generateVariants(
    @Param('id') id: string,
    @Body() dto: GenerateVariantsDto,
  ) {
    return this.productsService.generateVariants(id, dto);
  }

  @Put(':id/variants/:variantId')
  @ApiOperation({
    summary: 'Cập nhật giá / stock / SKU / status của một variant',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công, trả về product với variants đầy đủ' })
  @ApiResponse({ status: 404, description: 'Variant không tồn tại' })
  async updateVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(productId, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @ApiOperation({ summary: 'Xóa một variant' })
  @ApiResponse({ status: 200, description: 'Xóa thành công, trả về product với variants còn lại' })
  @ApiResponse({ status: 404, description: 'Variant không tồn tại' })
  async deleteVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.deleteVariant(productId, variantId);
  }
}
