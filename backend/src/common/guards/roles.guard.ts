import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard - Phân quyền dựa trên role của user
 *
 * Luồng hoạt động:
 * 1. Đọc required roles từ @Roles() decorator
 * 2. Lấy user từ request (đã được gắn bởi JwtAuthGuard)
 * 3. So sánh user.role với required roles
 * 4. Cho phép hoặc từ chối access
 *
 * Sử dụng:
 * @UseGuards(JwtAuthGuard, RolesGuard)  // JwtAuthGuard PHẢI đi trước
 * @Roles('admin')
 * @Get('admin/orders')
 * getOrders() { }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy required roles từ decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có @Roles() decorator → cho phép tất cả
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Lấy user từ request (đã được gắn bởi JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'FORBIDDEN_RESOURCE',
        message: 'Bạn không có quyền truy cập tài nguyên này',
      });
    }

    // Kiểm tra user có role phù hợp không
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'FORBIDDEN_RESOURCE',
        message: `Bạn cần quyền ${requiredRoles.join(' hoặc ')} để truy cập tài nguyên này`,
      });
    }

    return true;
  }
}
