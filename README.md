# 🛍️ OrderMatrix - E-Commerce Order Management System

**OrderMatrix** là hệ thống quản lý sản phẩm và đặt hàng trực tuyến (E-commerce), được phát triển với cấu trúc Monorepo chia làm hai phần chính: **Backend (NestJS)** và **Frontend (Next.js App Router)**.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 1. Backend
- **Framework:** NestJS
- **Database ORM:** TypeORM với MySQL
- **Authentication:** JWT (Access Token & Refresh Token)
- **Logger:** Winston Logger
- **Documentation:** Swagger UI
- **Containerization:** Docker & Docker Compose
- **Security:** Helmet, Throttler (Rate Limiting), CORS

### 2. Frontend
- **Framework:** Next.js (App Router, React 18, TypeScript)
- **Styling:** TailwindCSS & PostCSS
- **State & Auth:** React Context API & Custom Hooks
- **API Client:** Axios (Tích hợp Service Layer có kiểu dữ liệu đầy đủ)

---

## 📁 Cấu trúc thư mục dự án

```text
OrderMatrix/
├── backend/               # Mã nguồn NestJS API
│   ├── src/               # Thư mục src của NestJS
│   ├── test/              # Unit & E2E Tests
│   ├── Dockerfile         # Dockerfile chạy backend
│   └── docs/              # Tài liệu báo cáo sprint & roadmap
├── frontend/              # Mã nguồn Next.js Client
│   ├── app/               # Next.js App Router Pages
│   ├── components/        # UI & Business Components
│   ├── hooks/             # Custom React Hooks
│   └── lib/               # Service Layer & Types
├── docker-compose.yml     # Khởi chạy toàn bộ hệ thống (App + DB)
└── README.md              # Hướng dẫn dự án gốc
```

---

## 🚀 Hướng dẫn cài đặt và khởi chạy dự án

### Yêu cầu hệ thống (Prerequisites)
- **Node.js:** v18 trở lên (Đã test ổn định trên v20/v26)
- **MySQL Database** hoặc cài đặt **Docker Desktop**

---

### 📦 Cách 1: Khởi chạy nhanh bằng Docker (Khuyên dùng)
Bạn chỉ cần Docker và Docker Compose ở thư mục gốc để chạy toàn bộ hệ thống (gồm MySQL, Backend, Frontend):

1. **Khởi chạy container:**
   ```bash
   docker-compose up -d --build
   ```
2. **Kiểm tra trạng thái các service:**
   ```bash
   docker compose ps
   ```
3. **Truy cập ứng dụng:**
   - **Frontend UI:** `http://localhost:3000`
   - **Backend API:** `http://localhost:3001`
   - **Swagger API Documentation:** `http://localhost:3001/api-docs`

---

### 💻 Cách 2: Khởi chạy thủ công từng phần (Development Mode)

#### 1. Cấu hình Backend
1. Di chuyển vào thư mục backend và cài đặt dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Tạo file cấu hình môi trường `.env` từ file ví dụ:
   ```bash
   cp .env.example .env
   ```
   *Chỉnh sửa thông số kết nối Database (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE) cho phù hợp với MySQL của bạn.*

3. Chạy DB Seed để tạo tài khoản mẫu và dữ liệu mẫu:
   ```bash
   npm run seed
   ```
   *(Tài khoản admin mặc định: `admin@example.com` / `Password123`)*

4. Khởi chạy server development:
   ```bash
   npm run start:dev
   ```

---

#### 2. Cấu hình Frontend
1. Mở một terminal mới, di chuyển vào thư mục frontend và cài đặt dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Tạo file cấu hình môi trường `.env.local` từ file ví dụ:
   ```bash
   cp .env.example .env.local
   ```
3. Khởi chạy client development:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt truy cập `http://localhost:3000`.

---

## 🔒 Tài khoản thử nghiệm mẫu (Mock Accounts)

Sau khi chạy seed dữ liệu thành công, bạn có thể đăng nhập bằng các tài khoản sau:
- **Tài khoản Khách hàng (Customer):** `user@example.com` / mật khẩu: `Password123`
- **Tài khoản Quản trị viên (Admin):** `admin@example.com` / mật khẩu: `Password123`
