# Hướng dẫn tạo tài khoản Admin

## Mô tả
Script này được tạo để tạo tài khoản admin với thông tin:
- **Email**: vuduy050903@gmail.com
- **Password**: Duy0509@
- **Họ tên**: Vũ Quang Duy
- **Role**: admin

## Cách sử dụng

### 1. Đảm bảo môi trường đã được cấu hình
- File `.env.development` hoặc `.env.production` đã được cấu hình
- Database đã được khởi tạo và kết nối
- User service đang chạy

### 2. Chạy script
```bash
node create-admin.js
```

### 3. Kết quả mong đợi
Script sẽ:
- Kết nối database
- Kiểm tra tài khoản đã tồn tại chưa
- Tạo tài khoản admin trong gateway
- Tạo user profile trong user service
- Hiển thị thông tin tài khoản đã tạo

## Xử lý lỗi

### Tài khoản đã tồn tại
Nếu email đã tồn tại, script sẽ:
- Hiển thị thông tin tài khoản hiện tại
- Cập nhật role thành admin (nếu chưa phải)
- Cập nhật password mới

### Lỗi kết nối database
- Kiểm tra file `.env` có đúng cấu hình database không
- Đảm bảo database server đang chạy

### Lỗi user service
- Kiểm tra `USER_SERVICE_BASEURL` trong file `.env`
- Đảm bảo user service đang chạy
- Kiểm tra `USER_SERVICE_API_TOKEN` có đúng không

## Cấu trúc dữ liệu

### Account (Gateway)
```javascript
{
  id: "uuid",
  email: "vuduy050903@gmail.com",
  password_hash: "hashed_password",
  provider: "local",
  role: "admin",
  status: "active",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### User (User Service)
```javascript
{
  account_id: "uuid",
  email: "vuduy050903@gmail.com",
  role: "admin",
  full_name: "Vũ Quang Duy",
  student_code: null
}
```

## Lưu ý bảo mật
- Script này chỉ nên chạy trong môi trường development hoặc lần đầu setup
- Không nên commit file này vào production
- Thay đổi password sau khi tạo tài khoản admin
- Xóa file script sau khi sử dụng xong

## Troubleshooting

### Lỗi "Service Unavailable"
```bash
# Kiểm tra user service có đang chạy không
curl http://localhost:3001/health

# Hoặc kiểm tra trong browser
http://localhost:3001
```

### Lỗi "Database connection failed"
```bash
# Kiểm tra database có đang chạy không
mysql -u root -p
# hoặc
psql -U postgres
```

### Lỗi "Invalid API token"
Kiểm tra `USER_SERVICE_API_TOKEN` trong file `.env` có khớp với user service không.
