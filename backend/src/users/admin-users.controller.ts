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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  GetAdminUsersDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
} from './dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả users' })
  @ApiResponse({ status: 200, description: 'Danh sách users với pagination' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getAllUsers(@Query() query: GetAdminUsersDto) {
    return this.usersService.getAllUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết user' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết user' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getUserById(@Param('id') userId: string) {
    return this.usersService.getAdminUserById(userId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái user (active/inactive)' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({
    status: 400,
    description: 'Không thể tự thay đổi trạng thái chính mình',
  })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req,
  ) {
    return this.usersService.updateUserStatus(userId, req.user.id, dto);
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Cập nhật role user (customer/admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật role thành công' })
  @ApiResponse({
    status: 400,
    description: 'Không thể tự thay đổi role chính mình',
  })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req,
  ) {
    return this.usersService.updateUserRole(userId, req.user.id, dto);
  }
}
