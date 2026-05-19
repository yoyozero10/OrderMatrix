# FRONTEND API SPECIFICATION
## Website Đặt Hàng và Quản Lý Đơn Hàng

**Base URL:** `http://localhost:3001/api` (Development)  
**Production URL:** `https://api.yourdomain.com/api`

**Authentication:** JWT Bearer Token (gửi trong header `Authorization: Bearer {token}`)

---

## 📋 MỤC LỤC

1. [Authentication APIs](#1-authentication-apis)
2. [User APIs](#2-user-apis)
3. [Products APIs](#3-products-apis)
4. [Categories APIs](#4-categories-apis)
5. [Cart APIs](#5-cart-apis)
6. [Orders APIs](#6-orders-apis)
7. [Admin - Products APIs](#7-admin---products-apis)
8. [Admin - Categories APIs](#8-admin---categories-apis)
9. [Admin - Orders APIs](#9-admin---orders-apis)
10. [Admin - Users APIs](#10-admin---users-apis)
11. [Error Codes](#11-error-codes)
12. [TypeScript Types](#12-typescript-types)

---

## 1. AUTHENTICATION APIs

### 1.1. Đăng ký **[MVP]**

```typescript
POST /auth/register
```

**Request Body:**
```typescript
{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567"
}
```

**Response (201 Created):**
```typescript
{
  "message": "Đăng ký thành công",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "role": "customer",
    "status": "active",
    "createdAt": "2026-01-25T02:00:00Z"
  }
}
```

**Errors:**
- `400 AUTH_EMAIL_EXISTS` - Email đã được sử dụng
- `400 VALIDATION_FAILED` - Dữ liệu không hợp lệ

---

### 1.2. Đăng nhập **[MVP]**

```typescript
POST /auth/login
```

**Request Body:**
```typescript
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```typescript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "customer",
    "avatar": "https://..."
  }
}
```

**Errors:**
- `401 AUTH_INVALID_CREDENTIALS` - Email hoặc mật khẩu không chính xác
- `403 AUTH_ACCOUNT_LOCKED` - Tài khoản đã bị khóa

**Frontend Usage:**
```typescript
// Lưu token vào localStorage
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('user', JSON.stringify(response.user));

// Redirect theo role
if (response.user.role === 'admin') {
  router.push('/admin/dashboard');
} else {
  router.push('/');
}
```

---

### 1.3. Đăng xuất **[Optional]**

```typescript
POST /auth/logout
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "message": "Đăng xuất thành công"
}
```

---

### 1.4. Refresh Token **[Optional]**

```typescript
POST /auth/refresh
```

**Request Body:**
```typescript
{
  "refreshToken": "..."
}
```

**Response (200 OK):**
```typescript
{
  "accessToken": "new_token..."
}
```

---

## 2. USER APIs

### 2.1. Xem thông tin cá nhân **[MVP]**

```typescript
GET /users/me
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567",
  "avatar": "https://...",
  "role": "customer",
  "status": "active",
  "createdAt": "2026-01-25T02:00:00Z",
  "updatedAt": "2026-01-25T02:00:00Z"
}
```

---

### 2.2. Cập nhật thông tin **[MVP]**

```typescript
PUT /users/me
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "fullName": "Nguyễn Văn B",
  "phone": "0907654321",
  "avatar": "https://..." // Optional
}
```

**Response (200 OK):**
```typescript
{
  "message": "Cập nhật thành công",
  "user": { /* updated user object */ }
}
```

---

### 2.3. Đổi mật khẩu **[MVP]**

```typescript
PUT /users/me/password
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "oldPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response (200 OK):**
```typescript
{
  "message": "Đổi mật khẩu thành công"
}
```

**Errors:**
- `401 AUTH_INVALID_CREDENTIALS` - Mật khẩu cũ không đúng

---

## 3. PRODUCTS APIs

### 3.1. Danh sách sản phẩm **[MVP]**

```typescript
GET /products?page=1&limit=12&search=&category=&minPrice=&maxPrice=&sort=
```

**Query Parameters:**
- `page` (number, default: 1) - Trang hiện tại
- `limit` (number, default: 12) - Số sản phẩm/trang
- `search` (string, optional) - Tìm kiếm theo tên, mô tả
- `category` (string, optional) - Filter theo category ID
- `minPrice` (number, optional) - Giá tối thiểu
- `maxPrice` (number, optional) - Giá tối đa
- `sort` (string, optional) - Sắp xếp: `price_asc`, `price_desc`, `newest`, `popular`

**Response (200 OK):**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro Max",
      "description": "Mô tả sản phẩm...",
      "price": 29990000,
      "stock": 50,
      "status": "active",
      "category": {
        "id": "uuid",
        "name": "Điện thoại"
      },
      "images": [
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "isPrimary": true,
          "displayOrder": 0
        }
      ],
      "createdAt": "2026-01-25T02:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "totalPages": 9
  }
}
```

**Frontend Usage:**
```typescript
// Fetch products with filters
const fetchProducts = async (filters: ProductFilters) => {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: '12',
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.sort && { sort: filters.sort })
  });
  
  const response = await axios.get(`/products?${params}`);
  return response.data;
};
```

---

### 3.2. Chi tiết sản phẩm **[MVP]**

```typescript
GET /products/:id
```

**Response (200 OK):**
```typescript
{
  "id": "uuid",
  "name": "iPhone 15 Pro Max",
  "description": "Mô tả chi tiết...",
  "price": 29990000,
  "stock": 50,
  "status": "active",
  "category": {
    "id": "uuid",
    "name": "Điện thoại",
    "description": "..."
  },
  "images": [
    {
      "id": "uuid",
      "imageUrl": "https://...",
      "isPrimary": true,
      "displayOrder": 0
    }
  ],
  "createdAt": "2026-01-25T02:00:00Z",
  "updatedAt": "2026-01-25T02:00:00Z"
}
```

**Errors:**
- `404 PRODUCT_NOT_FOUND` - Không tìm thấy sản phẩm

---

## 4. CATEGORIES APIs

### 4.1. Danh sách danh mục **[MVP]**

```typescript
GET /categories
```

**Response (200 OK):**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "name": "Điện thoại",
      "description": "Điện thoại thông minh",
      "image": "https://...",
      "productCount": 45, // Số sản phẩm trong danh mục
      "createdAt": "2026-01-25T02:00:00Z"
    }
  ]
}
```

---

## 5. CART APIs

### 5.1. Xem giỏ hàng **[MVP]**

```typescript
GET /cart
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "id": "cart-uuid",
  "items": [
    {
      "id": "cart-item-uuid",
      "product": {
        "id": "product-uuid",
        "name": "iPhone 15 Pro Max",
        "price": 29990000,
        "stock": 50,
        "image": "https://..." // Primary image
      },
      "quantity": 2,
      "subtotal": 59980000
    }
  ],
  "totalItems": 2,
  "totalAmount": 59980000,
  "updatedAt": "2026-01-25T02:00:00Z"
}
```

---

### 5.2. Thêm sản phẩm vào giỏ **[MVP]**

```typescript
POST /cart/items
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "productId": "uuid",
  "quantity": 1
}
```

**Response (201 Created):**
```typescript
{
  "message": "Đã thêm vào giỏ hàng",
  "cart": { /* cart object */ }
}
```

**Errors:**
- `400 CART_OUT_OF_STOCK` - Sản phẩm không đủ số lượng (còn X)
- `404 PRODUCT_NOT_FOUND` - Không tìm thấy sản phẩm

---

### 5.3. Cập nhật số lượng **[MVP]**

```typescript
PUT /cart/items/:id
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "quantity": 3
}
```

**Response (200 OK):**
```typescript
{
  "message": "Đã cập nhật giỏ hàng",
  "cart": { /* cart object */ }
}
```

---

### 5.4. Xóa sản phẩm **[MVP]**

```typescript
DELETE /cart/items/:id
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "message": "Đã xóa khỏi giỏ hàng",
  "cart": { /* cart object */ }
}
```

---

### 5.5. Xóa toàn bộ giỏ **[MVP]**

```typescript
DELETE /cart
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "message": "Đã xóa toàn bộ giỏ hàng"
}
```

---

## 6. ORDERS APIs

### 6.1. Đặt hàng **[MVP]**

```typescript
POST /orders
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "shippingAddress": {
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Đường ABC",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP. Hồ Chí Minh"
  },
  "paymentMethod": "COD" // hoặc "MOCK"
}
```

**Response (201 Created):**
```typescript
{
  "message": "Đặt hàng thành công",
  "order": {
    "id": "uuid",
    "orderCode": "ORD-20260125-0001",
    "userId": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productNameSnapshot": "iPhone 15 Pro Max",
        "unitPriceSnapshot": 29990000,
        "quantity": 2,
        "subtotal": 59980000
      }
    ],
    "totalAmount": 59980000,
    "shippingAddress": { /* address object */ },
    "paymentMethod": "COD",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "createdAt": "2026-01-25T02:00:00Z"
  }
}
```

**Errors:**
- `400 CART_EMPTY` - Giỏ hàng trống
- `400 CART_OUT_OF_STOCK` - Sản phẩm X không đủ số lượng (còn Y)
- `500 ORDER_CREATE_FAILED` - Lỗi hệ thống, vui lòng thử lại

---

### 6.2. Danh sách đơn hàng của tôi **[MVP]**

```typescript
GET /orders?page=1&limit=10&status=
Headers: Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string, optional) - Filter: `pending`, `processing`, `shipping`, `completed`, `cancelled`

**Response (200 OK):**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "orderCode": "ORD-20260125-0001",
      "totalAmount": 59980000,
      "orderStatus": "pending",
      "paymentMethod": "COD",
      "paymentStatus": "pending",
      "itemCount": 2,
      "createdAt": "2026-01-25T02:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 6.3. Chi tiết đơn hàng **[MVP]**

```typescript
GET /orders/:id
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "id": "uuid",
  "orderCode": "ORD-20260125-0001",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productNameSnapshot": "iPhone 15 Pro Max",
      "unitPriceSnapshot": 29990000,
      "quantity": 2,
      "subtotal": 59980000
    }
  ],
  "totalAmount": 59980000,
  "shippingAddress": {
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Đường ABC",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP. Hồ Chí Minh"
  },
  "paymentMethod": "COD",
  "paymentStatus": "pending",
  "orderStatus": "pending",
  "statusHistory": [ // [Optional] nếu có bảng order_status_history
    {
      "fromStatus": null,
      "toStatus": "pending",
      "changedBy": "customer",
      "note": null,
      "createdAt": "2026-01-25T02:00:00Z"
    }
  ],
  "createdAt": "2026-01-25T02:00:00Z",
  "updatedAt": "2026-01-25T02:00:00Z"
}
```

**Errors:**
- `404 ORDER_NOT_FOUND` - Không tìm thấy đơn hàng
- `403 FORBIDDEN_RESOURCE` - Không có quyền xem đơn hàng này

---

### 6.4. Hủy đơn hàng **[Optional]**

```typescript
PUT /orders/:id/cancel
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "reason": "Đặt nhầm sản phẩm" // Optional
}
```

**Response (200 OK):**
```typescript
{
  "message": "Đã hủy đơn hàng",
  "order": { /* updated order object */ }
}
```

**Errors:**
- `400 ORDER_INVALID_TRANSITION` - Đơn hàng đã được xử lý, không thể hủy

---

## 7. ADMIN - PRODUCTS APIs

### 7.1. Thêm sản phẩm **[MVP]**

```typescript
POST /admin/products
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "name": "iPhone 15 Pro Max",
  "description": "Mô tả sản phẩm...",
  "price": 29990000,
  "stock": 50,
  "categoryId": "uuid",
  "status": "active"
}
```

**Response (201 Created):**
```typescript
{
  "message": "Thêm sản phẩm thành công",
  "product": { /* product object */ }
}
```

---

### 7.2. Sửa sản phẩm **[MVP]**

```typescript
PUT /admin/products/:id
Headers: Authorization: Bearer {token}
```

**Request Body:** (Tương tự POST, tất cả fields optional)

**Response (200 OK):**
```typescript
{
  "message": "Cập nhật sản phẩm thành công",
  "product": { /* updated product object */ }
}
```

---

### 7.3. Xóa sản phẩm **[MVP]**

```typescript
DELETE /admin/products/:id
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "message": "Xóa sản phẩm thành công"
}
```

---

## 8. ADMIN - CATEGORIES APIs

### 8.1. Thêm danh mục **[MVP]**

```typescript
POST /admin/categories
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "name": "Điện thoại",
  "description": "Điện thoại thông minh",
  "image": "https://..." // Optional
}
```

---

### 8.2. Sửa danh mục **[MVP]**

```typescript
PUT /admin/categories/:id
Headers: Authorization: Bearer {token}
```

---

### 8.3. Xóa danh mục **[MVP]**

```typescript
DELETE /admin/categories/:id
Headers: Authorization: Bearer {token}
```

---

## 9. ADMIN - ORDERS APIs

### 9.1. Xem tất cả đơn hàng **[MVP]**

```typescript
GET /admin/orders?page=1&limit=20&status=&search=
Headers: Authorization: Bearer {token}
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - Filter theo trạng thái
- `search` - Tìm theo order code hoặc customer name

