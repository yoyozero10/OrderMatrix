# BÁO CÁO SPRINT 1 — Foundation & Core APIs

**Dự án:** Website Đặt Hàng và Quản Lý Đơn Hàng

**Framework:** NestJS 10 + TypeORM + MySQL

**Sprint:** Sprint 1 / 4

**Thời gian:** Ngày 1 đến Ngày 7 (Tuần 1)

**Ngày báo cáo:** 6/02/2026

**Thành viên thực hiện:** 23521432 - Trần Đại Thắng, 23521571 - Kim Thành Tiến

---

## 1. Mục Tiêu Sprint

Sprint 1 tập trung xây dựng nền tảng kỹ thuật và hoàn thiện các module cốt lõi phía người dùng, bao gồm:

- Khởi tạo dự án, cấu hình môi trường, kết nối cơ sở dữ liệu
- Xây dựng hệ thống Authentication (đăng ký, đăng nhập, JWT)
- Quản lý hồ sơ người dùng
- API công khai cho Danh mục và Sản phẩm

---

## 2. Phạm Vi Công Việc

### 2.1 Tổng Số APIs Trong Sprint

| Module | Số APIs | Loại |
|---|---|---|
| Authentication | 6 | 2 MVP + 4 Optional |
| Users | 3 | 3 MVP |
| Categories (Public) | 1 | 1 MVP |
| Products (Public) | 2 | 2 MVP |
| **Tổng** | **12** | **8 MVP + 4 Optional** |

---

## 3. Chi Tiết Công Việc Theo Ngày

### Ngày 1 — Project Setup & Database

#### Buổi sáng

- Khởi tạo dự án NestJS bằng NestJS CLI
- Cài đặt các dependencies:
  - Database: `@nestjs/typeorm`, `typeorm`, `mysql2`
  - Authentication: `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt`, `bcrypt`
  - Validation: `class-validator`, `class-transformer`
  - Cấu hình: `@nestjs/config`
  - Bảo mật: `helmet`
- Tạo file `.env` với các biến môi trường: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET, JWT_EXPIRES_IN, PORT

#### Buổi chiều

- Cấu hình kết nối Database trong `app.module.ts` sử dụng TypeOrmModule
- Tạo cấu trúc thư mục dự án: auth, users, products, categories, cart, orders, common (decorators, guards, filters, interceptors), database/seeds
- Tạo `BaseEntity` tại `common/entities/base.entity.ts` với các trường: id (UUID), createdAt, updatedAt

**Kết quả Ngày 1:** Dự án khởi chạy thành công, kết nối MySQL ổn định.

---

### Ngày 2 — Authentication Core (2 APIs MVP)

#### Buổi sáng

- Tạo User Entity tại `users/entities/user.entity.ts` với các trường: email, password, fullName, phone, avatar; enum role (customer/admin), enum status (active/inactive)
- Generate Auth Module (module, service, controller)
- Generate Users Module (module, service, controller)

#### Buổi chiều

- **API 1/37 — POST /auth/register [MVP]**
  - Validate dữ liệu đầu vào bằng `RegisterDto`
  - Kiểm tra email đã tồn tại chưa
  - Hash mật khẩu với bcrypt (salt rounds = 10)
  - Lưu user vào DB, trả về thông tin user (ẩn password)

- **API 2/37 — POST /auth/login [MVP]**
  - Validate credentials bằng `LoginDto`
  - So sánh password với bcrypt
  - Tạo JWT token
  - Trả về `{ accessToken, user }`

**Kết quả Ngày 2:** 2 APIs đăng ký / đăng nhập hoạt động, test OK với Postman.

---

### Ngày 3 — JWT Strategy & Optional Auth APIs

#### Buổi sáng

- Tạo JWT Strategy tại `auth/strategies/jwt.strategy.ts`: extract token từ Authorization header, validate payload, trả về user từ DB
- Tạo JWT Guard tại `auth/guards/jwt-auth.guard.ts`
- Tạo Roles Guard tại `common/guards/roles.guard.ts`
- Tạo @Roles Decorator tại `common/decorators/roles.decorator.ts`

#### Buổi chiều

- **API 3/37 — POST /auth/logout [Optional]**
  - Trả về success message (stateless, client tự xóa token)

- **API 4/37 — POST /auth/refresh [Optional]**
  - Xử lý refresh token, cấp accessToken mới

- **API 5/37 — POST /auth/forgot-password [Optional]**
  - Tạo reset token, lưu vào DB với thời hạn 15 phút
  - Ghi log email (mock)

- **API 6/37 — POST /auth/reset-password [Optional]**
  - Validate reset token
  - Cập nhật mật khẩu mới, vô hiệu hóa token

**Kết quả Ngày 3:** Hệ thống Auth hoàn chỉnh, guard hoạt động đúng theo vai trò.

---

### Ngày 4 — Users Module (3 APIs MVP)

#### Buổi sáng

- **API 7/37 — GET /users/me [MVP]**
  - Yêu cầu Bearer token (JwtAuthGuard)
  - Trả về thông tin profile (ẩn password)

- **API 8/37 — PUT /users/me [MVP]**
  - Validate bằng `UpdateProfileDto`
  - Cho phép cập nhật: fullName, phone, avatar
  - Không cho cập nhật: email, role, status
  - Trả về user đã cập nhật

#### Buổi chiều

- **API 9/37 — PUT /users/me/password [MVP]**
  - Validate `ChangePasswordDto` (oldPassword, newPassword)
  - Xác minh mật khẩu cũ
  - Hash mật khẩu mới và lưu
  - Trả về success message

