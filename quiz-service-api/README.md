# Base Backend NodeJS

Một base backend sử dụng NodeJS, ExpressJS và TypeORM với cấu trúc rõ ràng và dễ mở rộng.

## 🛠 Công nghệ sử dụng

- **NodeJS** với **ExpressJS**
- **TypeORM** để kết nối database
- **MySQL** hoặc **PostgreSQL** (có thể chọn trong config)
- **JavaScript** (ES6+)

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

### 3. Cấu hình database

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
```

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

### Tạo user mới
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

### Lấy danh sách users
```bash
curl http://localhost:3000/api/users
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
