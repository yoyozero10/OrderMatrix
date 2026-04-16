import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto, GetOrdersDto } from './dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng từ giỏ hàng' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được tạo thành công' })
  @ApiResponse({
    status: 400,
    description: 'Giỏ hàng trống hoặc sản phẩm hết hàng',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của user' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đơn hàng với pagination',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getMyOrders(@Request() req, @Query() query: GetOrdersDto) {
    return this.ordersService.getMyOrders(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getOrderById(@Request() req, @Param('id') orderId: string) {
    return this.ordersService.getOrderById(req.user.id, orderId);
  }

  @Put(':id/cancel')
  @ApiOperation({
    summary: 'Hủy đơn hàng (chỉ hủy được khi ở trạng thái pending)',
  })
  @ApiResponse({ status: 200, description: 'Hủy đơn hàng thành công' })
  @ApiResponse({
    status: 400,
    description: 'Không thể hủy đơn hàng ở trạng thái hiện tại',
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async cancelOrder(@Request() req, @Param('id') orderId: string) {
    return this.ordersService.cancelOrder(req.user.id, orderId);
  }
}
