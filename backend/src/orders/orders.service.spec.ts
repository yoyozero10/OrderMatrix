import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderItem, OrderStatusHistory } from './entities';
import { Cart } from '../cart/entities';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { WinstonLoggerService } from '../common/logger';

describe('OrdersService', () => {
  let service: OrdersService;

  const orderRepositoryMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const orderItemRepositoryMock = {};
  const orderStatusHistoryRepositoryMock = {
    find: jest.fn(),
  };
  const cartRepositoryMock = {};
  const productRepositoryMock = {};
  const userRepositoryMock = {};

  const dataSourceMock = {
    transaction: jest.fn(),
  };

  const loggerMock = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepositoryMock,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemRepositoryMock,
        },
        {
          provide: getRepositoryToken(OrderStatusHistory),
          useValue: orderStatusHistoryRepositoryMock,
        },
        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepositoryMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: WinstonLoggerService,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  it('creates an order from the cart and returns a formatted response', async () => {
    orderRepositoryMock.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    const updateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const createdOrder = {
      id: 'order-1',
      orderCode: 'ORD-20260310-0001',
      totalAmount: 200,
      shippingAddress: { fullName: 'Test User' },
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      items: [
        {
          id: 'order-item-1',
          productNameSnapshot: 'Mouse',
          unitPriceSnapshot: 200,
          quantity: 1,
          subtotal: 200,
          product: { id: 'product-1', name: 'Mouse' },
        },
      ],
      createdAt: new Date('2026-03-10T00:00:00.000Z'),
      updatedAt: new Date('2026-03-10T00:00:00.000Z'),
    };

    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'cart-1',
          items: [
            {
              id: 'cart-item-1',
              quantity: 1,
              product: { id: 'product-1', name: 'Mouse' },
            },
          ],
        })
        .mockResolvedValueOnce({
          id: 'product-1',
          name: 'Mouse',
          price: 200,
          stock: 5,
        })
        .mockResolvedValueOnce(createdOrder),
      createQueryBuilder: jest.fn(() => updateQueryBuilder),
      create: jest.fn((entity, data) => data),
      save: jest
        .fn()
        .mockResolvedValueOnce({ id: 'order-1' })
        .mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    const result = await service.createOrder('user-1', {
      shippingAddress: { fullName: 'Test User' },
      paymentMethod: 'COD',
    });

    expect(result).toMatchObject({
      id: 'order-1',
      orderCode: expect.stringMatching(/^ORD-\d{8}-0001$/),
      totalAmount: 200,
      orderStatus: 'pending',
      items: [
        {
          productNameSnapshot: 'Mouse',
          quantity: 1,
          subtotal: 200,
        },
      ],
    });
    expect(manager.remove).toHaveBeenCalled();
    expect(loggerMock.log).toHaveBeenCalled();
  });

  it('cancels a pending order and restores stock', async () => {
    const updateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const pendingOrder = {
      id: 'order-1',
      orderCode: 'ORD-20260310-0001',
      user: { id: 'user-1' },
      shippingAddress: { fullName: 'Test User' },
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      items: [
        {
          quantity: 2,
          product: { id: 'product-1', name: 'Mouse' },
        },
      ],
      createdAt: new Date('2026-03-10T00:00:00.000Z'),
      updatedAt: new Date('2026-03-10T00:00:00.000Z'),
    };

    const cancelledOrder = {
      ...pendingOrder,
      orderStatus: 'cancelled',
    };

    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(pendingOrder)
        .mockResolvedValueOnce(cancelledOrder),
      createQueryBuilder: jest.fn(() => updateQueryBuilder),
      create: jest.fn((entity, data) => data),
      save: jest.fn().mockResolvedValue(undefined),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(service.cancelOrder('user-1', 'order-1')).resolves.toMatchObject(
      {
        id: 'order-1',
        orderStatus: 'cancelled',
      },
    );

    expect(updateQueryBuilder.execute).toHaveBeenCalled();
  });

  it('rejects invalid admin status transitions', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'order-1',
        orderCode: 'ORD-20260310-0001',
        user: { id: 'user-1' },
        orderStatus: 'completed',
        paymentMethod: 'COD',
        items: [],
      }),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.updateOrderStatus('order-1', 'admin-1', {
        status: 'processing',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