**Response:** (Tương tự GET /orders nhưng có tất cả đơn hàng)

---

### 9.2. Cập nhật trạng thái **[MVP]**

```typescript
PUT /admin/orders/:id/status
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "status": "processing", // pending|processing|shipping|completed|cancelled
  "note": "Đã xác nhận đơn hàng" // Optional
}
```

**Response (200 OK):**
```typescript
{
  "message": "Cập nhật trạng thái thành công",
  "order": { /* updated order object */ }
}
```

**Errors:**
- `400 ORDER_INVALID_TRANSITION` - Không thể chuyển từ X sang Y

**Allowed Transitions:**
```
pending → processing, cancelled
processing → shipping, cancelled
shipping → completed, cancelled
completed → (không thể chuyển)
cancelled → (không thể chuyển)
```

---

### 9.3. Thống kê đơn hàng **[MVP]**

```typescript
GET /admin/orders/stats
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "totalOrders": 150,
  "totalRevenue": 450000000,
  "ordersByStatus": {
    "pending": 10,
    "processing": 20,
    "shipping": 15,
    "completed": 100,
    "cancelled": 5
  },
  "revenueByMonth": [
    { "month": "2026-01", "revenue": 150000000 },
    { "month": "2026-02", "revenue": 200000000 }
  ]
}
```

