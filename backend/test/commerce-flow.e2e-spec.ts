import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { CartController } from '../src/cart/cart.controller';
import { CartService } from '../src/cart/cart.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AdminOrdersController } from '../src/orders/admin-orders.controller';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';

describe('Commerce Flows (e2e-lite)', () => {
  let app: INestApplication<App>;

  const createState = () => ({
    users: [
      {
        id: 'admin-1',
        email: 'admin@test.com',
        password: 'Admin123',
        fullName: 'Admin',
        role: 'admin',
        status: 'active',
      },
    ],
    sessions: new Map<string, { id: string; role: string; email: string }>(),
    carts: new Map<string, any[]>(),
    orders: [] as any[],
    products: [
      {
        id: 'product-1',
        name: 'Mechanical Keyboard',
        price: 250,
        stock: 5,
      },
    ],
  });

  let state = createState();

  const buildCartResponse = (userId: string) => {
    const items = (state.carts.get(userId) || []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        stock: item.product.stock,
        status: 'active',
        primaryImage: null,
        category: null,
      },
      subtotal: item.quantity * item.product.price,
    }));

    return {
      id: `cart-${userId}`,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
  };

  const authService = {
    async register(dto) {
      const existed = state.users.find((user) => user.email === dto.email);
      if (existed) {
        throw new BadRequestException('Email already exists');
      }

      const user = {
        id: `user-${state.users.length}`,
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'customer',
        status: 'active',
      };
      state.users.push(user);
      return {
        message: 'Đăng ký thành công',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
        },
      };
    },
    async login(dto) {
      const user = state.users.find(
        (item) => item.email === dto.email && item.password === dto.password,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = `token-${user.id}`;
      state.sessions.set(accessToken, {
        id: user.id,
        role: user.role,
        email: user.email,
      });

      return {
        accessToken,
        refreshToken: `refresh-${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
        },
      };
    },
    async refreshToken() {
      return { accessToken: 'refreshed-token' };
    },
    async forgotPassword() {
      return { message: 'ok' };
    },
    async resetPassword() {
      return { message: 'ok' };
    },
    async logout(userId: string) {
      for (const [token, session] of state.sessions.entries()) {
        if (session.id === userId) {
          state.sessions.delete(token);
        }
      }
      return { message: 'Đăng xuất thành công' };
    },
  };

  const cartService = {
    async getCart(userId: string) {
      return buildCartResponse(userId);
    },
    async addToCart(userId: string, dto) {
      const product = state.products.find((item) => item.id === dto.productId);
      if (!product || product.stock < dto.quantity) {
        throw new BadRequestException('Out of stock');
      }

      const cart = state.carts.get(userId) || [];
      const existing = cart.find((item) => item.product.id === dto.productId);

      if (existing) {
        if (existing.quantity + dto.quantity > product.stock) {
          throw new BadRequestException('Out of stock');
        }
        existing.quantity += dto.quantity;
      } else {
        cart.push({
          id: `item-${cart.length + 1}`,
          quantity: dto.quantity,
          product,
        });
      }

      state.carts.set(userId, cart);
      return buildCartResponse(userId);
    },
    async updateCartItem() {
      return { message: 'not-used' };
    },
    async removeCartItem() {
      return { message: 'not-used' };
    },
    async clearCart(userId: string) {
      state.carts.set(userId, []);
      return { message: 'Đã xóa toàn bộ giỏ hàng' };
    },
  };

  const formatOrder = (order) => ({
    id: order.id,
    orderCode: order.orderCode,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    items: order.items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });

  const ordersService = {
    async createOrder(userId: string, dto) {
      const cart = state.carts.get(userId) || [];
      if (cart.length === 0) {
        throw new BadRequestException('Cart empty');
      }

      const totalAmount = cart.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0,
      );

      cart.forEach((item) => {
        item.product.stock -= item.quantity;
      });

      const now = new Date('2026-03-10T00:00:00.000Z');
      const order = {
        id: `order-${state.orders.length + 1}`,
        orderCode: `ORD-20260310-${String(state.orders.length + 1).padStart(4, '0')}`,
        userId,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod || 'COD',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        totalAmount,
        items: cart.map((item) => ({
          id: `order-item-${item.id}`,
          productNameSnapshot: item.product.name,
          unitPriceSnapshot: item.product.price,
          quantity: item.quantity,
          subtotal: item.quantity * item.product.price,
          product: {
            id: item.product.id,
            name: item.product.name,
          },
        })),
        createdAt: now,
        updatedAt: now,
      };

      state.orders.push(order);
      state.carts.set(userId, []);
      return formatOrder(order);
    },
    async getMyOrders(userId: string) {
      const orders = state.orders
        .filter((order) => order.userId === userId)
        .map((order) => ({
          id: order.id,
          orderCode: order.orderCode,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }));

      return {
        data: orders,
        meta: {
          page: 1,
          limit: 10,
          total: orders.length,
          totalPages: 1,
        },
      };
    },
    async getOrderById(userId: string, orderId: string) {
      const order = state.orders.find(
        (item) => item.id === orderId && item.userId === userId,
      );
      if (!order) {
        throw new BadRequestException('Order not found');
      }
      return formatOrder(order);
    },
    async cancelOrder(userId: string, orderId: string) {
      const order = state.orders.find(
        (item) => item.id === orderId && item.userId === userId,
      );
      if (!order) {
        throw new BadRequestException('Order not found');
      }
      if (order.orderStatus !== 'pending') {
        throw new BadRequestException('Invalid transition');
      }

      order.items.forEach((item) => {
        const product = state.products.find((p) => p.id === item.product.id);
        if (product) {
          product.stock += item.quantity;
        }
      });

      order.orderStatus = 'cancelled';
      order.updatedAt = new Date('2026-03-10T02:00:00.000Z');
      return formatOrder(order);
    },
    async getAllOrders() {
      return {
        data: state.orders.map((order) => ({
          id: order.id,
          orderCode: order.orderCode,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        })),
        meta: {
          page: 1,
          limit: 10,
          total: state.orders.length,
          totalPages: 1,
        },
      };
    },
    async getAdminOrderById(orderId: string) {
      const order = state.orders.find((item) => item.id === orderId);
      return formatOrder(order);
    },
    async updateOrderStatus(orderId: string, adminId: string, dto) {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) {
        throw new BadRequestException('Order not found');
      }

      order.orderStatus = dto.status;
      order.updatedAt = new Date('2026-03-10T01:00:00.000Z');

      if (dto.status === 'completed' && order.paymentMethod === 'COD') {
        order.paymentStatus = 'paid';
      }

      return {
        ...formatOrder(order),
        updatedBy: adminId,
      };
    },
    async getOrderStats() {
      return { totalOrders: state.orders.length };
    },
  };

  const jwtAuthGuard = {
    canActivate(context) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Unauthorized');
      }

      const token = authHeader.replace('Bearer ', '');
      const session = state.sessions.get(token);

      if (!session) {
        throw new UnauthorizedException('Unauthorized');
      }

      request.user = session;
      return true;
    },
  };

  const rolesGuard = {
    canActivate(context) {
      const request = context.switchToHttp().getRequest();
      if (request.user?.role !== 'admin') {
        throw new ForbiddenException('Forbidden');
      }
      return true;
    },
  };

  beforeEach(async () => {
    state = createState();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AuthController,
        CartController,
        OrdersController,
        AdminOrdersController,
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: CartService, useValue: cartService },
        { provide: OrdersService, useValue: ordersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('runs customer flow: register -> login -> add to cart -> checkout -> get order detail', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'customer@test.com',
        password: 'Secret123',
        fullName: 'Customer Test',
        phone: '0901234567',
      })
      .expect(201);

    expect(registerResponse.body.user.email).toBe('customer@test.com');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Secret123',
      })
      .expect(200);

    const customerToken = loginResponse.body.accessToken;

    const addToCartResponse = await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: 'product-1',
        quantity: 2,
      })
      .expect(201);

    expect(addToCartResponse.body.totalItems).toBe(2);
    expect(addToCartResponse.body.totalAmount).toBe(500);

    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Customer Test',
          phone: '0901234567',
          address: '123 Nguyen Hue',
          city: 'Ho Chi Minh',
        },
        paymentMethod: 'COD',
      })
      .expect(201);

    expect(checkoutResponse.body.orderStatus).toBe('pending');
    expect(checkoutResponse.body.items).toHaveLength(1);

    const orderId = checkoutResponse.body.id;

    const orderDetailResponse = await request(app.getHttpServer())
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(orderDetailResponse.body.id).toBe(orderId);
    expect(orderDetailResponse.body.totalAmount).toBe(500);
  });

  it('runs admin flow: login -> update order status to completed', async () => {
    const customer = await authService.register({
      email: 'customer@test.com',
      password: 'Secret123',
      fullName: 'Customer Test',
      phone: '0901234567',
    });

    await cartService.addToCart(customer.user.id, {
      productId: 'product-1',
      quantity: 1,
    });

    const order = await ordersService.createOrder(customer.user.id, {
      shippingAddress: {
        fullName: 'Customer Test',
        phone: '0901234567',
        address: '123 Nguyen Hue',
        city: 'Ho Chi Minh',
      },
      paymentMethod: 'COD',
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123',
      })
      .expect(200);

    const adminToken = adminLoginResponse.body.accessToken;

    const updateResponse = await request(app.getHttpServer())
      .put(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'completed',
        note: 'Done',
      })
      .expect(200);

    expect(updateResponse.body.orderStatus).toBe('completed');
    expect(updateResponse.body.paymentStatus).toBe('paid');
  });

  it('rejects add to cart when quantity exceeds stock', async () => {
    await authService.register({
      email: 'customer@test.com',
      password: 'Secret123',
      fullName: 'Customer Test',
      phone: '0901234567',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Secret123',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        productId: 'product-1',
        quantity: 6,
      })
      .expect(400);
  });

  it('cancels a pending order and restores product stock', async () => {
    const customer = await authService.register({
      email: 'customer@test.com',
      password: 'Secret123',
      fullName: 'Customer Test',
      phone: '0901234567',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Secret123',
      })
      .expect(200);

    const customerToken = loginResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: 'product-1',
        quantity: 2,
      })
      .expect(201);

    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Customer Test',
          phone: '0901234567',
          address: '123 Nguyen Hue',
          city: 'Ho Chi Minh',
        },
        paymentMethod: 'COD',
      })
      .expect(201);

    expect(state.products[0].stock).toBe(3);

    const cancelResponse = await request(app.getHttpServer())
      .put(`/api/orders/${checkoutResponse.body.id}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(cancelResponse.body.orderStatus).toBe('cancelled');
    expect(state.products[0].stock).toBe(5);
    expect(customer.user.id).toBeDefined();
  });

  it('blocks non-admin users from admin order status endpoint', async () => {
    const customer = await authService.register({
      email: 'customer@test.com',
      password: 'Secret123',
      fullName: 'Customer Test',
      phone: '0901234567',
    });

    await cartService.addToCart(customer.user.id, {
      productId: 'product-1',
      quantity: 1,
    });

    const order = await ordersService.createOrder(customer.user.id, {
      shippingAddress: {
        fullName: 'Customer Test',
        phone: '0901234567',
        address: '123 Nguyen Hue',
        city: 'Ho Chi Minh',
      },
      paymentMethod: 'COD',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Secret123',
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        status: 'completed',
      })
      .expect(403);
  });
});
