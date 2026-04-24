# BACKEND TODO LIST - NestJS API Implementation

**Dự án:** Website Đặt Hàng và Quản Lý Đơn Hàng  
**Framework:** NestJS 10 + TypeORM + MySQL  
**Thời gian:** 3 tuần (Tuần 3-5 của dự án tổng thể)  
**Tổng số APIs:** 37 endpoints (27 MVP + 10 Optional)

---

## 📋 OVERVIEW

### Phân bổ APIs theo module:
- ✅ **Authentication:** 6 APIs (2 MVP + 4 Optional)
- ✅ **Users:** 3 APIs (3 MVP)
- ✅ **Products (Public):** 2 APIs (2 MVP)
- ✅ **Categories (Public):** 1 API (1 MVP)
- ✅ **Cart:** 5 APIs (5 MVP)
- ✅ **Orders (Customer):** 4 APIs (3 MVP + 1 Optional)
- ✅ **Admin - Products:** 5 APIs (3 MVP + 2 Optional)
- ✅ **Admin - Categories:** 3 APIs (3 MVP)
- ✅ **Admin - Orders:** 4 APIs (4 MVP)
- ✅ **Admin - Users:** 4 APIs (4 MVP)

### Ưu tiên:
1. **Week 1:** Setup + Auth + Users + Products/Categories (Public)
2. **Week 2:** Cart + Orders (Customer)
3. **Week 3:** Admin modules + Testing + Refinement

---

## 🗓️ TUẦN 1: SETUP + AUTH + BASIC MODULES

### NGÀY 1: Project Setup & Database

#### Morning (3h)
- [ ] **Setup NestJS Project**
  ```bash
  npm i -g @nestjs/cli
  nest new backend
  cd backend
  ```

- [ ] **Install Dependencies**
  ```bash
  # Database
  npm install @nestjs/typeorm typeorm mysql2
  
  # Authentication
  npm install @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
  npm install -D @types/bcrypt @types/passport-jwt
  
  # Validation
  npm install class-validator class-transformer
  
  # Config
  npm install @nestjs/config
  
  # Security
  npm install helmet
  ```

- [ ] **Create `.env` file**
  ```env
  # Database
  DB_HOST=localhost
  DB_PORT=3306
  DB_USERNAME=root
  DB_PASSWORD=your_password
  DB_DATABASE=ecommerce_db
  
  # JWT
  JWT_SECRET=your-super-secret-key-change-in-production
  JWT_EXPIRES_IN=30m
  
  # App
  PORT=3001
  ```

#### Afternoon (3h)
- [ ] **Setup Database Connection** (`app.module.ts`)
  ```typescript
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true, // ONLY for development
  })
  ```

- [ ] **Create Folder Structure**
  ```
  src/
  ├── auth/
  ├── users/
  ├── products/
  ├── categories/
  ├── cart/
  ├── orders/
  ├── common/
  │   ├── decorators/
  │   ├── guards/
  │   ├── filters/
  │   └── interceptors/
  └── database/
      └── seeds/
  ```

- [ ] **Create Base Entity** (`common/entities/base.entity.ts`)
  ```typescript
  export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```

---

### NGÀY 2-3: Authentication Module (6 APIs)

#### NGÀY 2: Core Auth (2 MVP APIs)

**Morning: User Entity & Auth Setup**
- [ ] **Create User Entity** (`users/entities/user.entity.ts`)
  ```typescript
  @Entity('users')
  export class User extends BaseEntity {
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column()
    fullName: string;
  
    @Column({ nullable: true })
    phone: string;
  
    @Column({ nullable: true })
    avatar: string;
  
    @Column({ type: 'enum', enum: ['customer', 'admin'], default: 'customer' })
    role: string;
  
    @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
    status: string;
  }
  ```

- [ ] **Generate Auth Module**
  ```bash
  nest g module auth
  nest g service auth
  nest g controller auth
  ```

