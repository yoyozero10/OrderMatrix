import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates login to AuthService', async () => {
    const dto = { email: 'user@example.com', password: 'Secret123' };
    authServiceMock.login.mockResolvedValue({ accessToken: 'token' });

    await expect(controller.login(dto)).resolves.toEqual({
      accessToken: 'token',
    });
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });
});
