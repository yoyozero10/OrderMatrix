# BÁO CÁO SPRINT 3 — Admin Modules

**Dự án:** Website Đặt Hàng và Quản Lý Đơn Hàng

**Framework:** NestJS 10 + TypeORM + MySQL

**Sprint:** Sprint 3 / 4

**Thời gian:** Ngày 13 đến Ngày 16 (Tuần 3 — từ 16/02/2026 đến 19/02/2026)

**Ngày báo cáo:** 19/02/2026

**Thành viên thực hiện:** 23521432 - Trần Đại Thắng, 23521571 - Kim Thành Tiến

---

## 1. Mục Tiêu Sprint

Sprint 3 tập trung xây dựng toàn bộ chức năng quản trị viên (Admin), bao gồm:

- Quản lý sản phẩm: tạo, cập nhật, xóa và quản lý hình ảnh sản phẩm
- Quản lý danh mục: tạo, cập nhật, xóa danh mục
- Quản lý đơn hàng: xem toàn bộ đơn, cập nhật trạng thái và thống kê doanh thu
- Quản lý người dùng: xem danh sách, khóa tài khoản và phân quyền

Tất cả các endpoint Admin đều được bảo vệ bằng JWT và kiểm tra vai trò `admin`.

---

## 2. Phạm Vi Công Việc

### 2.1 Tổng Số APIs Trong Sprint

| Module | Số APIs | Loại |
|---|---|---|
| Admin - Products | 5 | 3 MVP + 2 Optional |
| Admin - Categories | 3 | 3 MVP |
| Admin - Orders | 4 | 4 MVP |
| Admin - Users | 4 | 4 MVP |
| **Tổng** | **16** | **14 MVP + 2 Optional** |

### 2.2 Tổng Tiến Độ Tích Lũy

| Sprint | APIs | Tích lũy |
|---|---|---|
| Sprint 1 (Tuần 1) | 12 APIs | 12/37 |
| Sprint 2 (Tuần 2) | 9 APIs | 21/37 |
| Sprint 3 (Tuần 3) | 16 APIs | 37/37 |

---

## 3. Chi Tiết Công Việc Theo Ngày

### Ngày 13 (16/02/2026) — Admin Products: CRUD & Images

#### Buổi sáng — Tạo và Cập Nhật Sản Phẩm

- **API 22/37 — POST /admin/products [MVP]**
  - Áp dụng @Roles('admin') guard kết hợp JwtAuthGuard
  - Validate đầu vào bằng `CreateProductDto` (name, description, price, stock, categoryId)
  - Kiểm tra danh mục (categoryId) tồn tại trong DB
  - Tạo bản ghi sản phẩm mới
  - Trả về sản phẩm vừa tạo kèm thông tin danh mục

- **API 23/37 — PUT /admin/products/:id [MVP]**
  - Validate đầu vào bằng `UpdateProductDto` (tất cả trường đều tùy chọn)
  - Kiểm tra sản phẩm tồn tại, trả về 404 nếu không có
  - Cập nhật các trường được cung cấp
  - Trả về sản phẩm sau cập nhật

#### Buổi chiều — Xóa Sản Phẩm và Quản Lý Hình Ảnh

- **API 24/37 — DELETE /admin/products/:id [MVP]**
  - Kiểm tra sản phẩm tồn tại, trả về 404 nếu không có
  - Xóa sản phẩm; hình ảnh liên quan tự động bị xóa theo (ON DELETE CASCADE)
  - Trả về success message

- **API 25/37 — POST /admin/products/:id/images [Optional]**
  - Upload hình ảnh sản phẩm sử dụng Multer (hoặc mock URL)
  - Tạo bản ghi ProductImage
  - Nếu là hình ảnh đầu tiên: tự động đặt isPrimary = true
  - Trả về sản phẩm kèm danh sách hình ảnh đã cập nhật

- **API 26/37 — DELETE /admin/products/:id/images/:imageId [Optional]**
  - Xóa bản ghi ProductImage
  - Nếu hình bị xóa là ảnh đại diện (isPrimary = true): tự động chọn ảnh khác làm đại diện
  - Trả về sản phẩm kèm danh sách hình ảnh còn lại

**Kết quả Ngày 13:** 5 APIs Admin Products hoàn chỉnh, phân quyền admin hoạt động đúng.

---

### Ngày 14 (17/02/2026) — Admin Categories

#### Cả ngày — CRUD Danh Mục

- **API 27/37 — POST /admin/categories [MVP]**
  - Validate đầu vào bằng `CreateCategoryDto` (name, description, image)
  - Tạo bản ghi danh mục mới
  - Trả về danh mục vừa tạo