---

## 10. ADMIN - USERS APIs

### 10.1. Danh sách người dùng **[MVP]**

```typescript
GET /admin/users?page=1&limit=20&search=&role=
Headers: Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567",
      "role": "customer",
      "status": "active",
      "orderCount": 5,
      "totalSpent": 15000000,
      "createdAt": "2026-01-25T02:00:00Z"
    }
  ],
  "meta": { /* pagination */ }
}
```

---

### 10.2. Khóa/Mở khóa tài khoản **[MVP]**

```typescript
PUT /admin/users/:id/status
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "status": "inactive" // hoặc "active"
}
```

---

### 10.3. Phân quyền **[MVP]**

```typescript
PUT /admin/users/:id/role
Headers: Authorization: Bearer {token}
```

**Request Body:**
```typescript
{
  "role": "admin" // hoặc "customer"
}
```

---

## 11. ERROR CODES

### Standard Error Response Format:

```typescript
{
  "statusCode": 400,
  "errorCode": "CART_OUT_OF_STOCK",
  "message": "Sản phẩm iPhone 15 Pro Max không đủ số lượng (còn 5)",
  "timestamp": "2026-01-25T02:00:00Z",
  "path": "/api/cart/items"
}
```

### Error Codes List:

#### Authentication (401, 403)
- `AUTH_INVALID_CREDENTIALS` - Email hoặc mật khẩu không chính xác
- `AUTH_EMAIL_EXISTS` - Email đã được sử dụng
- `AUTH_ACCOUNT_LOCKED` - Tài khoản đã bị khóa
- `AUTH_TOKEN_EXPIRED` - Token hết hạn
- `AUTH_TOKEN_INVALID` - Token không hợp lệ

