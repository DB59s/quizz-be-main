# CLASS SERVICE API DOCUMENTATION

## Base URL
```
http://localhost:{PORT}/api/v1
```

## Authentication
Tất cả các API (trừ `/health` và `/classes/join/:class_code`) yêu cầu Bearer Token trong header:
```
Authorization: Bearer {token}
```

---

## 1. CLASSES APIs

### 1.1. Tạo lớp học mới
**POST** `/api/v1/classes`

**Request Body:**
```json
{
  "teacher_id": "string (required)",
  "name": "string (required, min: 3, max: 100)",
  "description": "string (optional, max: 500)",
  "max_students": "number (required, min: 1, integer)"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "_id": "67890abcdef123456",
    "teacher_id": "teacher123",
    "name": "Lập trình Web",
    "description": "Khóa học lập trình web cơ bản",
    "max_students": 50,
    "current_students": 0,
    "class_code": "ABC123XY",
    "status": "active",
    "created_at": "2025-10-03T10:00:00.000Z",
    "updated_at": "2025-10-03T10:00:00.000Z"
  }
}
```

**Response Error:**
- **400**: Missing required fields, validation errors
- **409**: Class code already exists (retry)
- **500**: Server error

---

### 1.2. Cập nhật thông tin lớp học
**PATCH** `/api/v1/classes/:class_id`

**Request Body:**
```json
{
  "teacher_id": "string (required - for authorization)",
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional: 'active' | 'inactive' | 'closed')"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class updated successfully",
  "data": {
    "_id": "67890abcdef123456",
    "teacher_id": "teacher123",
    "name": "Lập trình Web Nâng cao",
    "description": "Khóa học lập trình web nâng cao",
    "max_students": 50,
    "current_students": 25,
    "class_code": "ABC123XY",
    "status": "active",
    "created_at": "2025-10-03T10:00:00.000Z",
    "updated_at": "2025-10-03T11:00:00.000Z"
  }
}
```

**Response Error:**
- **400**: Missing teacher_id, invalid status, validation errors
- **403**: Not authorized (teacher_id mismatch)
- **404**: Class not found
- **500**: Server error

---

### 1.3. Xóa lớp học
**DELETE** `/api/v1/classes/:class_id`

**Request Body:**
```json
{
  "teacher_id": "string (required - for authorization)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class deleted successfully",
  "data": {
    "class_id": "67890abcdef123456"
  }
}
```

**Response Error:**
- **400**: Missing teacher_id, invalid class_id format
- **403**: Not authorized (teacher_id mismatch)
- **404**: Class not found
- **500**: Server error

---

### 1.4. Lấy danh sách lớp học của giáo viên
**GET** `/api/v1/classes/:teacher_id`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Classes retrieved successfully",
  "data": {
    "total": 2,
    "classes": [
      {
        "_id": "67890abcdef123456",
        "teacher_id": "teacher123",
        "name": "Lập trình Web",
        "description": "Khóa học lập trình web",
        "max_students": 50,
        "current_students": 25,
        "class_code": "ABC123XY",
        "status": "active",
        "created_at": "2025-10-03T10:00:00.000Z",
        "updated_at": "2025-10-03T11:00:00.000Z"
      },
      {
        "_id": "67890abcdef123457",
        "teacher_id": "teacher123",
        "name": "Cơ sở dữ liệu",
        "description": "Khóa học cơ sở dữ liệu",
        "max_students": 40,
        "current_students": 30,
        "class_code": "DB456ZW",
        "status": "active",
        "created_at": "2025-10-02T10:00:00.000Z",
        "updated_at": "2025-10-02T10:00:00.000Z"
      }
    ]
  }
}
```

**Response Error:**
- **500**: Server error

---

### 1.5. Lấy chi tiết lớp học
**GET** `/api/v1/classes/:class_id?teacher_id={teacher_id}`

**Query Parameters:**
- `teacher_id`: string (required - for authorization)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class details retrieved successfully",
  "data": {
    "_id": "67890abcdef123456",
    "teacher_id": "teacher123",
    "name": "Lập trình Web",
    "description": "Khóa học lập trình web",
    "max_students": 50,
    "current_students": 25,
    "class_code": "ABC123XY",
    "status": "active",
    "created_at": "2025-10-03T10:00:00.000Z",
    "updated_at": "2025-10-03T11:00:00.000Z"
  }
}
```

**Response Error:**
- **400**: Missing teacher_id, invalid class_id format
- **403**: Not authorized (teacher_id mismatch)
- **404**: Class not found
- **500**: Server error

---

