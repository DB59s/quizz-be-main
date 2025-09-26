# Quiz Application Setup Guide

## Tổng quan hệ thống

Hệ thống bao gồm 2 service chính:
- **Gateway API** (Port 3000): Xử lý authentication và routing
- **User Service API** (Port 3001): Quản lý thông tin người dùng

## Luồng Authentication đã được cập nhật

### 1. Register/Login Flow

```
Client -> Gateway API -> User Service API
```

**Chi tiết luồng:**

1. **Client gọi `/api/auth/register` hoặc `/api/auth/login`**
2. **Gateway tạo Account** trong database của gateway
3. **Gateway gọi User Service** để tạo user profile tương ứng
4. **Nếu User Service thành công**: Trả về token cho client
5. **Nếu User Service thất bại**: Rollback Account ở Gateway và báo lỗi

### 2. Service Communication

Gateway gọi User Service với API Token cứng để bảo mật:
- Header: `Authorization: Bearer user_service_secret_token_2024`

## Cấu hình

### Gateway API (.env.development)

```env
# Development Environment Configuration
NODE_ENV=development
PORT=3000

# Database - MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=quiz_gateway_dev

# TypeORM
DB_SYNCHRONIZE=true
DB_LOGGING=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Google OAuth Configuration (tùy chọn)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# API Base URL
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080
FRONTEND_PATH=/front-end/index.html

# Service URLs
USER_SERVICE_BASEURL=http://localhost:3001

# Service API Tokens
USER_SERVICE_API_TOKEN=user_service_secret_token_2024
```

### User Service API (.env)

```env
# Environment Configuration
NODE_ENV=development
PORT=3001

# MongoDB Configuration
MONGO_URI=mongodb+srv://your-mongo-connection-string

# API Configuration
API_PREFIX=/api/v1

# Security Configuration
API_TOKEN=user_service_secret_token_2024
```

## Các API Endpoints

### Gateway API (Port 3000)

#### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Đăng nhập với Google
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Lấy thông tin tài khoản

#### User Management (Proxy to User Service)
- `GET /api/users/:accountId/:role` - Lấy thông tin user
- `PUT /api/users/:accountId/:role` - Cập nhật thông tin user
- `DELETE /api/users/:accountId/:role` - Xóa user (Admin only)

### User Service API (Port 3001)

#### Direct Access (với API Token)
- `POST /api/v1/users` - Tạo user (được gọi từ Gateway)
- `GET /api/v1/users/:accountId/:role` - Lấy thông tin user
- `PUT /api/v1/users/:accountId/:role` - Cập nhật user
- `DELETE /api/v1/users/:accountId/:role` - Xóa user

## Models đã được cập nhật

### Account (Gateway - MySQL)
```javascript
{
  id: 'uuid',
  email: 'string',
  password_hash: 'string',
  google_id: 'string',
  provider: 'local|google',
  role: 'student|teacher|admin',
  status: 'active|banned|deleted'
}
```

### User Models (User Service - MongoDB)

#### Student
```javascript
{
  account_id: 'string (required)',
  email: 'string (required)',
  full_name: 'string (optional)',
  student_code: 'string (optional)',
  class_name: 'string (optional)',
  phone_number: 'string (optional)',
  profile_completed: 'boolean'
}
```

#### Teacher
```javascript
{
  account_id: 'string (required)',
  email: 'string (required)',
  full_name: 'string (optional)',
  teacher_code: 'string (optional)',
  department: 'string (optional)',
  phone_number: 'string (optional)',
  profile_completed: 'boolean'
}
```

#### Admin
```javascript
{
  account_id: 'string (required)',
  email: 'string (required)',
  full_name: 'string (optional)',
  phone_number: 'string (optional)',
  profile_completed: 'boolean'
}
```

## Cách chạy ứng dụng

### 1. Chuẩn bị Database

**MySQL cho Gateway:**
```sql
CREATE DATABASE quiz_gateway_dev;
```

**MongoDB cho User Service:**
- Tạo database trên MongoDB Atlas hoặc local MongoDB

### 2. Cài đặt dependencies

```bash
# Gateway API
cd gateway-api
npm install

# User Service API
cd user-service-api
npm install
```

### 3. Tạo file .env

Tạo file `.env.development` cho Gateway và `.env` cho User Service theo cấu hình ở trên.

### 4. Chạy services

```bash
# Terminal 1 - User Service (chạy trước)
cd user-service-api
npm start

# Terminal 2 - Gateway API
cd gateway-api
npm run dev
```

## Testing

### 1. Đăng ký tài khoản mới

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "123456",
    "role": "student"
  }'
```

### 2. Đăng nhập

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "123456"
  }'
```

### 3. Lấy thông tin user

```bash
curl -X GET http://localhost:3000/api/users/{accountId}/student \
  -H "Authorization: Bearer {accessToken}"
```

## Rollback Mechanism

Khi tạo tài khoản:
1. Gateway tạo Account thành công
2. Gateway gọi User Service tạo User profile
3. **Nếu User Service thất bại**: Gateway tự động xóa Account đã tạo
4. **Nếu có lỗi khác**: Gateway có emergency rollback

## Middleware Security

Gateway Middleware đã được cập nhật để:
- Verify JWT token của client
- Thêm API token khi gọi User Service
- Forward thông tin user (account_id, role) trong headers
- Xử lý lỗi và timeout

## Lưu ý quan trọng

1. **API Token**: `USER_SERVICE_API_TOKEN` phải giống nhau ở cả Gateway và User Service
2. **Database**: Gateway dùng MySQL, User Service dùng MongoDB
3. **Port**: Gateway (3000), User Service (3001)
4. **Role Consistency**: Gateway và User Service đều sử dụng role `student`, `teacher`, `admin`
5. **Profile Completion**: User có thể đăng ký với thông tin cơ bản, hoàn thiện profile sau 