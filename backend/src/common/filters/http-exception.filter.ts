import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '../logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WinstonLoggerService)
    private readonly logger: WinstonLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message: string | string[] = 'Lỗi hệ thống, vui lòng thử lại sau';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as any;

        // Custom error format từ service (có errorCode)
        if (res.errorCode) {
          errorCode = res.errorCode;
          message = res.message;
        }
        // ValidationPipe errors (class-validator)
        else if (Array.isArray(res.message)) {
          errorCode = 'VALIDATION_ERROR';
          message = res.message;
        }
        // Default NestJS format
        else {
          errorCode = this.getDefaultErrorCode(statusCode);
          message = res.message || exception.message;
        }
      } else {
        errorCode = this.getDefaultErrorCode(statusCode);
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log exception: warn cho 4xx, error cho 5xx
    const logMessage = `${request.method} ${request.url} ${statusCode} - ${errorCode}: ${Array.isArray(message) ? message.join(', ') : message}`;

    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(logMessage, stack, 'ExceptionFilter');
    } else {
      this.logger.warn(logMessage, 'ExceptionFilter');
    }

    response.status(statusCode).json({
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getDefaultErrorCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
