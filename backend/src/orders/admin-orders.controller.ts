import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetAdminOrdersDto, UpdateOrderStatusDto } from './dto';

@ApiTags('Admin - Orders')
@ApiBearerAuth('access-token')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê đơn hàng (tổng quan)' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê đơn hàng theo trạng thái và doanh thu',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả đơn hàng (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đơn hàng với pagination',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getAllOrders(@Query() query: GetAdminOrdersDto) {
    return this.ordersService.getAllOrders(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết đơn hàng bao gồm thông tin user',
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getOrderById(@Param('id') orderId: string) {
    return this.ordersService.getAdminOrderById(orderId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 400, description: 'Chuyển trạng thái không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    return this.ordersService.updateOrderStatus(orderId, req.user.id, dto);
  }
}
