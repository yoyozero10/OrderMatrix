import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CartService } from './cart.service';
import { Cart, CartItem } from './entities';
import { ProductVariant } from '../products/entities/product-variant.entity';

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

  const variantRepositoryMock = {
    findOne: jest.fn(),
  };

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
          provide: getRepositoryToken(ProductVariant),
          useValue: variantRepositoryMock,
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
          variant: {
            id: 'var-1',
            sku: 'KB-01',
            price: 150,
            stock: 10,
            status: 'active',
            product: {
              id: 'product-1',
              name: 'Keyboard',
              images: [{ imageUrl: 'primary.jpg', isPrimary: true }],
              category: { id: 'cat-1', name: 'Accessories' },
            },
            optionValues: [],
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
          variant: {
            id: 'var-1',
            sku: 'KB-01',
            product: {
              name: 'Keyboard',
              primaryImage: 'primary.jpg',
            },
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
          id: 'var-1',
          stock: 5,
          status: 'active',
          product: { id: 'product-1', name: 'Keyboard' },
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
      service.addToCart('user-1', { variantId: 'var-1', quantity: 2 }),
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
        variant: { id: 'var-1', stock: 10, status: 'active' },
      }),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.updateCartItem('user-1', 'item-1', { quantity: 4 }),
    ).rejects.toThrow(ForbiddenException);
  });
});
