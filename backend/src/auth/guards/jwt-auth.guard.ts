import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard - Bảo vệ routes yêu cầu đăng nhập
 *
 * Sử dụng:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user;
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override để custom error message
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'AUTH_UNAUTHORIZED',
        message: 'Bạn cần đăng nhập để truy cập tài nguyên này',
      });
    }
    return user;
  }
}
