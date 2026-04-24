import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái server',
    description: 'Endpoint dùng để health check khi deploy với Docker/Kubernetes',
  })
  @ApiResponse({
    status: 200,
    description: 'Server đang hoạt động bình thường',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-04-16T00:00:00.000Z',
        uptime: 3600,
        environment: 'development',
        version: '1.0.0',
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }
}
