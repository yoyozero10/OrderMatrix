import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    findById: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns sanitized profile data', async () => {
    usersServiceMock.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'hashed',
      refreshToken: 'refresh',
      passwordResetToken: 'reset',
      passwordResetExpires: new Date(),
    });

    await expect(
      controller.getProfile({ user: { id: 'user-1' } }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
    });
  });
});
