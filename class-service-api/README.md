# Base Backend NodeJS

Một base backend sử dụng NodeJS, ExpressJS và MongoDB với cấu trúc rõ ràng và dễ mở rộng.

## 🛠 Công nghệ sử dụng

- **NodeJS** với **ExpressJS**
- **MongoDB** với **Mongoose**
- **Token-based Authentication**
- **JavaScript** (ES6+)

## 📁 Cấu trúc dự án

```
project-root/
├── src/
│   ├── config/          # Cấu hình chung
│   │   ├── env.js       # Quản lý biến môi trường
│   │   ├── data-source.js # Cấu hình MongoDB
│   │   ├── cors.js      # Cấu hình CORS
│   │   └── index.js     # Export tất cả config
│   ├── entity/          # Mongoose Schema
│   │   └── User.js
│   ├── model/           # Model cho business logic
│   │   └── User.js
│   ├── middleware/      # Middleware
│   │   ├── authMiddleware.js # Token verification
│   │   └── index.js
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

### 3. Cấu hình database và authentication

Chỉnh sửa các file `.env.development` và `.env.production`:

**Cho MongoDB Local:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017
DB_DATABASE=base_be_dev
API_TOKEN=your-secret-token-here-change-in-production
```

**Cho MongoDB Atlas:**
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
DB_DATABASE=base_be_prod
API_TOKEN=your-very-secure-production-token
```

**⚠️ Lưu ý:** Đảm bảo thay đổi `API_TOKEN` thành một token bảo mật mạnh trong môi trường production!

### 4. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm run start
```

## 🔌 API Endpoints

### Base URLs
- **Development:** `http://localhost:3000`
- **API Base:** `/api`

### User Endpoints

**🔒 Tất cả các endpoint user yêu cầu token authentication**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users` | Lấy danh sách tất cả user |
| GET | `/api/users/:id` | Lấy thông tin user theo ID |
| POST | `/api/users` | Tạo user mới |
| PUT | `/api/users/:id` | Cập nhật user |
| DELETE | `/api/users/:id` | Xóa user |

### Other Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Trang chủ API |
| GET | `/api` | Thông tin API |
| GET | `/api/health` | Health check |

## 📝 Ví dụ sử dụng

### Authentication
Tất cả các request đến `/api/users` cần có token trong header:
```bash
Authorization: Bearer your-secret-token-here-change-in-production
```

### Tạo user mới
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here-change-in-production" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

### Lấy danh sách users
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer your-secret-token-here-change-in-production"
```

### Lấy user theo ID
```bash
curl http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your-secret-token-here-change-in-production"
```

### Cập nhật user
```bash
curl -X PUT http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here-change-in-production" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
```

### Xóa user
```bash
curl -X DELETE http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your-secret-token-here-change-in-production"
```

### Response format
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error response (Unauthorized)
```json
{
  "success": false,
  "message": "Authorization header is required",
  "data": null
}
```

## 🏗 Kiến trúc

### Mongoose Schema (Entity)
- **Entity**: Định nghĩa Mongoose Schema, mapping với MongoDB collection
- Validation tự động với Mongoose
- Indexes và constraints

### Service Layer
- Chứa business logic
- Xử lý CRUD operations với Mongoose
- Error handling

### Controller Layer  
- Xử lý HTTP requests/responses
- Gọi service methods
- Format response

### Middleware Layer
- **authMiddleware**: Xác thực token
- Có thể thêm các middleware khác (logging, rate limiting, etc.)

### Router Layer
- Định nghĩa routes
- Apply middleware
- Mount vào Express app

## 🔧 Mở rộng

### Thêm Mongoose Schema mới
1. Tạo file schema trong `src/entity/`
2. Define schema với validation rules
3. Export model

### Thêm Service mới
1. Tạo file trong `src/service/`
2. Import Mongoose model
3. Export trong `src/service/index.js`

### Thêm Controller mới
1. Tạo file trong `src/controller/`
2. Export trong `src/controller/index.js`

### Thêm Router mới
1. Tạo file trong `src/router/`
2. Apply middleware nếu cần (verifyToken)
3. Mount trong `src/router/index.js`

### Thêm Middleware mới
1. Tạo file trong `src/middleware/`
2. Export trong `src/middleware/index.js`
3. Apply trong router hoặc app.js

## 🔐 Bảo mật

### Token Authentication
- Token được lưu trong biến môi trường `API_TOKEN`
- Gửi token qua header: `Authorization: Bearer <token>`
- Middleware `verifyToken` kiểm tra token trước khi xử lý request
- **Lưu ý**: Đây là token cứng đơn giản, trong production nên sử dụng JWT hoặc OAuth2

### Khuyến nghị
- Thay đổi token thường xuyên
- Sử dụng HTTPS trong production
- Implement rate limiting
- Add request logging
- Sử dụng JWT thay vì static token cho production
