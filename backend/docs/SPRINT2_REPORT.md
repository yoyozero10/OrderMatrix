# BÁO CÁO SPRINT 2 — Cart & Orders

**Dự án:** Website Đặt Hàng và Quản Lý Đơn Hàng

**Framework:** NestJS 10 + TypeORM + MySQL

**Sprint:** Sprint 2 / 4

**Thời gian:** Ngày 8 đến Ngày 12 (Tuần 2 — từ 09/02/2026 đến 13/02/2026)

**Ngày báo cáo:** 13/02/2026

**Thành viên thực hiện:** 23521432 - Trần Đại Thắng, 23521571 - Kim Thành Tiến

---

## 1. Mục Tiêu Sprint

Sprint 2 tập trung hoàn thiện luồng mua hàng cốt lõi của hệ thống, bao gồm:

- Xây dựng module Giỏ hàng (Cart): thêm, sửa, xóa sản phẩm trong giỏ
- Xây dựng module Đơn hàng (Orders): đặt hàng, xem danh sách, xem chi tiết và hủy đơn
- Đảm bảo tính toàn vẹn dữ liệu trong quá trình thanh toán bằng database transaction

---

## 2. Phạm Vi Công Việc

### 2.1 Tổng Số APIs Trong Sprint

| Module | Số APIs | Loại |
|---|---|---|
| Cart | 5 | 5 MVP |
| Orders | 4 | 3 MVP + 1 Optional |
| **Tổng** | **9** | **8 MVP + 1 Optional** |

### 2.2 Tổng Tiến Độ Tích Lũy

| Sprint | APIs | Tích lũy |
|---|---|---|
| Sprint 1 (Tuần 1) | 12 APIs | 12/37 |
| Sprint 2 (Tuần 2) | 9 APIs | 21/37 |

---

## 3. Chi Tiết Công Việc Theo Ngày

### Ngày 8 (09/02/2026) — Cart Entities & View Cart

#### Buổi sáng — Tạo Entities

- Tạo Cart Entity tại `cart/entities/cart.entity.ts`
  - Quan hệ: OneToOne với User (mỗi user có 1 giỏ hàng duy nhất)
  - Quan hệ: OneToMany với CartItem (cascade)

- Tạo CartItem Entity tại `cart/entities/cart-item.entity.ts`
  - Quan hệ: ManyToOne với Cart (onDelete CASCADE)
  - Quan hệ: ManyToOne với Product
  - Trường: quantity (số lượng)

- Generate Cart Module (module, service, controller)

#### Buổi chiều

- **API 13/37 — GET /cart [MVP]**
  - Lấy hoặc tạo mới giỏ hàng cho user hiện tại
  - Tải danh sách CartItem kèm thông tin sản phẩm
  - Tính subtotal cho từng item (giá x số lượng)
  - Tính tổng số lượng (totalItems) và tổng tiền (totalAmount)
  - Trả về giỏ hàng kèm các trường tính toán

**Kết quả Ngày 8:** Cart Entity hoàn chỉnh, API xem giỏ hàng hoạt động đúng.

---

### Ngày 9 (10/02/2026) — Cart Mutations

#### Buổi sáng

- **API 14/37 — POST /cart/items [MVP]**
  - Validate đầu vào bằng `AddToCartDto` (productId, quantity)
  - Kiểm tra sản phẩm tồn tại trong DB
  - Kiểm tra tồn kho đủ số lượng yêu cầu
  - Nếu sản phẩm đã có trong giỏ: cộng thêm số lượng
  - Nếu sản phẩm chưa có: tạo CartItem mới
  - Trả về giỏ hàng đã cập nhật
  - Lỗi: `CART_OUT_OF_STOCK` nếu tồn kho không đủ

- **API 15/37 — PUT /cart/items/:id [MVP]**
  - Validate đầu vào bằng `UpdateCartItemDto` (quantity)
  - Xác minh CartItem thuộc về user hiện tại
  - Kiểm tra tồn kho đủ số lượng mới
  - Cập nhật số lượng
  - Trả về giỏ hàng đã cập nhật

#### Buổi chiều

- **API 16/37 — DELETE /cart/items/:id [MVP]**
  - Xác minh CartItem thuộc về user hiện tại
  - Xóa CartItem khỏi giỏ hàng
  - Trả về giỏ hàng đã cập nhật

- **API 17/37 — DELETE /cart [MVP]**
  - Xóa toàn bộ CartItem trong giỏ hàng của user
  - Trả về success message