- [ ] **Generate Users Module**
  ```bash
  nest g module users
  nest g service users
  nest g controller users
  ```

**Afternoon: Register & Login**
- [ ] **✅ API 1/37: POST /auth/register [MVP]**
  - [ ] Create `RegisterDto` with validation
  - [ ] Hash password with bcrypt (salt rounds: 10)
  - [ ] Check email exists
  - [ ] Save user to database
  - [ ] Return user (exclude password)
  - [ ] Test with Postman

- [ ] **✅ API 2/37: POST /auth/login [MVP]**
  - [ ] Create `LoginDto`
  - [ ] Validate credentials
  - [ ] Generate JWT token
  - [ ] Return `{ accessToken, user }`
  - [ ] Test with Postman

#### NGÀY 3: JWT Strategy & Optional Auth APIs

**Morning: JWT Setup**
- [ ] **Create JWT Strategy** (`auth/strategies/jwt.strategy.ts`)
  ```typescript
  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      });
    }
  
    async validate(payload: any) {
      return this.usersService.findById(payload.sub);
    }
  }
  ```

- [ ] **Create JWT Guard** (`auth/guards/jwt-auth.guard.ts`)
- [ ] **Create Roles Guard** (`common/guards/roles.guard.ts`)
- [ ] **Create Roles Decorator** (`common/decorators/roles.decorator.ts`)

**Afternoon: Optional Auth APIs**
- [ ] **✅ API 3/37: POST /auth/logout [Optional]**
  - [ ] Simple endpoint (token blacklist optional)
  - [ ] Return success message

- [ ] **✅ API 4/37: POST /auth/refresh [Optional]**
  - [ ] Implement refresh token logic
  - [ ] Store refresh tokens in DB (optional table)
  - [ ] Return new access token

- [ ] **✅ API 5/37: POST /auth/forgot-password [Optional]**
  - [ ] Generate reset token
  - [ ] Save to DB with expiry (15 minutes)
  - [ ] Mock email sending (console.log)

- [ ] **✅ API 6/37: POST /auth/reset-password [Optional]**
  - [ ] Validate reset token
  - [ ] Update password
  - [ ] Invalidate token

---

### NGÀY 4: Users Module (3 APIs)

**Morning: User Profile APIs**
- [ ] **✅ API 7/37: GET /users/me [MVP]**
  - [ ] Use `@UseGuards(JwtAuthGuard)`
  - [ ] Get user from request
  - [ ] Return user profile (exclude password)
  - [ ] Test with Bearer token

- [ ] **✅ API 8/37: PUT /users/me [MVP]**
  - [ ] Create `UpdateProfileDto`
  - [ ] Allow update: fullName, phone, avatar
  - [ ] Don't allow update: email, role, status
  - [ ] Return updated user

**Afternoon: Change Password**
- [ ] **✅ API 9/37: PUT /users/me/password [MVP]**
  - [ ] Create `ChangePasswordDto`
  - [ ] Validate old password
  - [ ] Hash new password
  - [ ] Update password
  - [ ] Return success message

---

### NGÀY 5: Categories & Products Entities

**Morning: Create Entities**
- [ ] **Create Category Entity** (`categories/entities/category.entity.ts`)
  ```typescript
  @Entity('categories')
  export class Category extends BaseEntity {
    @Column()
    name: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ nullable: true })
    image: string;
  
    @OneToMany(() => Product, product => product.category)
    products: Product[];
  }
  ```

- [ ] **Create Product Entity** (`products/entities/product.entity.ts`)
  ```typescript
  @Entity('products')
  export class Product extends BaseEntity {
    @Column()
    name: string;
  
    @Column('text')
    description: string;
  
    @Column('decimal', { precision: 10, scale: 2 })
    price: number;
  
    @Column({ default: 0 })
    stock: number;
  
    @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
    status: string;
  
    @ManyToOne(() => Category, category => category.products)
    category: Category;
  
    @OneToMany(() => ProductImage, image => image.product, { cascade: true })
    images: ProductImage[];
  }
  ```