**Kết quả Ngày 4:** 3 APIs Users hoàn chỉnh, được bảo vệ đúng bằng JWT.

---

### Ngày 5 — Entities & Seed Data

#### Buổi sáng — Tạo Entities

- **Category Entity** tại `categories/entities/category.entity.ts`
  - Trường: name, description, image
  - Quan hệ: OneToMany với Product

- **Product Entity** tại `products/entities/product.entity.ts`
  - Trường: name, description, price, stock, status
  - Quan hệ: ManyToOne với Category; OneToMany với ProductImage

- **ProductImage Entity** tại `products/entities/product-image.entity.ts`
  - Trường: imageUrl, isPrimary, displayOrder
  - Quan hệ: ManyToOne với Product (CASCADE DELETE)

#### Buổi chiều — Seed Data

- Tạo Seed Service tại `database/seeds/seed.service.ts`
  - Tạo 5 danh mục sản phẩm
  - Tạo 20–30 sản phẩm kèm ảnh minh họa

**Kết quả Ngày 5:** Schema database hoàn chỉnh, dữ liệu mẫu sẵn sàng để test.

---

### Ngày 6 — Categories Public API

- Generate Categories Module (module, service, controller)
- **API 10/37 — GET /categories [MVP]**
  - Trả về tất cả danh mục, không yêu cầu xác thực
  - Sắp xếp theo tên
  - Có thể bao gồm số lượng sản phẩm trong mỗi danh mục

**Kết quả Ngày 6:** API danh mục hoạt động, truy cập công khai.

---

### Ngày 7 — Products Public APIs

- Generate Products Module (module, service, controller)
- **API 11/37 — GET /products [MVP]**
  - Phân trang: `?page=1&limit=10`
  - Tìm kiếm: `?search=keyword`
  - Lọc: `?categoryId=&minPrice=&maxPrice=`
  - Sắp xếp: `?sort=price_asc | price_desc | newest`
  - Trả về kèm meta: tổng bản ghi, tổng trang, trang hiện tại
  - Include thông tin danh mục và ảnh đại diện

- **API 12/37 — GET /products/:id [MVP]**
  - Trả về sản phẩm với đầy đủ hình ảnh
  - Include thông tin danh mục
  - Xử lý lỗi 404 khi không tìm thấy sản phẩm

**Kết quả Ngày 7:** 2 APIs sản phẩm công khai hoàn chỉnh với đầy đủ tính năng lọc, sắp xếp và phân trang.

---

## 4. Kết Quả Bàn Giao (Deliverables)

| STT | Hạng mục bàn giao | Trạng thái |
|---|---|---|
| 1 | Dự án NestJS khởi chạy thành công | Hoàn thành |
| 2 | Kết nối MySQL ổn định | Hoàn thành |
| 3 | 12 APIs hoạt động đúng spec | Hoàn thành |
| 4 | JWT Authentication và Role Guard | Hoàn thành |
| 5 | Database có seed data (5 danh mục, 20+ sản phẩm) | Hoàn thành |
| 6 | Postman Collection cho 12 APIs | Hoàn thành |
| 7 | Tất cả APIs test pass (happy path) | Hoàn thành |

---

## 5. Danh Sách APIs Đã Hoàn Thành

| STT | Method | Endpoint | Loại | Xác thực |
|---|---|---|---|---|
| 1 | POST | /auth/register | MVP | Không |
| 2 | POST | /auth/login | MVP | Không |
| 3 | POST | /auth/logout | Optional | JWT |
| 4 | POST | /auth/refresh | Optional | JWT |
| 5 | POST | /auth/forgot-password | Optional | Không |
| 6 | POST | /auth/reset-password | Optional | Không |
| 7 | GET | /users/me | MVP | JWT |
| 8 | PUT | /users/me | MVP | JWT |
| 9 | PUT | /users/me/password | MVP | JWT |
| 10 | GET | /categories | MVP | Không |
| 11 | GET | /products | MVP | Không |
| 12 | GET | /products/:id | MVP | Không |

---

## 6. Vấn Đề Gặp Phải & Giải Pháp

| Vấn đề | Giải pháp |
|---|---|
| JWT token không decode đúng | Kiểm tra JWT_SECRET trong file .env, xác minh token tại jwt.io |
| Không kết nối được MySQL | Đảm bảo MySQL service đang chạy, kiểm tra credentials trong .env |
| Module không tìm thấy | Kiểm tra import trong module, chạy lại `npm install` |
| Validation không hoạt động | Đăng ký ValidationPipe global trong `main.ts` |

---

## 7. Tiến Độ So Với Kế Hoạch

| Tiêu chí | Kết quả |
|---|---|
| APIs hoàn thành | 12/12 (100%) |
| MVP APIs | 8/8 (100%) |
| Optional APIs | 4/4 (100%) |
| Tổng tiến độ dự án | 12/37 APIs (32,4%) |

---

## 8. Kế Hoạch Sprint Tiếp Theo (Sprint 2)

**Sprint 2 — Cart & Orders** (Ngày 8 đến Ngày 12)

| Mục tiêu | Nội dung |
|---|---|
| Cart Module | 5 APIs quản lý giỏ hàng |
| Orders Module | 4 APIs đặt hàng, xem đơn và hủy đơn |
| Điểm nổi bật | Checkout sử dụng DB transaction và FOR UPDATE lock để chống oversell |

---

*Báo cáo được tạo ngày 6/02/2026.*