**Kết quả Ngày 9:** 5 APIs Cart hoàn chỉnh, kiểm tra tồn kho và phân quyền đúng.

---

### Ngày 10 (11/02/2026) — Order Entities & Setup

#### Buổi sáng — Tạo Entities

- Tạo Order Entity tại `orders/entities/order.entity.ts`
  - Trường: orderCode (unique), totalAmount, shippingAddress (JSON), paymentMethod, paymentStatus, orderStatus
  - Enum paymentMethod: COD, MOCK
  - Enum paymentStatus: pending, paid, failed
  - Enum orderStatus: pending, processing, shipping, completed, cancelled
  - Quan hệ: ManyToOne với User; OneToMany với OrderItem (cascade)

- Tạo OrderItem Entity tại `orders/entities/order-item.entity.ts`
  - Trường snapshot: productNameSnapshot, unitPriceSnapshot
  - Trường: quantity, subtotal
  - Quan hệ: ManyToOne với Order (onDelete CASCADE); ManyToOne với Product

- Tạo OrderStatusHistory Entity tại `orders/entities/order-status-history.entity.ts` [Optional]

#### Buổi chiều

- Generate Orders Module (module, service, controller)
- Tạo State Machine Validator cho trạng thái đơn hàng:
  - pending -> processing, cancelled
  - processing -> shipping, cancelled
  - shipping -> completed, cancelled
  - completed -> (không chuyển tiếp)
  - cancelled -> (không chuyển tiếp)

**Kết quả Ngày 10:** Order Entity và state machine hoàn chỉnh, sẵn sàng implement API.

---

### Ngày 11 (12/02/2026) — Checkout (API quan trọng nhất Sprint)

#### Cả ngày — Implement Checkout

- **API 18/37 — POST /orders [MVP]**
  - Validate đầu vào bằng `CreateOrderDto` (shippingAddress, paymentMethod)
  - Kiểm tra giỏ hàng không rỗng
  - Bắt đầu Database Transaction:
    - Với mỗi CartItem: kiểm tra tồn kho bằng khóa `FOR UPDATE`
    - Nếu tồn kho nhỏ hơn số lượng yêu cầu: Rollback, trả về lỗi `CART_OUT_OF_STOCK`
  - Tạo mã đơn hàng theo định dạng `ORD-YYYYMMDD-XXXX`
  - Tạo bản ghi Order
  - Tạo OrderItem với dữ liệu snapshot:
    - productNameSnapshot = tên sản phẩm tại thời điểm đặt hàng
    - unitPriceSnapshot = giá sản phẩm tại thời điểm đặt hàng
    - subtotal = unitPriceSnapshot x quantity
  - Cập nhật tồn kho bằng câu lệnh atomic: `UPDATE products SET stock = stock - quantity WHERE id = ?`
  - Ghi OrderStatusHistory [Optional]
  - Xóa giỏ hàng sau khi đặt hàng thành công
  - Commit Transaction
  - Trả về thông tin đơn hàng vừa tạo
  - Test kịch bản concurrent requests (chống oversell)

**Kết quả Ngày 11:** API Checkout hoạt động đúng, transaction đảm bảo tính toàn vẹn dữ liệu, không xảy ra oversell.

---

### Ngày 12 (13/02/2026) — Order Queries & Cancel

#### Buổi sáng

- **API 19/37 — GET /orders [MVP]**
  - Lọc theo user hiện tại (chỉ xem đơn của mình)
  - Phân trang (page, limit)
  - Lọc theo trạng thái đơn hàng (tùy chọn)
  - Sắp xếp theo createdAt giảm dần
  - Trả về danh sách tóm tắt (không bao gồm danh sách items)

- **API 20/37 — GET /orders/:id [MVP]**
  - Xác minh đơn hàng thuộc về user hiện tại
  - Trả về đầy đủ thông tin đơn hàng kèm danh sách OrderItem
  - Include lịch sử trạng thái [Optional]
  - Lỗi: `ORDER_NOT_FOUND` nếu không tìm thấy; `FORBIDDEN_RESOURCE` nếu không phải của user

#### Buổi chiều

- **API 21/37 — PUT /orders/:id/cancel [Optional]**
  - Xác minh đơn hàng thuộc về user hiện tại
  - Kiểm tra trạng thái hiện tại phải là `pending`
  - Bắt đầu Transaction:
    - Cập nhật orderStatus sang `cancelled`
    - Khôi phục tồn kho bằng câu lệnh atomic: `UPDATE products SET stock = stock + quantity WHERE id = ?`
    - Ghi OrderStatusHistory [Optional]
  - Commit Transaction
  - Lỗi: `ORDER_INVALID_TRANSITION` nếu đơn không ở trạng thái `pending`

