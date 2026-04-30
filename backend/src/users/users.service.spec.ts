import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Order } from '../orders/entities/order.entity';

describe('UsersService', () => {
  let service: UsersService;

  const userRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const orderRepositoryMock = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByEmail delegates to the user repository', async () => {
    const user = { id: 'user-1', email: 'user@example.com' };
    userRepositoryMock.findOne.mockResolvedValue(user);

    await expect(service.findByEmail('user@example.com')).resolves.toEqual(user);
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });
});