- [ ] **Create ProductImage Entity** (`products/entities/product-image.entity.ts`)
  ```typescript
  @Entity('product_images')
  export class ProductImage extends BaseEntity {
    @Column()
    imageUrl: string;
  
    @Column({ default: false })
    isPrimary: boolean;
  
    @Column({ default: 0 })
    displayOrder: number;
  
    @ManyToOne(() => Product, product => product.images, { onDelete: 'CASCADE' })
    product: Product;
  }
  ```

**Afternoon: Seed Data**
- [ ] **Create Seed Service** (`database/seeds/seed.service.ts`)
  - [ ] Seed 5 categories
  - [ ] Seed 20-30 products with images
  - [ ] Run seed: `npm run seed`

---

### NGÀY 6-7: Products & Categories Public APIs

#### NGÀY 6: Categories API

- [ ] **Generate Modules**
  ```bash
  nest g module categories
  nest g service categories
  nest g controller categories
  ```

- [ ] **✅ API 10/37: GET /categories [MVP]**
  - [ ] Return all categories
  - [ ] Include product count (optional)
  - [ ] Order by name
  - [ ] Test with Postman

#### NGÀY 7: Products Public APIs

- [ ] **Generate Modules**
  ```bash
  nest g module products
  nest g service products
  nest g controller products
  ```

**Morning: Product List**
- [ ] **✅ API 11/37: GET /products [MVP]**
  - [ ] Implement pagination (page, limit)
  - [ ] Implement search (name, description)
  - [ ] Implement filters (category, minPrice, maxPrice)
  - [ ] Implement sorting (price_asc, price_desc, newest)
  - [ ] Return with meta (total, totalPages)
  - [ ] Include category and primary image
  - [ ] Test all query combinations

**Afternoon: Product Detail**
- [ ] **✅ API 12/37: GET /products/:id [MVP]**
  - [ ] Return product with all images
  - [ ] Include category details
  - [ ] Handle not found (404)
  - [ ] Test with valid/invalid IDs

---

## 🗓️ TUẦN 2: CART + ORDERS

### NGÀY 8-9: Cart Module (5 APIs)

#### NGÀY 8: Cart Entities & View Cart

**Morning: Create Entities**
- [ ] **Create Cart Entity** (`cart/entities/cart.entity.ts`)
  ```typescript
  @Entity('carts')
  export class Cart extends BaseEntity {
    @OneToOne(() => User)
    @JoinColumn()
    user: User;
  
    @OneToMany(() => CartItem, item => item.cart, { cascade: true })
    items: CartItem[];
  }
  ```

- [ ] **Create CartItem Entity** (`cart/entities/cart-item.entity.ts`)
  ```typescript
  @Entity('cart_items')
  export class CartItem extends BaseEntity {
    @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
    cart: Cart;
  
    @ManyToOne(() => Product)
    product: Product;
  
    @Column()
    quantity: number;
  }
  ```

- [ ] **Generate Cart Module**
  ```bash
  nest g module cart
  nest g service cart
  nest g controller cart
  ```

**Afternoon: View Cart API**
- [ ] **✅ API 13/37: GET /cart [MVP]**
  - [ ] Get or create cart for user
  - [ ] Load cart items with product details
  - [ ] Calculate subtotal for each item
  - [ ] Calculate totalItems and totalAmount
  - [ ] Return cart with computed fields

#### NGÀY 9: Cart Mutations

**Morning: Add & Update**
- [ ] **✅ API 14/37: POST /cart/items [MVP]**
  - [ ] Create `AddToCartDto` (productId, quantity)
  - [ ] Validate product exists
  - [ ] Check stock availability
  - [ ] If item exists, update quantity
  - [ ] If new item, create cart item
  - [ ] Return updated cart
  - [ ] Error: `CART_OUT_OF_STOCK` if stock insufficient

