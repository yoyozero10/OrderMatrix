import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CartService } from './cart.service';
import { Cart, CartItem } from './entities';
import { Product } from '../products/entities/product.entity';

describe('CartService', () => {
  let service: CartService;

  const cartRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const cartItemRepositoryMock = {
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const productRepositoryMock = {};

  const dataSourceMock = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepositoryMock,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: cartItemRepositoryMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  it('returns cart totals and primary image from getCart', async () => {
    cartRepositoryMock.findOne.mockResolvedValue({
      id: 'cart-1',
      createdAt: new Date('2026-03-10T00:00:00.000Z'),
      updatedAt: new Date('2026-03-10T00:00:00.000Z'),
      items: [
        {
          id: 'item-1',
          quantity: 2,
          product: {
            id: 'product-1',
            name: 'Keyboard',
            price: 150,
            stock: 10,
            status: 'active',
            images: [{ imageUrl: 'primary.jpg', isPrimary: true }],
            category: { id: 'cat-1', name: 'Accessories' },
          },
        },
      ],
    });

    await expect(service.getCart('user-1')).resolves.toMatchObject({
      id: 'cart-1',
      totalItems: 2,
      totalAmount: 300,
      items: [
        {
          id: 'item-1',
          subtotal: 300,
          product: {
            id: 'product-1',
            primaryImage: 'primary.jpg',
            category: { id: 'cat-1', name: 'Accessories' },
          },
        },
      ],
    });
  });

  it('increments quantity when adding an existing cart item', async () => {
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'product-1',
          stock: 5,
        })
        .mockResolvedValueOnce({
          id: 'cart-1',
          items: [],
        })
        .mockResolvedValueOnce({
          id: 'item-1',
          quantity: 1,
        }),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'getCart').mockResolvedValue({
      id: 'cart-1',
      items: [],
      totalItems: 3,
      totalAmount: 450,
    });

    await expect(
      service.addToCart('user-1', { productId: 'product-1', quantity: 2 }),
    ).resolves.toMatchObject({
      id: 'cart-1',
      totalItems: 3,
    });

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-1',
        quantity: 3,
      }),
    );
  });

  it('rejects updateCartItem when the cart belongs to another user', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'item-1',
        quantity: 1,
        cart: { user: { id: 'other-user' } },
        product: { id: 'product-1' },
      }),
      save: jest.fn(),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.updateCartItem('user-1', 'item-1', { quantity: 2 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
