import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * JWT Strategy - Xác thực token JWT từ Authorization header
 *
 * Luồng hoạt động:
 * 1. Extract token từ header "Authorization: Bearer <token>"
 * 2. Verify token với JWT_SECRET
 * 3. Nếu hợp lệ, gọi validate() để lấy user từ database
 * 4. Gắn user vào request.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate payload từ token đã được verify
   * @param payload - Chứa sub (userId), email, role từ token
   * @returns User object (không có password) hoặc throw UnauthorizedException
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'AUTH_INVALID_TOKEN',
        message: 'Token không hợp lệ hoặc user không tồn tại',
      });
    }

    // Kiểm tra tài khoản bị khóa
    if (user.status === 'inactive') {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'AUTH_ACCOUNT_LOCKED',
        message: 'Tài khoản đã bị khóa',
      });
    }

    // Return user without password - sẽ được gắn vào request.user
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