- [ ] **✅ API 15/37: PUT /cart/items/:id [MVP]**
  - [ ] Create `UpdateCartItemDto` (quantity)
  - [ ] Validate cart item belongs to user
  - [ ] Check stock availability
  - [ ] Update quantity
  - [ ] Return updated cart

**Afternoon: Delete**
- [ ] **✅ API 16/37: DELETE /cart/items/:id [MVP]**
  - [ ] Validate cart item belongs to user
  - [ ] Delete cart item
  - [ ] Return updated cart

- [ ] **✅ API 17/37: DELETE /cart [MVP]**
  - [ ] Delete all cart items
  - [ ] Return success message

---

### NGÀY 10-12: Orders Module (8 APIs)

#### NGÀY 10: Order Entities

**Morning: Create Entities**
- [ ] **Create Order Entity** (`orders/entities/order.entity.ts`)
  ```typescript
  @Entity('orders')
  export class Order extends BaseEntity {
    @Column({ unique: true })
    orderCode: string;
  
    @ManyToOne(() => User)
    user: User;
  
    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];
  
    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;
  
    @Column('json')
    shippingAddress: object;
  
    @Column({ type: 'enum', enum: ['COD', 'MOCK'] })
    paymentMethod: string;
  
    @Column({ type: 'enum', enum: ['pending', 'paid', 'failed'], default: 'pending' })
    paymentStatus: string;
  
    @Column({ type: 'enum', enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'], default: 'pending' })
    orderStatus: string;
  }
  ```

- [ ] **Create OrderItem Entity** (`orders/entities/order-item.entity.ts`)
  ```typescript
  @Entity('order_items')
  export class OrderItem extends BaseEntity {
    @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
    order: Order;
  
    @ManyToOne(() => Product)
    product: Product;
  
    @Column()
    productNameSnapshot: string;
  
    @Column('decimal', { precision: 10, scale: 2 })
    unitPriceSnapshot: number;
  
    @Column()
    quantity: number;
  
    @Column('decimal', { precision: 10, scale: 2 })
    subtotal: number;
  }
  ```

- [ ] **Create OrderStatusHistory Entity [Optional]** (`orders/entities/order-status-history.entity.ts`)

**Afternoon: Generate Module**
- [ ] **Generate Orders Module**
  ```bash
  nest g module orders
  nest g service orders
  nest g controller orders
  ```

- [ ] **Create State Machine Validator**
  ```typescript
  const ALLOWED_TRANSITIONS = {
    pending: ['processing', 'cancelled'],
    processing: ['shipping', 'cancelled'],
    shipping: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  ```

#### NGÀY 11: Create Order (Critical!)

**Full Day: Implement Checkout**
- [ ] **✅ API 18/37: POST /orders [MVP]** ⭐ QUAN TRỌNG
  - [ ] Create `CreateOrderDto` (shippingAddress, paymentMethod)
  - [ ] Validate cart not empty
  - [ ] **Start Database Transaction**
  - [ ] For each cart item:
    - [ ] Check stock with `FOR UPDATE` lock
    - [ ] If stock < quantity → Rollback, return `CART_OUT_OF_STOCK`
  - [ ] Generate order code: `ORD-YYYYMMDD-XXXX`
  - [ ] Create order
  - [ ] Create order items with snapshots:
    - [ ] productNameSnapshot = product.name
    - [ ] unitPriceSnapshot = product.price
    - [ ] subtotal = unitPriceSnapshot * quantity
  - [ ] Update stock (atomic): `UPDATE products SET stock = stock - quantity WHERE id = ?`
  - [ ] Create status history [Optional]
  - [ ] Clear cart
  - [ ] **Commit Transaction**
  - [ ] Return created order
  - [ ] Test concurrent requests (oversell scenario)