### 1.6. Lấy thông tin lớp học bằng mã lớp (Public - No Auth)
**GET** `/api/v1/classes/join/:class_code`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class information retrieved successfully",
  "data": {
    "id": "67890abcdef123456",
    "name": "Lập trình Web",
    "description": "Khóa học lập trình web",
    "max_students": 50,
    "current_students": 25,
    "class_code": "ABC123XY",
    "status": "active",
    "teacher": {
      "id": "teacher123",
      "email": "teacher@example.com",
      "full_name": "Nguyễn Văn A",
      "department": "Khoa CNTT",
      "university": "ĐH Bách Khoa"
    }
  }
}
```

**Response Error:**
- **400**: Class is inactive/closed
- **404**: Class not found
- **500**: Server error

---

### 1.7. Lấy danh sách sinh viên trong lớp
**GET** `/api/v1/classes/:teacher_id/:class_id/students?status={status}`

**Query Parameters:**
- `status`: string (optional) - Comma-separated status codes
  - `0` = pending
  - `1` = approved
  - `2` = rejected
  - Example: `status=0,1` (get pending and approved)
  - Leave empty to get all students

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class students retrieved successfully",
  "data": {
    "class": {
      "id": "67890abcdef123456",
      "name": "Lập trình Web",
      "max_students": 50,
      "current_students": 25
    },
    "total": 2,
    "students": [
      {
        "registration_id": "reg123456",
        "student_id": "student001",
        "student": {
          "id": "student001",
          "email": "student1@example.com",
          "full_name": "Trần Văn B",
          "student_code": "20210001",
          "class_name": "CNTT K65"
        },
        "status": "approved",
        "created_at": "2025-10-01T10:00:00.000Z"
      },
      {
        "registration_id": "reg123457",
        "student_id": "student002",
        "student": {
          "id": "student002",
          "email": "student2@example.com",
          "full_name": "Lê Thị C",
          "student_code": "20210002",
          "class_name": "CNTT K65"
        },
        "status": "pending",
        "created_at": "2025-10-02T10:00:00.000Z"
      }
    ]
  }
}
```

**Response Error:**
- **403**: Not authorized (teacher_id mismatch)
- **404**: Class not found
- **500**: Server error

---

## 2. STUDENT-CLASSES APIs

### 2.1. Sinh viên đăng ký lớp học
**POST** `/api/v1/student-classes`

**Request Body:**
```json
{
  "student_id": "string (required)",
  "class_id": "string (required)"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Registration submitted successfully. Waiting for teacher approval.",
  "data": {
    "_id": "reg123456",
    "student_id": "student001",
    "class_id": "67890abcdef123456",
    "status": "pending",
    "created_at": "2025-10-03T10:00:00.000Z",
    "updated_at": "2025-10-03T10:00:00.000Z"
  }
}
```

**Response Error:**
- **400**: Missing required fields, class is inactive/closed
- **404**: Class not found
- **409**: Already registered
- **500**: Server error

---

### 2.2. Lấy danh sách lớp học của sinh viên
**GET** `/api/v1/student-classes/:student_id?status={status}`

**Query Parameters:**
- `status`: integer (optional)
  - `0` = pending
  - `1` = approved
  - `2` = rejected

**Response Success (200):**
```json
{
  "success": true,
  "message": "Student classes retrieved successfully",
  "data": {
    "total": 2,
    "filter": {
      "status": 1,
      "status_name": "approved"
    },
    "classes": [
      {
        "registration_id": "reg123456",
        "status": "approved",
        "status_code": 1,
        "created_at": "2025-10-01T10:00:00.000Z",
        "class": {
          "_id": "67890abcdef123456",
          "teacher_id": "teacher123",
          "name": "Lập trình Web",
          "description": "Khóa học lập trình web",
          "max_students": 50,
          "current_students": 25,
          "class_code": "ABC123XY",
          "status": "active",
          "created_at": "2025-10-03T10:00:00.000Z",
          "updated_at": "2025-10-03T11:00:00.000Z"
        }
      }
    ]
  }
}
```

**Response Error:**
- **400**: Invalid status code
- **500**: Server error

---

### 2.3. Sinh viên hủy đăng ký (chỉ khi pending)
**DELETE** `/api/v1/student-classes/:id`

**Request Body:**
```json
{
  "student_id": "string (required - for authorization)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Registration cancelled successfully",
  "data": {
    "registration_id": "reg123456"
  }
}
```

**Response Error:**
- **400**: Missing student_id, invalid registration_id, cannot cancel (not pending)
- **403**: Not authorized (student_id mismatch)
- **404**: Registration not found
- **500**: Server error

---

### 2.4. Giáo viên duyệt sinh viên
**PATCH** `/api/v1/student-classes/:id/approve`

