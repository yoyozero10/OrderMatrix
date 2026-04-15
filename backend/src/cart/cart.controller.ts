import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin giỏ hàng với danh sách items',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiResponse({ status: 201, description: 'Thêm thành công' })
  @ApiResponse({
    status: 400,
    description: 'Sản phẩm không tồn tại hoặc hết hàng',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Cart item không tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async updateCartItem(
    @Request() req,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(req.user.id, itemId, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Xóa một sản phẩm khỏi giỏ hàng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Cart item không tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async removeCartItem(@Request() req, @Param('id') itemId: string) {
    return this.cartService.removeCartItem(req.user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiResponse({ status: 200, description: 'Xóa giỏ hàng thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
