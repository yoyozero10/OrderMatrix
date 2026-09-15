import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth('access-token')
@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Kiểm tra và áp dụng mã giảm giá' })
  @ApiResponse({ status: 200, description: 'Áp dụng mã giảm giá thành công' })
  @ApiResponse({ status: 400, description: 'Mã giảm giá không hợp lệ hoặc hết hạn' })
  @ApiResponse({ status: 404, description: 'Mã giảm giá không tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async applyCoupon(@Request() req, @Body() dto: ApplyCouponDto) {
    return this.couponsService.applyCoupon(req.user.id, dto.code, dto.orderTotal);
  }
}
