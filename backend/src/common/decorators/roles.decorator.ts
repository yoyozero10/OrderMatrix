import { SetMetadata } from '@nestjs/common';

/**
 * Key để lưu metadata roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator - Định nghĩa roles được phép truy cập route
 *
 * Sử dụng:
 * @Roles('admin')              // Chỉ admin
 * @Roles('customer')           // Chỉ customer
 * @Roles('admin', 'customer')  // Cả admin và customer
 *
 * Ví dụ:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin')
 * @Get('admin/users')
 * getAllUsers() { }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
