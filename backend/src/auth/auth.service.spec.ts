import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { WinstonLoggerService } from '../common/logger';

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByPasswordResetToken: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const loggerMock = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: WinstonLoggerService,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs out by clearing the stored refresh token', async () => {
    usersServiceMock.update.mockResolvedValue({ id: 'user-1' });

    await expect(service.logout('user-1')).resolves.toEqual({
      message: 'Đăng xuất thành công',
    });
    expect(usersServiceMock.update).toHaveBeenCalledWith('user-1', {
      refreshToken: null,
    });
  });
});
