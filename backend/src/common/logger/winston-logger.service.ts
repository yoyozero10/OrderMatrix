import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'debug');
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // Format chung: timestamp + level + context + message
    const baseFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
    );

    // Console format: có màu, dễ đọc cho development
    const consoleFormat = winston.format.combine(
      baseFormat,
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, context, stack }) => {
        const ctx = context ? `[${context}]` : '';
        const msg = stack || message;
        return `${timestamp} ${level} ${ctx} ${msg}`;
      }),
    );

    // File format: JSON structured cho production
    const fileFormat = winston.format.combine(
      baseFormat,
      winston.format.json(),
    );

    // Transport: Error log file (daily rotate)
    const errorFileTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '14d',
      format: fileFormat,
    });

    // Transport: Combined log file (daily rotate)
    const combinedFileTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    });

    // Transport: Console
    const consoleTransport = new winston.transports.Console({
      format: consoleFormat,
    });

    this.logger = winston.createLogger({
      level: logLevel,
      transports: [consoleTransport, errorFileTransport, combinedFileTransport],
      // Không thoát khi có uncaughtException
      exitOnError: false,
    });

    // Production: tắt console nếu cần (tuỳ chọn)
    if (isProduction) {
      this.logger.transports[0].level = 'info';
    }
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
