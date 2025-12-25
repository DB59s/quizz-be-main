# Class Service API

API quản lý lớp học sử dụng NodeJS, ExpressJS và MongoDB với cấu trúc rõ ràng và dễ mở rộng.

## 🛠 Công nghệ sử dụng

- **NodeJS** với **ExpressJS**
- **MongoDB** với **Mongoose**
- **Token-based Authentication**
- **Swagger UI** - API Documentation
- **JavaScript** (ES6+)

## 📁 Cấu trúc dự án

```
project-root/
├── src/
│   ├── config/          # Cấu hình chung
│   │   ├── env.js       # Quản lý biến môi trường
│   │   ├── data-source.js # Cấu hình MongoDB
│   │   ├── cors.js      # Cấu hình CORS
│   │   ├── swagger.js   # Cấu hình Swagger
│   │   └── index.js     # Export tất cả config
│   ├── models/          # Mongoose Models
│   │   └── Class.js     # Class schema
│   ├── middleware/      # Middleware
│   │   ├── authMiddleware.js # Token verification
│   │   └── index.js
│   ├── controller/      # Xử lý request/response
│   │   ├── classController.js
│   │   └── index.js
│   ├── router/          # Định nghĩa routes
│   │   ├── classRouter.js
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
- **API Base:** `/api/v1`
- **Swagger Docs:** `http://localhost:3000/api-docs`

### Class Endpoints

**🔒 Tất cả các endpoint class yêu cầu token authentication**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/classes` | Tạo lớp học mới |
| PATCH | `/api/v1/classes/:class_id` | Cập nhật lớp học |
| DELETE | `/api/v1/classes/:class_id` | Xóa lớp học |
| GET | `/api/v1/classes/:teacher_id` | Lấy danh sách lớp của giáo viên |
| GET | `/api/v1/classes/teacher_id/:class_id` | Lấy chi tiết lớp học |

### Other Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Trang chủ API |
| GET | `/api/v1/health` | Health check |
| GET | `/api-docs` | Swagger API Documentation |

## 📝 Ví dụ sử dụng

### Authentication
Tất cả các request đến `/api/v1/classes` cần có token trong header:
```bash
Authorization: Bearer your-secret-token-here-change-in-production
```

### 1. Tạo lớp học mới
```bash
curl -X POST http://localhost:3000/api/v1/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here-change-in-production" \
  -d '{
    "teacher_id": "teacher123",
    "name": "Lập trình Web",
    "description": "Khóa học lập trình web cơ bản",
    "max_students": 30
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "class_code": "ABC12345",
    "name": "Lập trình Web",
    "description": "Khóa học lập trình web cơ bản",
    "max_students": 30,
    "current_students": 0,
    "teacher_id": "teacher123",
    "status": "active",
    "created_at": "2025-10-03T08:30:00.000Z",
    "updated_at": "2025-10-03T08:30:00.000Z"
  }
}
```

### 2. Lấy danh sách lớp của giáo viên
```bash
curl http://localhost:3000/api/v1/classes/teacher123 \
  -H "Authorization: Bearer your-secret-token-here-change-in-production"
```

### 3. Lấy chi tiết lớp học
```bash
curl "http://localhost:3000/api/v1/classes/teacher_id/507f1f77bcf86cd799439011?teacher_id=teacher123" \
  -H "Authorization: Bearer your-secret-token-here-change-in-production"
```

### 4. Cập nhật lớp học
```bash
curl -X PATCH http://localhost:3000/api/v1/classes/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here-change-in-production" \
  -d '{
    "teacher_id": "teacher123",
    "name": "Lập trình Web Nâng cao",
    "status": "inactive"
  }'
```

### 5. Xóa lớp học
```bash
curl -X DELETE http://localhost:3000/api/v1/classes/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here-change-in-production" \
  -d '{
    "teacher_id": "teacher123"
  }'
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

### Class Schema
Schema `Class` bao gồm các trường:
- `_id`: ObjectId tự động
- `class_code`: Mã lớp unique (tự sinh 6-8 ký tự)
- `name`: Tên lớp (required, 3-100 ký tự)
- `description`: Mô tả (tối đa 500 ký tự)
- `max_students`: Số học sinh tối đa (required, >= 1)
- `current_students`: Số học sinh hiện tại (default: 0)
- `teacher_id`: ID giáo viên (required)
- `status`: Trạng thái (active/inactive/closed, default: active)
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Controller Layer  
- Xử lý HTTP requests/responses
- Validate dữ liệu đầu vào
- Kiểm tra quyền truy cập (teacher_id)
- Format response chuẩn JSON

### Middleware Layer
- **authMiddleware**: Xác thực Bearer token
- Bảo vệ tất cả routes `/api/v1/classes`

### Router Layer
- Định nghĩa routes với Swagger annotations
- Apply authMiddleware
- Mount vào Express app

## 🔧 Mở rộng

### Thêm Model mới
1. Tạo file schema trong `src/models/`
2. Define schema với validation rules
3. Export model

### Thêm Controller mới
1. Tạo file trong `src/controller/`
2. Implement các async functions với try/catch
3. Export trong `src/controller/index.js`

### Thêm Router mới
1. Tạo file trong `src/router/`
2. Thêm Swagger annotations cho documentation
3. Apply authMiddleware nếu cần
4. Mount trong `src/router/index.js`

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
