import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompatibilityService } from './compatibility.service';
import { ValidateSetupDto } from './dto/validate-setup.dto';

@ApiTags('Compatibility')
@Controller('compatibility')
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Post('validate')
  @ApiOperation({
    summary: 'Thẩm định tính tương thích của Apple Setup trên bàn làm việc',
    description:
      'Đánh giá đồng bộ công suất sạc, chuẩn kết nối cáp sạc, điểm hài hòa màu sắc (Color Harmony) và gợi ý ưu đãi Bundle.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả thẩm định tương thích chi tiết',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  async validateSetup(@Body() dto: ValidateSetupDto) {
    return this.compatibilityService.validateSetup(dto);
  }

  @Get('rules')
  @ApiOperation({
    summary: 'Lấy danh mục quy tắc phần cứng và bảng màu Apple',
    description: 'Cung cấp thông số min/max wattage, cổng sạc, và bảng màu hex phục vụ Canvas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách thông số phần cứng và bảng màu',
  })
  getRules() {
    return this.compatibilityService.getRules();
  }
}