#### Cart (400)
- `CART_EMPTY` - Giỏ hàng trống
- `CART_OUT_OF_STOCK` - Sản phẩm không đủ số lượng
- `CART_ITEM_NOT_FOUND` - Không tìm thấy sản phẩm trong giỏ

#### Order (400, 404)
- `ORDER_NOT_FOUND` - Không tìm thấy đơn hàng
- `ORDER_CREATE_FAILED` - Tạo đơn hàng thất bại
- `ORDER_INVALID_TRANSITION` - Không thể chuyển trạng thái
- `ORDER_CANNOT_CANCEL` - Không thể hủy đơn hàng

#### Product (404)
- `PRODUCT_NOT_FOUND` - Không tìm thấy sản phẩm
- `PRODUCT_OUT_OF_STOCK` - Sản phẩm hết hàng

#### Permission (403)
- `FORBIDDEN_ROLE` - Không có quyền truy cập
- `FORBIDDEN_RESOURCE` - Không có quyền với tài nguyên này

#### Validation (400)
- `VALIDATION_FAILED` - Dữ liệu không hợp lệ

---

## 12. TYPESCRIPT TYPES

### Shared Types:

```typescript
// User
interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar?: string;
  role: 'customer' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Category
interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
  createdAt: string;
}

// Product Image
interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

// Product
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  category: Category;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

// Cart Item
interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string;
  };
  quantity: number;
  subtotal: number;
}

// Cart
interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: string;
}

// Shipping Address
interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
}

// Order Item
interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

// Order
interface Order {
  id: string;
  orderCode: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'MOCK';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

// Order Status History
interface OrderStatusHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string;
  note?: string;
  createdAt: string;
}

// Pagination Meta
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response
interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

// Error Response
interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path: string;
}
```