#### NGÀY 12: Order Queries & Cancel

**Morning: Order List & Detail**
- [ ] **✅ API 19/37: GET /orders [MVP]**
  - [ ] Filter by user (current user only)
  - [ ] Implement pagination
  - [ ] Filter by status (optional)
  - [ ] Order by createdAt DESC
  - [ ] Return summary (no items)

- [ ] **✅ API 20/37: GET /orders/:id [MVP]**
  - [ ] Validate order belongs to user
  - [ ] Return full order with items
  - [ ] Include status history [Optional]
  - [ ] Error: `ORDER_NOT_FOUND` or `FORBIDDEN_RESOURCE`

**Afternoon: Cancel Order**
- [ ] **✅ API 21/37: PUT /orders/:id/cancel [Optional]**
  - [ ] Validate order belongs to user
  - [ ] Check status = 'pending'
  - [ ] **Start Transaction**
  - [ ] Update status to 'cancelled'
  - [ ] Restore stock (atomic update)
  - [ ] Create status history [Optional]
  - [ ] **Commit Transaction**
  - [ ] Error: `ORDER_INVALID_TRANSITION` if not pending

---

## 🗓️ TUẦN 3: ADMIN MODULES + TESTING

### NGÀY 13-14: Admin Products (5 APIs)

#### NGÀY 13: CRUD Products

**Morning: Create & Update**
- [ ] **✅ API 22/37: POST /admin/products [MVP]**
  - [ ] Use `@Roles('admin')` guard
  - [ ] Create `CreateProductDto`
  - [ ] Validate category exists
  - [ ] Create product
  - [ ] Return created product

- [ ] **✅ API 23/37: PUT /admin/products/:id [MVP]**
  - [ ] Create `UpdateProductDto` (all fields optional)
  - [ ] Update product
  - [ ] Return updated product

**Afternoon: Delete & Images**
- [ ] **✅ API 24/37: DELETE /admin/products/:id [MVP]**
  - [ ] Soft delete or hard delete
  - [ ] Images cascade delete (ON DELETE CASCADE)
  - [ ] Return success message

- [ ] **✅ API 25/37: POST /admin/products/:id/images [Optional]**
  - [ ] Upload image (Multer or mock)
  - [ ] Create ProductImage record
  - [ ] Set isPrimary if first image
  - [ ] Return updated product

- [ ] **✅ API 26/37: DELETE /admin/products/:id/images/:imageId [Optional]**
  - [ ] Delete image record
  - [ ] If was primary, set another as primary
  - [ ] Return updated product

#### NGÀY 14: Admin Categories (3 APIs)

- [ ] **✅ API 27/37: POST /admin/categories [MVP]**
  - [ ] Create `CreateCategoryDto`
  - [ ] Create category
  - [ ] Return created category

- [ ] **✅ API 28/37: PUT /admin/categories/:id [MVP]**
  - [ ] Update category
  - [ ] Return updated category

- [ ] **✅ API 29/37: DELETE /admin/categories/:id [MVP]**
  - [ ] Check if category has products
  - [ ] If has products, prevent delete or cascade
  - [ ] Delete category

---

### NGÀY 15-16: Admin Orders & Users

#### NGÀY 15: Admin Orders (4 APIs)

**Morning: Order List & Detail**
- [ ] **✅ API 30/37: GET /admin/orders [MVP]**
  - [ ] Return ALL orders (not filtered by user)
  - [ ] Implement pagination
  - [ ] Filter by status
  - [ ] Search by order code or customer name
  - [ ] Order by createdAt DESC

- [ ] **✅ API 31/37: GET /admin/orders/:id [MVP]**
  - [ ] Return full order details
  - [ ] Include customer info
  - [ ] Include status history

