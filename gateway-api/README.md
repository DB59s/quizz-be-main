# Base Backend NodeJS với Google OAuth

Một base backend sử dụng NodeJS, ExpressJS và TypeORM với cấu trúc rõ ràng, dễ mở rộng và tích hợp Google OAuth server-side flow.

## 🛠 Công nghệ sử dụng

- **NodeJS** với **ExpressJS**
- **TypeORM** để kết nối database
- **MySQL** hoặc **PostgreSQL** (có thể chọn trong config)
- **JavaScript** (ES6+)
- **Google OAuth 2.0** (Server-side flow)
- **JWT** cho authentication
- **bcrypt** cho password hashing

## 📁 Cấu trúc dự án

```
project-root/
├── src/
│   ├── config/          # Cấu hình chung
│   │   ├── env.js       # Quản lý biến môi trường
│   │   ├── data-source.js # Cấu hình TypeORM
│   │   ├── cors.js      # Cấu hình CORS
│   │   └── index.js     # Export tất cả config
│   ├── entity/          # Entity cho TypeORM
│   │   └── User.js
│   ├── model/           # Model cho business logic
│   │   └── User.js
│   ├── service/         # Business logic
│   │   ├── userService.js
│   │   └── index.js
│   ├── controller/      # Xử lý request/response
│   │   ├── userController.js
│   │   └── index.js
│   ├── router/          # Định nghĩa routes
│   │   ├── userRouter.js
│   │   └── index.js
│   ├── app.js          # Khởi tạo Express app
│   └── server.js       # Entry point
├── env.example         # Mẫu file environment
└── package.json
```

## ⚙️ Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment

Copy file `env.example` và tạo 2 file:
- `.env.development` - cho môi trường phát triển
- `.env.production` - cho môi trường production

```bash
# Tạo file development
cp env.example .env.development

# Tạo file production  
cp env.example .env.production
```

### 3. Cấu hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật Google+ API hoặc Google People API
4. Tạo OAuth 2.0 credentials:
   - **Application type:** Web application
   - **Authorized redirect URIs:** `http://localhost:8080/api/auth/google/callback`
5. Copy Client ID và Client Secret vào file `.env`

### 4. Cấu hình database

Chỉnh sửa các file `.env.development` và `.env.production`:

**Cho MySQL:**
```env
NODE_ENV=development
PORT=3000
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=base_be_dev
DB_SYNCHRONIZE=true
DB_LOGGING=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OAuth Callback URLs
API_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:8080
FRONTEND_PATH=/front-end/index.html
```

**Cho PostgreSQL:**
```env
NODE_ENV=development
PORT=3000
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=base_be_dev
DB_SYNCHRONIZE=true
DB_LOGGING=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OAuth Callback URLs
API_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:8080
FRONTEND_PATH=/front-end/index.html
```

### 5. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm run start
```

### 6. Test Google OAuth

1. Mở trình duyệt: `http://localhost:8080/front-end/index.html`
2. Click "Đăng nhập với Google"
3. Hoàn tất quy trình đăng nhập

## 🔐 Google OAuth Flow (Server-side)

### Luồng hoạt động:
1. User click "Đăng nhập với Google" trên frontend
2. Frontend gọi `GET /api/auth/google` để lấy OAuth URL
3. User được redirect tới Google OAuth
4. User đăng nhập tại Google
5. Google redirect về `POST /api/auth/google/callback` với authorization code
6. Backend exchange code để lấy access token từ Google
7. Backend lấy thông tin user từ Google
8. Backend tạo/cập nhật account trong database
9. Backend tạo JWT token và redirect user về frontend với token

### Ưu điểm của Server-side flow:
- ✅ Bảo mật cao hơn (Client Secret không exposed)
- ✅ Có thể refresh Google token
- ✅ Kiểm soát hoàn toàn authentication process
- ✅ SEO friendly (không cần JavaScript)

## 🔌 API Endpoints

### Base URLs
- **Development:** `http://localhost:3000`
- **API Base:** `/api`

### Authentication Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập bằng email/password |
| GET | `/api/auth/google` | Khởi tạo Google OAuth (server-side) |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |

### Other Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Trang chủ API |
| GET | `/api` | Thông tin API |
| GET | `/api/health` | Health check |

## 📝 Ví dụ sử dụng

### Đăng ký tài khoản
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Lấy thông tin user hiện tại
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response format
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

## 🏗 Kiến trúc

### Entity vs Model
- **Entity**: Định nghĩa cho TypeORM, mapping với database
- **Model**: Business logic, validation, chuyển đổi dữ liệu

### Service Layer
- Chứa business logic
- Xử lý CRUD operations
- Validate dữ liệu

### Controller Layer  
- Xử lý HTTP requests/responses
- Gọi service methods
- Format response

### Router Layer
- Định nghĩa routes
- Middleware routing
- Mount vào Express app

## 🔧 Mở rộng

### Thêm Entity/Model mới
1. Tạo file trong `src/entity/`
2. Tạo model tương ứng trong `src/model/`
3. Thêm entity vào `src/config/data-source.js`

### Thêm Service mới
1. Tạo file trong `src/service/`
2. Export trong `src/service/index.js`

### Thêm Controller mới
1. Tạo file trong `src/controller/`
2. Export trong `src/controller/index.js`

### Thêm Router mới
1. Tạo file trong `src/router/`
2. Mount trong `src/router/index.js`