### API Request Types:

```typescript
// Auth
interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Cart
interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

// Order
interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'MOCK';
}

interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

// Product (Admin)
interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  status: 'active' | 'inactive';
}
```

---

## 📝 FRONTEND IMPLEMENTATION TIPS

### 1. Axios Setup

```typescript
// lib/axios.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Request interceptor - attach token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 2. React Query Setup

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';

export const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '12',
        ...(filters.search && { search: filters.search }),
      });
      const { data } = await axios.get(`/products?${params}`);
      return data;
    },
  });
};
```

### 3. Error Handling

```typescript
// utils/errorHandler.ts
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.errorCode) {
    const errorCode = error.response.data.errorCode;
    const errorMessages: Record<string, string> = {
      'AUTH_INVALID_CREDENTIALS': 'Email hoặc mật khẩu không chính xác',
      'CART_OUT_OF_STOCK': error.response.data.message,
      'ORDER_INVALID_TRANSITION': 'Không thể thay đổi trạng thái đơn hàng',
      // ... more error codes
    };
    return errorMessages[errorCode] || error.response.data.message;
  }
  return 'Đã có lỗi xảy ra, vui lòng thử lại';
};
```

---

**Lưu ý:** Tài liệu này dựa trên PRD, có thể có thay đổi nhỏ khi implement backend. Luôn check với backend developer để đảm bảo đồng bộ.