**Kết quả Ngày 12:** Toàn bộ 9 APIs của Sprint 2 hoàn thành, luồng mua hàng đầu đủ từ đầu đến cuối.

---

## 4. Kết Quả Bàn Giao (Deliverables)

| STT | Hạng mục bàn giao | Trạng thái |
|---|---|---|
| 1 | Cart Module hoàn chỉnh (5 APIs) | Hoàn thành |
| 2 | Order Module hoàn chỉnh (4 APIs) | Hoàn thành |
| 3 | API Checkout sử dụng database transaction | Hoàn thành |
| 4 | Cơ chế chống oversell bằng FOR UPDATE lock | Hoàn thành |
| 5 | OrderItem lưu snapshot tên và giá sản phẩm | Hoàn thành |
| 6 | State machine kiểm soát chuyển trạng thái đơn hàng | Hoàn thành |
| 7 | Test concurrent requests (kịch bản oversell) | Hoàn thành |
| 8 | Postman Collection cập nhật thêm 9 APIs | Hoàn thành |

---

## 5. Danh Sách APIs Đã Hoàn Thành

| STT | Method | Endpoint | Loại | Xác thực |
|---|---|---|---|---|
| 13 | GET | /cart | MVP | JWT |
| 14 | POST | /cart/items | MVP | JWT |
| 15 | PUT | /cart/items/:id | MVP | JWT |
| 16 | DELETE | /cart/items/:id | MVP | JWT |
| 17 | DELETE | /cart | MVP | JWT |
| 18 | POST | /orders | MVP | JWT |
| 19 | GET | /orders | MVP | JWT |
| 20 | GET | /orders/:id | MVP | JWT |
| 21 | PUT | /orders/:id/cancel | Optional | JWT |

---

## 6. Mã Lỗi Nghiệp Vụ Đã Triển Khai

| Mã lỗi | HTTP Status | Mô tả |
|---|---|---|
| CART_OUT_OF_STOCK | 400 | Sản phẩm không đủ tồn kho |
| ORDER_NOT_FOUND | 404 | Không tìm thấy đơn hàng |
| FORBIDDEN_RESOURCE | 403 | Đơn hàng không thuộc về user hiện tại |
| ORDER_INVALID_TRANSITION | 400 | Trạng thái đơn hàng không cho phép thực hiện hành động này |

---

## 7. Vấn Đề Gặp Phải & Giải Pháp

| Vấn đề | Giải pháp |
|---|---|
| Oversell xảy ra khi nhiều request đồng thời | Sử dụng FOR UPDATE lock trong transaction, kiểm tra tồn kho ở cấp DB |
| Giá sản phẩm thay đổi sau khi đặt hàng ảnh hưởng đơn cũ | Lưu snapshot unitPriceSnapshot vào OrderItem tại thời điểm đặt hàng |
| Transaction không rollback khi có lỗi | Sử dụng try/catch bên trong transaction, gọi rollback() khi bắt lỗi |
| Cart không tự tạo khi user chưa có | Dùng logic "get or create" trong CartService |

---

## 8. Tiến Độ So Với Kế Hoạch

| Tiêu chí | Kết quả |
|---|---|
| APIs hoàn thành trong Sprint | 9/9 (100%) |
| MVP APIs | 8/8 (100%) |
| Optional APIs | 1/1 (100%) |
| Tổng tiến độ dự án sau Sprint 2 | 21/37 APIs (56,8%) |

---

## 9. Kế Hoạch Sprint Tiếp Theo (Sprint 3)

**Sprint 3 — Admin Modules** (Ngày 13 đến Ngày 16 — từ 16/02/2026 đến 19/02/2026)

| Mục tiêu | Nội dung |
|---|---|
| Admin Products | 3 APIs MVP + 2 Optional (tạo, sửa, xóa, upload ảnh) |
| Admin Categories | 3 APIs MVP (tạo, sửa, xóa danh mục) |
| Admin Orders | 4 APIs MVP (danh sách, chi tiết, cập nhật trạng thái, thống kê) |
| Admin Users | 4 APIs MVP (danh sách, chi tiết, khóa tài khoản, đổi vai trò) |

---

*Báo cáo được tạo ngày 13/02/2026.*
