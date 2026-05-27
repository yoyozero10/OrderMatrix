import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { createConnection } from 'mysql2/promise';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Product } from '../src/products/entities/product.entity';
import { Cart } from '../src/cart/entities/cart.entity';
import { CartItem } from '../src/cart/entities/cart-item.entity';
import { Order } from '../src/orders/entities/order.entity';

describe('Cart + Orders Integration (MySQL)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let productRepository: Repository<Product>;
  let cartRepository: Repository<Cart>;
  let cartItemRepository: Repository<CartItem>;
  let orderRepository: Repository<Order>;
  let productId: string;

  const TEST_DB = 'ecommerce_test_db';
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = Number(process.env.DB_PORT || 3307);
  const DB_USERNAME = process.env.DB_USERNAME || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || 'daithang';

  const ensureTestDatabase = async (): Promise<void> => {
    const conn = await createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      multipleStatements: true,
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\``);
    await conn.end();
  };

  const truncateAllTables = async (): Promise<void> => {
    const tables = await dataSource.query(
      `
      SELECT table_name AS tableName
      FROM information_schema.tables
      WHERE table_schema = ?
      `,
      [TEST_DB],
    );

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const row of tables) {
      await dataSource.query(`TRUNCATE TABLE \`${row.tableName}\``);
    }
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  };

  const seedCatalog = async (): Promise<void> => {
    const category = await categoryRepository.save(
      categoryRepository.create({
        name: 'Integration Category',
        description: 'category for integration tests',
      }),
    );

    const product = await productRepository.save(
      productRepository.create({
        name: 'Integration Product',
        description: 'product for integration tests',
        price: 100,
        stock: 5,
        status: 'active',
        category,
      }),
    );
    productId = product.id;
  };

  const seedAdmin = async (): Promise<void> => {
    const password = await bcrypt.hash('Admin123', 10);
    await userRepository.save(
      userRepository.create({
        email: 'admin.integration@test.com',
        password,
        fullName: 'Integration Admin',
        role: 'admin',
        status: 'active',
      }),
    );
  };

  const registerCustomer = async (
    email: string,
    password = 'Secret123',
  ): Promise<void> => {
    await request(app.getHttpServer()).post('/api/auth/register').send({
      email,
      password,
      fullName: 'Integration Customer',
      phone: '0900000000',
    });
  };

  const loginAndGetToken = async (
    email: string,
    password: string,
  ): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken as string;
  };

  beforeAll(async () => {
    await ensureTestDatabase();

    process.env.DB_HOST = DB_HOST;
    process.env.DB_PORT = String(DB_PORT);
    process.env.DB_USERNAME = DB_USERNAME;
    process.env.DB_PASSWORD = DB_PASSWORD;
    process.env.DB_DATABASE = TEST_DB;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'integration-secret-change-me';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    dataSource = app.get(DataSource);
    userRepository = app.get(getRepositoryToken(User));
    categoryRepository = app.get(getRepositoryToken(Category));
    productRepository = app.get(getRepositoryToken(Product));
    cartRepository = app.get(getRepositoryToken(Cart));
    cartItemRepository = app.get(getRepositoryToken(CartItem));
    orderRepository = app.get(getRepositoryToken(Order));
  });

  beforeEach(async () => {
    await truncateAllTables();
    await seedAdmin();
    await seedCatalog();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> add to cart -> checkout decrements stock and clears cart', async () => {
    await registerCustomer('customer.flow@test.com');
    const token = await loginAndGetToken('customer.flow@test.com', 'Secret123');

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 2,
      })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: 'Integration Customer',
          phone: '0900000000',
          address: '123 Integration Street',
          city: 'HCM',
        },
        paymentMethod: 'COD',
      })
      .expect(201);

    expect(checkout.body.orderStatus).toBe('pending');
    expect(checkout.body.items).toHaveLength(1);

    const product = await productRepository.findOne({ where: { id: productId } });
    expect(product?.stock).toBe(3);

    const user = await userRepository.findOne({
      where: { email: 'customer.flow@test.com' },
    });
    const cart = await cartRepository.findOne({
      where: { user: { id: user!.id } },
      relations: ['items'],
    });
    expect(cart?.items?.length || 0).toBe(0);
  });

  it('cancel order restores stock', async () => {
    await registerCustomer('customer.cancel@test.com');
    const token = await loginAndGetToken(
      'customer.cancel@test.com',
      'Secret123',
    );

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 2,
      })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: 'Integration Customer',
          phone: '0900000000',
          address: '123 Integration Street',
          city: 'HCM',
        },
        paymentMethod: 'COD',
      })
      .expect(201);

    let product = await productRepository.findOne({ where: { id: productId } });
    expect(product?.stock).toBe(3);

    await request(app.getHttpServer())
      .put(`/api/orders/${checkout.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    product = await productRepository.findOne({ where: { id: productId } });
    expect(product?.stock).toBe(5);
  });

  it('rejects add to cart when quantity exceeds stock', async () => {
    await registerCustomer('customer.stock@test.com');
    const token = await loginAndGetToken(
      'customer.stock@test.com',
      'Secret123',
    );

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 999,
      })
      .expect(400);
  });

  it('blocks non-admin users from admin order status update', async () => {
    await registerCustomer('customer.role@test.com');
    const customerToken = await loginAndGetToken(
      'customer.role@test.com',
      'Secret123',
    );

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId,
        quantity: 1,
      })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Integration Customer',
          phone: '0900000000',
          address: '123 Integration Street',
          city: 'HCM',
        },
        paymentMethod: 'COD',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/api/admin/orders/${checkout.body.id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'completed', note: 'forbidden test' })
      .expect(403);
  });

  it('allows admin to update order status to completed and marks payment paid', async () => {
    await registerCustomer('customer.adminflow@test.com');
    const customerToken = await loginAndGetToken(
      'customer.adminflow@test.com',
      'Secret123',
    );

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId,
        quantity: 1,
      })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Integration Customer',
          phone: '0900000000',
          address: '123 Integration Street',
          city: 'HCM',
        },
        paymentMethod: 'COD',
      })
      .expect(201);

    const adminToken = await loginAndGetToken(
      'admin.integration@test.com',
      'Admin123',
    );

    await request(app.getHttpServer())
      .put(`/api/admin/orders/${checkout.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing', note: 'moved to processing' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/admin/orders/${checkout.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipping', note: 'moved to shipping' })
      .expect(200);

    const update = await request(app.getHttpServer())
      .put(`/api/admin/orders/${checkout.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed', note: 'completed by integration test' })
      .expect(200);

    expect(update.body.orderStatus).toBe('completed');
    expect(update.body.paymentStatus).toBe('paid');

    const order = await orderRepository.findOne({
      where: { id: checkout.body.id },
    });
    expect(order?.orderStatus).toBe('completed');
    expect(order?.paymentStatus).toBe('paid');
  });
});