**Afternoon: Update Status & Stats**
- [ ] **✅ API 32/37: PUT /admin/orders/:id/status [MVP]**
  - [ ] Create `UpdateOrderStatusDto` (status, note)
  - [ ] Validate state transition using ALLOWED_TRANSITIONS
  - [ ] Update order status
  - [ ] Create status history with admin ID and note
  - [ ] Error: `ORDER_INVALID_TRANSITION` if invalid

- [ ] **✅ API 33/37: GET /admin/orders/stats [MVP]**
  - [ ] Calculate totalOrders
  - [ ] Calculate totalRevenue (completed orders only)
  - [ ] Count ordersByStatus
  - [ ] Calculate revenueByMonth (last 6 months)
  - [ ] Return stats object

#### NGÀY 16: Admin Users (4 APIs)

**Morning: User List & Detail**
- [ ] **✅ API 34/37: GET /admin/users [MVP]**
  - [ ] Return all users
  - [ ] Implement pagination
  - [ ] Search by email or name
  - [ ] Filter by role
  - [ ] Include orderCount and totalSpent (optional)

- [ ] **✅ API 35/37: GET /admin/users/:id [MVP]**
  - [ ] Return user details
  - [ ] Include order history summary

**Afternoon: User Management**
- [ ] **✅ API 36/37: PUT /admin/users/:id/status [MVP]**
  - [ ] Update user status (active/inactive)
  - [ ] Prevent locking self
  - [ ] Return updated user

- [ ] **✅ API 37/37: PUT /admin/users/:id/role [MVP]**
  - [ ] Update user role (customer/admin)
  - [ ] Prevent changing own role
  - [ ] Return updated user

---

### NGÀY 17: Error Handling & Validation

**Morning: Global Exception Filter**
- [ ] **Create Exception Filter** (`common/filters/http-exception.filter.ts`)
  ```typescript
  {
    "statusCode": 400,
    "errorCode": "CART_OUT_OF_STOCK",
    "message": "Sản phẩm iPhone 15 Pro Max không đủ số lượng (còn 5)",
    "timestamp": "2026-01-25T02:00:00Z",
    "path": "/api/cart/items"
  }
  ```

- [ ] **Create Custom Exceptions**
  - [ ] `AuthEmailExistsException`
  - [ ] `CartOutOfStockException`
  - [ ] `OrderInvalidTransitionException`
  - [ ] `ProductNotFoundException`
  - [ ] etc.

**Afternoon: Validation**
- [ ] **Review all DTOs** - ensure class-validator decorators
- [ ] **Add ValidationPipe** globally in `main.ts`
- [ ] **Test validation** for each endpoint

---

### NGÀY 18-19: Testing & Documentation

#### NGÀY 18: API Testing

**Morning: Postman Collection**
- [ ] **Create Postman Collection** with all 37 APIs
- [ ] **Setup Environment Variables**
  - [ ] `baseUrl`: http://localhost:3001/api
  - [ ] `accessToken`: (auto-set from login)
- [ ] **Create Folders**
  - [ ] Authentication
  - [ ] Users
  - [ ] Products
  - [ ] Categories
  - [ ] Cart
  - [ ] Orders
  - [ ] Admin

**Afternoon: Test All APIs**
- [ ] **Test Happy Paths** (all 37 APIs)
- [ ] **Test Error Cases**
  - [ ] Invalid credentials
  - [ ] Unauthorized access
  - [ ] Validation errors
  - [ ] Not found errors
  - [ ] Business logic errors (oversell, invalid transition)

#### NGÀY 19: Swagger Documentation

**Morning: Setup Swagger**
- [ ] **Install Swagger**
  ```bash
  npm install @nestjs/swagger
  ```

- [ ] **Setup in main.ts**
  ```typescript
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API for Order Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  ```

**Afternoon: Add Decorators**
- [ ] **Add @ApiTags** to all controllers
- [ ] **Add @ApiOperation** to all endpoints
- [ ] **Add @ApiResponse** for success/error cases
- [ ] **Add @ApiBearerAuth** for protected routes
- [ ] **Test Swagger UI** at http://localhost:3001/api/docs