**Request Body:**
```json
{
  "teacher_id": "string (required - for authorization)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Student approved successfully",
  "data": {
    "_id": "reg123456",
    "student_id": "student001",
    "class_id": {
      "_id": "67890abcdef123456",
      "teacher_id": "teacher123",
      "name": "Lập trình Web",
      "max_students": 50,
      "current_students": 26
    },
    "status": "approved",
    "created_at": "2025-10-01T10:00:00.000Z",
    "updated_at": "2025-10-03T10:00:00.000Z"
  }
}
```

**Response Error:**
- **400**: Missing teacher_id, already approved, class full
- **403**: Not authorized (teacher_id mismatch)
- **404**: Registration or class not found
- **500**: Server error

---

### 2.5. Giáo viên từ chối sinh viên
**PATCH** `/api/v1/student-classes/:id/reject`

**Request Body:**
```json
{
  "teacher_id": "string (required - for authorization)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Student rejected successfully",
  "data": {
    "_id": "reg123456",
    "student_id": "student001",
    "class_id": {
      "_id": "67890abcdef123456",
      "teacher_id": "teacher123",
      "name": "Lập trình Web",
      "max_students": 50,
      "current_students": 25
    },
    "status": "rejected",
    "created_at": "2025-10-01T10:00:00.000Z",
    "updated_at": "2025-10-03T10:00:00.000Z"
  }
}
```

**Response Error:**
- **400**: Missing teacher_id, already rejected
- **403**: Not authorized (teacher_id mismatch)
- **404**: Registration or class not found
- **500**: Server error

---

### 2.6. Giáo viên xóa sinh viên khỏi lớp (chỉ khi approved)
**DELETE** `/api/v1/student-classes/:id/remove`

**Request Body:**
```json
{
  "teacher_id": "string (required - for authorization)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Student removed from class successfully",
  "data": {
    "registration_id": "reg123456"
  }
}
```

**Response Error:**
- **400**: Missing teacher_id, invalid registration_id, cannot remove (not approved)
- **403**: Not authorized (teacher_id mismatch)
- **404**: Registration or class not found
- **500**: Server error

---

## 3. HEALTH CHECK API

### 3.1. Kiểm tra trạng thái server (No Auth)
**GET** `/api/v1/health`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-03T10:00:00.000Z"
}
```

---

## 4. DATA MODELS

### Class Model
```typescript
{
  _id: string (MongoDB ObjectId)
  class_code: string (unique, 6-8 chars, auto-generated)
  name: string (required, 3-100 chars)
  description: string (max 500 chars)
  max_students: number (required, min 1, integer)
  current_students: number (default 0, integer)
  teacher_id: string (required)
  status: 'active' | 'inactive' | 'closed' (default: 'active')
  created_at: Date
  updated_at: Date
}
```

### StudentClass Model
```typescript
{
  _id: string (MongoDB ObjectId)
  student_id: string (required)
  class_id: string (required, MongoDB ObjectId, ref: Class)
  status: 'pending' | 'approved' | 'rejected' (default: 'pending')
  created_at: Date
  updated_at: Date
}
```

---

## 5. STATUS CODES

### Class Status
- `active`: Lớp đang hoạt động, nhận đăng ký
- `inactive`: Lớp tạm ngưng
- `closed`: Lớp đã đóng

### Student Registration Status
- `pending` (0): Chờ duyệt
- `approved` (1): Đã duyệt
- `rejected` (2): Đã từ chối

---

## 6. ERROR RESPONSE FORMAT

```json
{
  "success": false,
  "message": "Error message description",
  "data": null
}
```

---

## 7. EXTERNAL API DEPENDENCIES

Service này gọi đến các API khác để lấy thông tin:
- **User Service**: Lấy thông tin giáo viên và sinh viên
  - `GET /api/v1/teachers/:teacher_id` - Lấy thông tin giáo viên
  - `GET /api/v1/students/:student_id` - Lấy thông tin sinh viên

Cấu hình trong `.env`:
```
USER_SERVICE_URL=http://localhost:3001
```

---

## 8. NOTES

1. **Authentication**: Tất cả API (trừ `/health` và `/classes/join/:class_code`) yêu cầu Bearer Token
2. **Authorization**: 
   - Teacher chỉ có thể thao tác với lớp của mình
   - Student chỉ có thể thao tác với đăng ký của mình
3. **Class Code**: Tự động generate khi tạo lớp (6-8 ký tự, chữ hoa + số)
4. **Current Students**: Tự động tăng/giảm khi approve/reject/remove student
5. **Validation**: 
   - Class name: 3-100 chars
   - Description: max 500 chars
   - Max students: min 1, integer
6. **Populate**: API `GET /student-classes/:student_id` tự động populate thông tin class
