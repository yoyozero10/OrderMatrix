import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto, ChangePasswordDto } from './dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    const {
      password,
      refreshToken,
      passwordResetToken,
      passwordResetExpires,
      ...result
    } = user;
    return result;
  }

  @Put('me')
  @ApiOperation({ summary: 'Cập nhật profile (fullName, phone, avatar)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.update(
      req.user.id,
      updateProfileDto,
    );
    if (!updatedUser) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    const {
      password,
      refreshToken,
      passwordResetToken,
      passwordResetExpires,
      ...result
    } = updatedUser;
    return result;
  }

  @Put('me/password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu cũ không đúng hoặc xác nhận không khớp',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'USER_PASSWORD_MISMATCH',
        message: 'Mật khẩu xác nhận không khớp',
      });
    }

    await this.usersService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );

    return { message: 'Đổi mật khẩu thành công' };
  }
}