---

### NGÀY 20-21: Optimization & Final Testing

#### NGÀY 20: Performance Optimization

**Morning: Database Optimization**
- [ ] **Add Indexes**
  ```typescript
  @Index(['email'])
  @Index(['orderCode'])
  @Index(['createdAt'])
  ```

- [ ] **Review N+1 Queries**
  - [ ] Use `relations` in find options
  - [ ] Use `leftJoinAndSelect` where needed

- [ ] **Optimize Cart/Order Queries**
  - [ ] Eager load necessary relations
  - [ ] Lazy load optional relations

**Afternoon: Security**
- [ ] **Enable CORS** with whitelist
- [ ] **Add Helmet** middleware
- [ ] **Rate Limiting** (optional)
- [ ] **Input Sanitization**

#### NGÀY 21: Final Testing & Cleanup

**Morning: Integration Testing**
- [x] **Test Complete Flows**
  - [x] Register → Login → Browse → Add to Cart → Checkout → View Order
  - [x] Admin: Login → Manage Products → View Orders → Update Status
  - [x] Concurrent Checkout (oversell prevention)

**Afternoon: Code Review & Cleanup**
- [x] **Remove console.logs**
- [x] **Remove commented code**
- [x] **Format code** (Prettier)
- [x] **Fix ESLint warnings**
- [x] **Update README.md**
  - [x] Installation guide
  - [x] Environment variables
  - [x] How to run
  - [x] API documentation link

---

## ✅ COMPLETION CHECKLIST

### Code Quality
- [x] All 37 MVP APIs working
- [x] All error codes implemented
- [x] All DTOs have validation
- [x] All entities have proper relations
- [x] Transaction used for critical operations
- [x] No N+1 query issues

### Documentation
- [x] Postman Collection complete
- [x] Swagger documentation complete
- [x] README.md updated
- [x] Environment variables documented

### Testing
- [x] All APIs tested with Postman Check/Automated Scripts
- [x] Error cases tested
- [x] Concurrent requests tested
- [x] State machine validated

### Security
- [x] Passwords hashed with bcrypt
- [x] JWT authentication working
- [x] Role-based access control working
- [x] Input validation working
- [x] CORS configured

### Performance
- [x] Database indexes added
- [x] Queries optimized
- [x] Response time < 1s for most APIs

---

## 🎯 DAILY ROUTINE

### Mỗi ngày:
1. **9:00-9:15:** Review TODO của ngày
2. **9:15-12:00:** Coding session 1
3. **12:00-13:00:** Nghỉ trưa
4. **13:00-17:00:** Coding session 2
5. **17:00-17:30:** Test APIs với Postman
6. **17:30-18:00:** Commit code, update TODO

### Commit Message Format:
```
feat(auth): implement register and login APIs
fix(cart): prevent oversell with transaction
docs(swagger): add API documentation
test(orders): add checkout integration test
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: "Cannot find module"
**Solution:** Check imports, run `npm install`

### Issue 2: Database connection failed
**Solution:** Check .env file, ensure MySQL is running

### Issue 3: JWT token not working
**Solution:** Check JWT_SECRET in .env, verify token in jwt.io

### Issue 4: Validation not working
**Solution:** Ensure ValidationPipe is global, check DTO decorators

### Issue 5: Oversell happening
**Solution:** Use transaction + FOR UPDATE lock in checkout

---

## 📚 RESOURCES

### NestJS Documentation
- https://docs.nestjs.com
- https://docs.nestjs.com/techniques/database
- https://docs.nestjs.com/security/authentication

### TypeORM Documentation
- https://typeorm.io
- https://typeorm.io/transactions

### Best Practices
- https://github.com/nestjs/nest/tree/master/sample
- https://github.com/brocoders/nestjs-boilerplate

---

**Good luck! 🚀 Bạn có thể làm được!**
