import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCouponDto } from './dto/create-coupon.dto';

@ApiTags('Admin - Coupons')
@ApiBearerAuth('access-token')
@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả mã giảm giá (admin)' })
  @ApiResponse({ status: 200, description: 'Danh sách mã giảm giá' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getAllCoupons(@Query() query: any) {
    return this.couponsService.getAllCoupons(query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mã giảm giá mới (admin)' })
  @ApiResponse({ status: 201, description: 'Tạo mã giảm giá thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Mã giảm giá đã tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của mã giảm giá (admin)' })
  @ApiResponse({ status: 200, description: 'Chuyển trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mã giảm giá' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async toggleCoupon(@Param('id') id: string) {
    return this.couponsService.toggleCoupon(id);
  }
}