- **API 28/37 — PUT /admin/categories/:id [MVP]**
  - Validate đầu vào bằng `UpdateCategoryDto` (các trường tùy chọn)
  - Kiểm tra danh mục tồn tại, trả về 404 nếu không có
  - Cập nhật thông tin danh mục
  - Trả về danh mục sau cập nhật

- **API 29/37 — DELETE /admin/categories/:id [MVP]**
  - Kiểm tra danh mục tồn tại, trả về 404 nếu không có
  - Kiểm tra danh mục có sản phẩm liên kết không
  - Nếu còn sản phẩm: từ chối xóa, trả về lỗi `CATEGORY_HAS_PRODUCTS`
  - Nếu không còn sản phẩm: xóa danh mục
  - Trả về success message

**Kết quả Ngày 14:** 3 APIs Admin Categories hoàn chỉnh, có kiểm tra ràng buộc dữ liệu trước khi xóa.

---

### Ngày 15 (18/02/2026) — Admin Orders

#### Buổi sáng — Danh Sách và Chi Tiết Đơn Hàng

- **API 30/37 — GET /admin/orders [MVP]**
  - Trả về tất cả đơn hàng trong hệ thống (không lọc theo user)
  - Phân trang (page, limit)
  - Lọc theo trạng thái đơn hàng (orderStatus)
  - Tìm kiếm theo mã đơn hàng (orderCode) hoặc tên khách hàng
  - Sắp xếp theo createdAt giảm dần

- **API 31/37 — GET /admin/orders/:id [MVP]**
  - Trả về đầy đủ thông tin đơn hàng
  - Include thông tin khách hàng (user)
  - Include danh sách OrderItem
  - Include lịch sử trạng thái (OrderStatusHistory)

#### Buổi chiều — Cập Nhật Trạng Thái và Thống Kê

- **API 32/37 — PUT /admin/orders/:id/status [MVP]**
  - Validate đầu vào bằng `UpdateOrderStatusDto` (status, note)
  - Kiểm tra chuyển trạng thái hợp lệ theo State Machine (ALLOWED_TRANSITIONS)
  - Cập nhật orderStatus
  - Ghi OrderStatusHistory kèm adminId và ghi chú
  - Lỗi: `ORDER_INVALID_TRANSITION` nếu chuyển trạng thái không hợp lệ

- **API 33/37 — GET /admin/orders/stats [MVP]**
  - Tính tổng số đơn hàng (totalOrders)
  - Tính tổng doanh thu từ các đơn đã hoàn thành (totalRevenue)
  - Đếm số đơn theo từng trạng thái (ordersByStatus)
  - Tính doanh thu theo tháng trong 6 tháng gần nhất (revenueByMonth)
  - Trả về đối tượng thống kê

**Kết quả Ngày 15:** 4 APIs Admin Orders hoàn chỉnh, thống kê doanh thu hoạt động đúng.

---

### Ngày 16 (19/02/2026) — Admin Users

#### Buổi sáng — Danh Sách và Chi Tiết Người Dùng

- **API 34/37 — GET /admin/users [MVP]**
  - Trả về danh sách tất cả người dùng
  - Phân trang (page, limit)
  - Tìm kiếm theo email hoặc họ tên
  - Lọc theo vai trò (role: customer / admin)
  - Include số lượng đơn hàng (orderCount) và tổng chi tiêu (totalSpent) — tùy chọn

- **API 35/37 — GET /admin/users/:id [MVP]**
  - Trả về đầy đủ thông tin người dùng (ẩn password)
  - Include tóm tắt lịch sử đơn hàng (số đơn, tổng chi tiêu)

#### Buổi chiều — Quản Lý Tài Khoản

- **API 36/37 — PUT /admin/users/:id/status [MVP]**
  - Validate đầu vào: status phải là `active` hoặc `inactive`
  - Không cho phép admin tự khóa tài khoản của chính mình
  - Cập nhật trạng thái tài khoản
  - Trả về thông tin user sau cập nhật

- **API 37/37 — PUT /admin/users/:id/role [MVP]**
  - Validate đầu vào: role phải là `customer` hoặc `admin`
  - Không cho phép admin tự đổi vai trò của chính mình
  - Cập nhật vai trò người dùng
  - Trả về thông tin user sau cập nhật

**Kết quả Ngày 16:** 4 APIs Admin Users hoàn chỉnh. Toàn bộ 37/37 APIs của dự án đã được triển khai.

---

## 4. Kết Quả Bàn Giao (Deliverables)

