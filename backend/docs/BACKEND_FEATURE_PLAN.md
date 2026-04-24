# Backend Feature Plan

## Muc tieu

Tai lieu nay tong hop:
- cac chuc nang co ban da co trong backend;
- cac khoang trong can hoan thien de dat muc san sang ban giao;
- backlog tinh nang theo muc uu tien de phat trien tiep.

## Hien trang

### Da co

- Xac thuc: register, login, refresh token, logout, forgot/reset password.
- Quan ly user: xem profile, cap nhat profile, doi mat khau.
- Public catalog: danh sach category, danh sach san pham, chi tiet san pham.
- Gio hang: xem, them, sua so luong, xoa item, xoa toan bo.
- Don hang: tao don, danh sach don cua user, chi tiet don, huy don.
- Admin: CRUD category, CRUD product, quan ly image, quan ly user, quan ly order, thong ke order.
- Nen tang: Swagger, validation, rate limiting, helmet, CORS, logging.

### Chua hoan thien

- Test tu dong moi o muc co ban, chua bao phu business flow quan trong.
- E2E/integration chua co test voi database test rieng.
- Password reset moi o muc mock logger, chua gui email that.
- Quan ly anh san pham moi dung image URL, chua co upload media.
- Database dang dung `synchronize: true`, chua co migration.
- Chua co cac tinh nang kinh doanh nang cao nhu thanh toan online, voucher, danh gia san pham.

## Uu tien thuc hien

### Phase 1 - On dinh MVP

- Hoan thien unit test cho service business quan trong:
  - `AuthService`
  - `CartService`
  - `OrdersService`
  - `UsersService`
- Bo sung integration/e2e test cho luong:
  - register -> login -> add to cart -> checkout
  - admin -> update order status
  - cancel order -> restore stock
- Tach moi truong test DB rieng.
- Them migration va bo `synchronize: true` khoi moi truong van hanh.
- Ra soat error response va ma loi de frontend dung on dinh.

### Phase 2 - Tinh nang can bo sung som

- Thanh toan online:
  - MoMo, VNPay hoac Stripe tuy dinh huong du an.
- Upload file that cho anh san pham:
  - local storage hoac cloud storage.
- Gui email that cho quen mat khau.
- Bo sung dashboard admin:
  - doanh thu theo thang
  - top san pham
  - tong quan user/order
- Quan ly dia chi giao hang cho user.

### Phase 3 - Tinh nang mo rong

- Voucher va coupon.
- Danh gia/binh luan san pham.
- Yeu thich san pham/wishlist.
- Theo doi lich su van chuyen.
- Thong bao email hoac in-app khi don hang doi trang thai.
- Soft delete cho mot so tai nguyen quan trong.

## De xuat sprint gan nhat

### Sprint 1

- Fix va nang cap test hien co.
- Them test cho checkout va order status transition.
- Chuan hoa migration.
- Xac nhan full flow voi Postman/Swagger.

### Sprint 2

- Tich hop upload anh that.
- Tich hop email reset password.
- Mo rong thong ke admin.

### Sprint 3

- Tich hop cong thanh toan.
- Them voucher.
- Them danh gia san pham.

## Tieu chi xem la hoan chinh

- Build xanh.
- Unit test xanh.
- E2E/integration test cho luong chinh xanh.
- DB migration chay duoc tren moi truong moi.
- Khong phu thuoc vao mock cho cac tinh nang quan trong.
- Tai lieu API va env cap nhat day du.
