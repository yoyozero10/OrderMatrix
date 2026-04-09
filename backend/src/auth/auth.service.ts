import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { User } from '../users/entities/user.entity';
import { WinstonLoggerService } from '../common/logger';

@Injectable()
export class AuthService {
  private readonly context = 'AuthService';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: WinstonLoggerService,
  ) {}

  // ==================== REGISTER ====================
  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; user: Partial<User> }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException({
        statusCode: 400,
        errorCode: 'AUTH_EMAIL_EXISTS',
        message: 'Email đã được sử dụng',
      });
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
    });

    const {
      password,
      refreshToken,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitive
    } = user;

    this.logger.log(
      `Đăng ký thành công: ${user.email} (ID: ${user.id})`,
      this.context,
    );

    return {
      message: 'Đăng ký thành công',
      user: userWithoutSensitive,
    };
  }

  // ==================== LOGIN ====================
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(
        `Đăng nhập thất bại - email không tồn tại: ${loginDto.email}`,
        this.context,
      );
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    if (user.status === 'inactive') {
      this.logger.warn(
        `Đăng nhập bị chặn - tài khoản bị khóa: ${user.email}`,
        this.context,
      );
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'AUTH_ACCOUNT_LOCKED',
        message: 'Tài khoản đã bị khóa',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Đăng nhập thất bại - sai mật khẩu: ${user.email}`,
        this.context,
      );
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // Generate tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Save hashed refresh token to DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(user.id, {
      refreshToken: hashedRefreshToken,
    });

    const {
      password,
      refreshToken: _,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitive
    } = user;

    this.logger.log(
      `Đăng nhập thành công: ${user.email} (role: ${user.role})`,
      this.context,
    );

    return {
      accessToken,
      refreshToken,
      user: userWithoutSensitive,
    };
  }

  // ==================== LOGOUT ====================
  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.update(userId, { refreshToken: null as any });
    this.logger.log(`Đăng xuất: userId=${userId}`, this.context);
    return { message: 'Đăng xuất thành công' };
  }

  // ==================== REFRESH TOKEN ====================
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken);

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException({
          statusCode: 401,
          errorCode: 'AUTH_INVALID_TOKEN',
          message: 'Refresh token không hợp lệ',
        });
      }

      // Verify refresh token matches
      const isTokenValid = await bcrypt.compare(
        refreshTokenDto.refreshToken,
        user.refreshToken,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException({
          statusCode: 401,
          errorCode: 'AUTH_INVALID_TOKEN',
          message: 'Refresh token không hợp lệ',
        });
      }

      // Generate new access token
      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'AUTH_INVALID_TOKEN',
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }
  }

  // ==================== FORGOT PASSWORD ====================
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token with 15 minute expiry
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    await this.usersService.update(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    });

    // Mock email sending - dùng logger thay console.log
    this.logger.log(
      `📧 [MOCK EMAIL] Password Reset - To: ${user.email}, Token: ${resetToken}, Expires: ${expires.toISOString()}`,
      this.context,
    );

    return {
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu',
    };
  }

  // ==================== RESET PASSWORD ====================
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Hash the token to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'AUTH_INVALID_RESET_TOKEN',
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }

    // Check if token is expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'AUTH_RESET_TOKEN_EXPIRED',
        message: 'Token đã hết hạn, vui lòng yêu cầu lại',
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null as any,
      passwordResetExpires: null as any,
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }
}