| STT | Hạng mục bàn giao | Trạng thái |
|---|---|---|
| 1 | Admin Products: CRUD đầy đủ (3 MVP + 2 Optional) | Hoàn thành |
| 2 | Admin Categories: CRUD với ràng buộc xóa | Hoàn thành |
| 3 | Admin Orders: xem, cập nhật trạng thái và thống kê | Hoàn thành |
| 4 | Admin Users: xem, khóa tài khoản và phân quyền | Hoàn thành |
| 5 | Tất cả endpoint Admin được bảo vệ bằng @Roles('admin') | Hoàn thành |
| 6 | State Machine kiểm soát chuyển trạng thái đơn hàng từ phía Admin | Hoàn thành |
| 7 | Thống kê doanh thu 6 tháng gần nhất | Hoàn thành |
| 8 | Postman Collection cập nhật thêm 16 APIs Admin | Hoàn thành |

---

## 5. Danh Sách APIs Đã Hoàn Thành

| STT | Method | Endpoint | Loại | Xác thực |
|---|---|---|---|---|
| 22 | POST | /admin/products | MVP | JWT + Admin |
| 23 | PUT | /admin/products/:id | MVP | JWT + Admin |
| 24 | DELETE | /admin/products/:id | MVP | JWT + Admin |
| 25 | POST | /admin/products/:id/images | Optional | JWT + Admin |
| 26 | DELETE | /admin/products/:id/images/:imageId | Optional | JWT + Admin |
| 27 | POST | /admin/categories | MVP | JWT + Admin |
| 28 | PUT | /admin/categories/:id | MVP | JWT + Admin |
| 29 | DELETE | /admin/categories/:id | MVP | JWT + Admin |
| 30 | GET | /admin/orders | MVP | JWT + Admin |
| 31 | GET | /admin/orders/:id | MVP | JWT + Admin |
| 32 | PUT | /admin/orders/:id/status | MVP | JWT + Admin |
| 33 | GET | /admin/orders/stats | MVP | JWT + Admin |
| 34 | GET | /admin/users | MVP | JWT + Admin |
| 35 | GET | /admin/users/:id | MVP | JWT + Admin |
| 36 | PUT | /admin/users/:id/status | MVP | JWT + Admin |
| 37 | PUT | /admin/users/:id/role | MVP | JWT + Admin |

---

## 6. Mã Lỗi Nghiệp Vụ Đã Triển Khai

| Mã lỗi | HTTP Status | Mô tả |
|---|---|---|
| CATEGORY_HAS_PRODUCTS | 400 | Không thể xóa danh mục khi còn sản phẩm liên kết |
| ORDER_INVALID_TRANSITION | 400 | Chuyển trạng thái đơn hàng không hợp lệ theo State Machine |
| FORBIDDEN_SELF_ACTION | 403 | Admin không được tự khóa hoặc đổi vai trò của chính mình |

---

## 7. Vấn Đề Gặp Phải & Giải Pháp

| Vấn đề | Giải pháp |
|---|---|
| Endpoint /admin/orders/stats bị NestJS hiểu là /admin/orders/:id | Đăng ký route stats trước route :id trong controller |
| Xóa danh mục gây lỗi foreign key với bảng products | Kiểm tra sản phẩm liên kết trước khi xóa, trả về lỗi CATEGORY_HAS_PRODUCTS |
| Admin tự thay đổi quyền của chính mình | So sánh userId trong token với :id trong request, từ chối nếu trùng |
| Hình ảnh đại diện (isPrimary) bị mất sau khi xóa | Sau khi xóa ảnh đại diện, tự động chọn ảnh đầu tiên còn lại làm isPrimary |

---

## 8. Tiến Độ So Với Kế Hoạch

| Tiêu chí | Kết quả |
|---|---|
| APIs hoàn thành trong Sprint | 16/16 (100%) |
| MVP APIs | 14/14 (100%) |
| Optional APIs | 2/2 (100%) |
| Tổng tiến độ dự án sau Sprint 3 | 37/37 APIs (100%) |

---

## 9. Kế Hoạch Sprint Tiếp Theo (Sprint 4)

**Sprint 4 — QA, Docs & Hardening** (Ngày 17 đến Ngày 21 — từ 20/02/2026 đến 24/02/2026)

| Mục tiêu | Nội dung |
|---|---|
| Xử lý lỗi | Global Exception Filter, Custom Exceptions, chuẩn hóa response lỗi |
| Kiểm thử | Postman Collection đầy đủ 37 APIs, test happy path và error cases |
| Tài liệu | Swagger UI với @ApiTags, @ApiOperation, @ApiResponse |
| Tối ưu | Database indexes, loại bỏ N+1 query |
| Bảo mật | CORS whitelist, Helmet, rate limiting |
| Dọn dẹp | Xóa console.log, format Prettier, fix ESLint, cập nhật README |

---

*Báo cáo được tạo ngày 19/02/2026.*
