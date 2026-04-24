import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './common/logger';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs cho đến khi Winston sẵn sàng
  });

  // Sử dụng Winston làm logger mặc định
  const logger = app.get(WinstonLoggerService);
  app.useLogger(logger);

  // Helmet - bảo vệ HTTP headers
  app.use(helmet());

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Global exception filter - chuẩn hóa error response (lấy từ DI)
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  // Global logging interceptor - log HTTP request/response (lấy từ DI)
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS với whitelist
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  // ==================== SWAGGER SETUP ====================
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription(
      'API Documentation cho Hệ Thống Đặt Hàng và Quản Lý Đơn Hàng Trực Tuyến',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Health', 'Kiểm tra trạng thái server')
    .addTag('Auth', 'Xác thực: Đăng ký, Đăng nhập, Token, Mật khẩu')
    .addTag('Users', 'Quản lý profile người dùng')
    .addTag('Products', 'Sản phẩm (Public)')
    .addTag('Categories', 'Danh mục (Public)')
    .addTag('Cart', 'Giỏ hàng')
    .addTag('Orders', 'Đơn hàng')
    .addTag('Admin - Products', 'Quản lý sản phẩm (Admin)')
    .addTag('Admin - Categories', 'Quản lý danh mục (Admin)')
    .addTag('Admin - Orders', 'Quản lý đơn hàng (Admin)')
    .addTag('Admin - Users', 'Quản lý người dùng (Admin)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 Server đang chạy tại http://localhost:${port}`, 'Bootstrap');
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
