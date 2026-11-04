# OrderMatrix — High-Performance E-Commerce & SKU Variant Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=flat&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://www.mysql.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0979?style=flat&logo=typeorm)](https://typeorm.io/)
[![Jest](https://img.shields.io/badge/Jest-54%20Tests%20Passed-C21325?style=flat&logo=jest)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

An enterprise-grade, high-concurrency e-commerce order management and multi-dimensional SKU matrix platform. Built with **Next.js 14 App Router**, **NestJS 11**, and **MySQL 8** with **TypeORM**, featuring strict transaction isolation, pessimistic write locking, a promotions engine, and an **Apple Liquid Glass** design system.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Engineering Highlights](#-key-engineering-highlights)
  - [1. Dynamic Multi-Dimensional SKU Variant Matrix](#1-dynamic-multi-dimensional-sku-variant-matrix)
  - [2. Concurrency Control & Pessimistic Locking](#2-concurrency-control--pessimistic-locking)
  - [3. Promotion & Coupon Engine](#3-promotion--coupon-engine)
  - [4. Apple Liquid Glass Design System](#4-apple-liquid-glass-design-system)
- [Monorepo Structure](#-monorepo-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup & Docker](#database-setup--docker)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Seeding](#database-seeding)
- [REST API Reference & Swagger](#-rest-api-reference--swagger)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Compliance](#-security--compliance)

---

## 🏛 Architectural Overview

OrderMatrix is engineered as a clean decoupled monorepo separating business domain logic, strict relational persistence, and a reactive frontend client:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Client (App Router)                       │
│  - Apple Liquid Glass Design System (Pure White #FFF / Cool Grey #F5) │
│  - Dynamic SKU Matrix Selector & Real-Time Hex Color Swatches          │
│  - Session Cart Sync, Voucher Deduction & Multi-Step Checkout          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (CORS + JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NestJS 11 Core Service                          │
│  - Controller Layer with OpenAPI / Swagger Documentation               │
│  - Class-Validator DTOs & Custom Business Exception Filters            │
│  - Winston Enterprise Request/Response Audit Logger                    │
│  - Auth Module (Passport JWT, Argon2/Bcrypt Hash, Roles Guard)         │
│  - Orders & Inventory Transaction Orchestrator                         │
│  - Promotions & Voucher Allocation Engine                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TypeORM (DataSource & QueryRunner)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         MySQL 8.0 Database                             │
│  - PESSIMISTIC_WRITE Row-Level Locks on Variants & Coupons             │
│  - Relational Schema: Products, Variants, OptionTypes, OptionValues    │
│  - Orders, OrderItems, Coupons, CouponUsages, Audit History Logs       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💎 Key Engineering Highlights

### 1. Dynamic Multi-Dimensional SKU Variant Matrix

Unlike generic e-commerce platforms that flatten product options into unstructured JSON strings, OrderMatrix implements a normalized relational model for complex configurations:

- **Relational Entities:** `OptionType` (e.g., Color, Storage, RAM), `OptionValue` (e.g., Desert Titanium, 512GB), `ProductVariant` (concrete sellable SKU), and `VariantOptionValue` (composite junction table).
- **Cartesian Product Generation:** Supports automated generation of all valid variant permutations with customizable pricing deltas, initial stock, and standardized SKU codes (e.g., `IP16PM-DES-512`).
- **Interactive UI Synchronization:** The client evaluates active variant options in real time, synchronizing image showcases, pricing tabular numbers, SKU labels, and inventory badges.

### 2. Concurrency Control & Pessimistic Locking

High-traffic flash sales inevitably cause race conditions where two simultaneous checkouts oversell remaining inventory or exhaust voucher quotas. OrderMatrix resolves this at the database level:

- **Isolated QueryRunner Transactions:** Order creation executes within a managed TypeORM database transaction.
- **Pessimistic Write Locking (`pessimistic_write`):** Variants are acquired with `SELECT ... FOR UPDATE`, guaranteeing serialization across concurrent requests.
- **Atomic Stock Checks:** If available stock is insufficient, the transaction terminates with `INSUFFICIENT_STOCK` (HTTP 400) without partial commits.
- **Safe Rollback:** Any validation failure triggers automatic rollback, leaving database state consistent.

```typescript
// backend/src/orders/orders.service.ts
await queryRunner.startTransaction();
try {
  // Lock variant record against concurrent modifications
  const variant = await queryRunner.manager.findOne(ProductVariant, {
    where: { id: item.variantId },
    lock: { mode: 'pessimistic_write' },
  });

  if (variant.stock < item.quantity) {
    throw new BadRequestException('Insufficient inventory for requested SKU');
  }

  variant.stock -= item.quantity;
  await queryRunner.manager.save(variant);
  // ... coupon lock & order item persistence
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
}
```

### 3. Promotion & Coupon Engine

A complete coupon management subsystem supporting automated discount calculation and quota governance:

- **Discount Types:** `percentage` (% off with optional `maxDiscountAmount` ceiling) and `fixed` (flat monetary deduction).
- **Enforcement Rules:** `minOrderValue`, `startDate`, `endDate`, global `usageLimit`, and per-user `userUsageLimit`.
- **Double-Spending Prevention:** Voucher records are locked with `pessimistic_write` during order creation, and atomic increments are committed alongside `CouponUsage` records.
- **Cancellation Recovery:** When an order is cancelled prior to shipping, coupon quotas and individual usage records are restored automatically.

### 4. Apple Liquid Glass Design System

Built under strict aesthetic principles inspired by Apple's Human Interface Guidelines:

- **Surfaces & Palettes:** Solid pure white surfaces (`#ffffff`), cool grey-white ground (`#f5f5f7`), and hairline borders (`border-black/[0.08]`). Gradients and colorful orbs are strictly avoided.
- **Micro-Interactions:** Physics-based pill button compressions (`:active { transform: scale(0.98); }`), frosted glass sticky navigation headers (`bg-[#f5f5f7]/80 backdrop-blur-xl`).
- **Monoline Vector Iconography:** Monoline SVG icons (`stroke-width: 1.75`, `stroke="currentColor"`, rounded stroke caps/joins).
- **Tabular Numerics & Color Swatches:** Monospace tabular numbers for prices (`[font-variant-numeric:tabular-nums]`) and authentic Apple color swatches with active ring indicators (`ring-2 ring-[#0071e3] ring-offset-2`).

---

## 📁 Monorepo Structure

```text
OrderMatrix/
├── backend/                             # NestJS API Application
│   ├── src/
│   │   ├── auth/                       # Authentication, JWT Strategies, Guards
│   │   ├── users/                      # User Profiles & Admin Management
│   │   ├── categories/                 # Category Hierarchy & Catalog
│   │   ├── products/                   # SKU Matrix, Options, Variants, Images
│   │   ├── cart/                       # Session/Persistent Cart & Cart Items
│   │   ├── orders/                     # Orders, State Machine, Locking Engine
│   │   ├── coupons/                    # Voucher Promotion Engine & Usage Tracking
│   │   ├── common/                     # Winston Logger, Filters, Interceptors
│   │   └── database/                   # Seed Data & TypeORM Migrations
│   ├── test/                           # End-to-End & Integration Test Suites
│   ├── Dockerfile                      # Production Docker container definition
│   └── package.json
│
├── frontend/                            # Next.js 14 App Router Application
│   ├── app/                            # Route Segments & Page Components
│   │   ├── page.tsx                    # Storefront Catalog & Segmented Filter
│   │   ├── products/[id]/page.tsx      # Multi-dimensional SKU Matrix Configurator
│   │   ├── cart/page.tsx               # Cart Manager & Voucher Input Pill
│   │   ├── checkout/page.tsx           # Multi-step Shipping & Order Confirmation
│   │   ├── orders/                     # Order History & Tracking
│   │   └── admin/                      # Control Panel & Voucher Operations
│   ├── components/                     # Apple Liquid Glass UI Components
│   ├── lib/                            # API Services, Client, Type Definitions
│   └── tailwind.config.ts              # Design System Configuration
│
├── docker-compose.yml                  # MySQL 8.0 & Application Stack
└── README.md                           # Master Project Documentation
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14.2 (App Router) | React Server & Client Components, Server-side Rendering |
| **Frontend Styling** | TailwindCSS 3.4 | Apple Liquid Glass utility system, custom micro-interactions |
| **Backend Framework** | NestJS 11.0 | Enterprise Node.js framework with Dependency Injection |
| **Language** | TypeScript 5.x | Strict end-to-end type safety across client and server |
| **ORM & Database** | TypeORM 0.3 + MySQL 8.0 | Relational schema, migrations, row-level write locks |
| **Security & Auth** | Passport.js + JWT + Helmet | Access/Refresh tokens, bcrypt password hashing, HTTP headers |
| **Rate Limiting** | NestJS Throttler 6.5 | IP-based request throttling against brute force |
| **Documentation** | Swagger / OpenAPI 3.0 | Interactive API documentation at `/api/docs` |
| **Testing** | Jest | Unit testing for services, state machine, and lock safety |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18.x or v20.x+
- **npm** or **pnpm**
- **Docker Desktop** (or a local MySQL 8 instance)

### Database Setup & Docker

Start the dedicated MySQL container (mapped to host port `3307` to avoid local port conflicts):

```bash
docker compose up -d mysql
```

Or start the existing container:

```bash
docker start ecommerce-mysql
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Configure environment variables in `.env`:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=3307
   DB_USERNAME=root
   DB_PASSWORD=root_password
   DB_DATABASE=ecommerce_db

   # JWT Configuration
   JWT_SECRET=order-matrix-super-secret-key-production
   JWT_EXPIRES_IN=30m

   # Server
   PORT=3001
   NODE_ENV=development
   LOG_LEVEL=debug
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the high-fidelity database seed script:
   ```bash
   npm run seed
   ```

5. Launch the NestJS backend in development mode:
   ```bash
   npm run start:dev
   ```
   Backend will be listening on [http://localhost:3001](http://localhost:3001).

### Frontend Setup

1. Open a new terminal and navigate to the frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the web application at [http://localhost:3000](http://localhost:3000).

---

## 📖 REST API Reference & Swagger

Interactive Swagger UI documentation is available at:
👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

### Key Endpoint Groups

| Module | Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new customer account | Public |
| **Auth** | `POST` | `/api/auth/login` | Authenticate and obtain JWT token | Public |
| **Products** | `GET` | `/api/products` | Paginated product list with search & filter | Public |
| **Products** | `GET` | `/api/products/:id` | Full product details with options & variants | Public |
| **Cart** | `GET` | `/api/cart` | Get current user's shopping bag | Bearer JWT |
| **Cart** | `POST` | `/api/cart/items` | Add specific SKU variant to bag | Bearer JWT |
| **Orders** | `POST` | `/api/orders` | Place order with atomic stock deduction | Bearer JWT |
| **Orders** | `GET` | `/api/orders/my-orders`| Retrieve user order history | Bearer JWT |
| **Coupons** | `POST` | `/api/coupons/apply` | Validate & calculate voucher discount | Bearer JWT |
| **Admin** | `GET` | `/api/admin/coupons` | List all promotional vouchers | Admin JWT |
| **Admin** | `POST` | `/api/admin/coupons` | Create voucher with usage rules | Admin JWT |
| **Admin** | `PATCH`| `/api/admin/coupons/:id/toggle` | Toggle active status | Admin JWT |

---

## 🧪 Testing & Quality Assurance

OrderMatrix maintains comprehensive test coverage for transaction integrity, state machine transitions, and coupon algorithms:

```bash
cd backend
npm test
```

### Test Suite Execution Output

```text
PASS src/app.controller.spec.ts
PASS src/cart/cart.service.spec.ts
PASS src/categories/categories.service.spec.ts
PASS src/users/users.service.spec.ts
PASS src/coupons/coupons.service.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/orders/orders.service.spec.ts
PASS src/products/products.service.spec.ts
PASS src/users/users.controller.spec.ts
PASS src/auth/auth.controller.spec.ts

Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        2.42 s
```

---

## 🔒 Security & Compliance

- **Rate Limiting:** Built-in Throttler guards mitigate brute-force and DDoS attempts.
- **Header Protection:** Helmet middleware applies strict HTTP response headers (`X-Content-Type-Options`, `X-Frame-Options`, `HSTS`).
- **Data Sanitization:** Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` rejects unexpected request payloads.
- **Secret Hygiene:** Database credentials and JWT signing keys are managed via isolated `.env` configurations excluded from version control.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
