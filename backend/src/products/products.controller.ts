import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetProductsDto } from './dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách sản phẩm với pagination, search, filter, sort',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số item mỗi trang (mặc định: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên/mô tả',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Lọc theo danh mục',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Giá tối thiểu',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Giá tối đa',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'name_asc'],
    description: 'Sắp xếp',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm với pagination metadata',
  })
  async findAll(@Query() query: GetProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết sản phẩm với tất cả images',
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
