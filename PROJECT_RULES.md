# E-Learning Microservice Backend - Project Rules

**Mục đích**: Quy tắc này giúp bạn code nhanh mà không cần đọc lại toàn bộ dự án. Chỉ cần đọc rule này trước khi code.

---

## 1. KIẾN TRÚC TỔNG QUAN

### Services:
- **gateway-api** (Port 3000): Express + TypeORM (MySQL) - Xác thực, phân quyền, điều hướng
- **user-service-api** (Port 3001): Express + Mongoose (MongoDB) - Quản lý Student, Teacher, Admin
- **class-service-api** (Port 3002): Express + Mongoose (MongoDB) - Quản lý lớp học
- **question-service-api** (Port 3003): Express + TypeORM (MySQL) - Quản lý câu hỏi, môn học
- **quiz-service-api** (Port 9010): Express + TypeORM (PostgreSQL) - Quản lý bài quiz
- **submission-service-api** (Port 9011): Express + TypeORM (PostgreSQL) - Xử lý nộp bài, chấm điểm

---

## 2. CẤU TRÚC THƯ MỤC TRONG MỖI SERVICE

```
src/
├── app.js                 # Express app setup (middleware, routes, error handler)
├── server.js              # Server entry point
├── config/                # Configuration files
│   ├── env.js            # Environment variables
│   ├── data-source.js    # Database connection (TypeORM)
│   ├── database.js       # Database connection (Mongoose)
│   ├── cors.js           # CORS configuration
│   ├── swagger.js        # Swagger documentation
│   └── index.js          # Export all configs
├── controller/            # Request handlers (class-based or function-based)
├── service/              # Business logic
├── middleware/           # Custom middleware
├── router/               # Route definitions
├── entity/ (TypeORM)     # Database entities
├── model/ (Mongoose)     # Database schemas
├── utils/                # Helper functions, constants
└── helpers/              # External API calls, utilities
```

---

## 3. NAMING CONVENTIONS

### Files:
- **Controllers**: `*Controller.js` (class-based) hoặc `*.controller.js` (function-based)
- **Services**: `*Service.js` (class-based) hoặc `*Service.js` (function-based)
- **Models/Entities**: `ModelName.js` (PascalCase)
- **Routers**: `*Router.js` hoặc `*router.js`
- **Middleware**: `*Middleware.js` hoặc `*middleware.js`

### Variables:
- **Database IDs**: `account_id`, `student_id`, `teacher_id`, `user_id`, `class_id`, `quiz_id`
- **Timestamps**: `created_at`, `updated_at`
- **Status fields**: `status` (enum values: 'active', 'pending', 'banned', 'deleted')
- **Roles**: `role` (enum: 'student', 'teacher', 'admin')

---

## 4. RESPONSE FORMAT (CONSISTENT ACROSS ALL SERVICES)

### Success Response:
```javascript
res.status(201).json({
  success: true,
  message: 'Resource created successfully',
  data: { /* resource data */ }
});
```

### Error Response:
```javascript
res.status(400).json({
  success: false,
  message: 'Error description',
  data: null
});
```

### Gateway Error Response (with error field):
```javascript
res.status(400).json({
  success: false,
  error: 'Error type',
  message: 'Error description'
});
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### JWT Token Payload (from gateway):
```javascript
{
  account_id: 'uuid',
  role: 'student|teacher|admin',
  user_id: 'mongodb_id or uuid'
}
```

### Accessing User Info in Services:
```javascript
// From middleware (req.user is set by gateway)
const { account_id, role, user_id, student_id, teacher_id, admin_id } = req.user;

// From headers (if not using middleware)
const teacher_id = req.headers['x-teacher-id'];
const student_id = req.headers['x-user-id'];
```

### Role-based Access:
- **Student**: Can view own submissions, take quizzes
- **Teacher**: Can create questions, quizzes, manage classes
- **Admin**: Full access to all resources

---

## 6. DATABASE PATTERNS

### TypeORM (MySQL/PostgreSQL):
```javascript
const getRepository = () => AppDataSource.getRepository('EntityName');
const repo = getRepository();
const entity = await repo.findOne({ where: { id } });
await repo.save(entity);
await repo.remove(entity);
```

### Mongoose (MongoDB):
```javascript
const Model = require('../model/ModelName');
const doc = await Model.findById(id);
const newDoc = new Model(data);
await newDoc.save();
await Model.deleteOne({ _id: id });
```

---

## 7. ERROR HANDLING

### Custom Error Pattern:
```javascript
const error = new Error('Error message');
error.statusCode = 400; // or 401, 403, 404, 500
throw error;
```

### Middleware Error Handler:
```javascript
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    data: null
  });
});
```

---

## 8. INTER-SERVICE COMMUNICATION

### Gateway calls other services:
```javascript
const { callUserService } = require('../middlewares/gateway.middleware');
const response = await callUserService('POST', '/users', userData);
```

### Services call external APIs:
```javascript
const axios = require('axios');
const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
```

---

## 9. CONSTANTS & ENUMS

### Gateway Constants:
```javascript
const ROLES = { STUDENT: 'student', TEACHER: 'teacher', ADMIN: 'admin' };
const ACCOUNT_STATUS = { ACTIVE: 'active', PENDING: 'pending', BANNED: 'banned', DELETED: 'deleted' };
```

### Service-specific Constants:
- Define in `src/utils/constants.js` or `src/constants/constants.js`
- Export and use consistently

---

## 10. IMPORTANT RULES

✅ **DO**:
- Use consistent response format across all services
- Always validate input before processing
- Use try-catch for async operations
- Log important operations (console.log for debugging)
- Use environment variables for configuration
- Implement proper error handling with status codes
- Use middleware for authentication/authorization
- Follow existing code patterns in the project

❌ **DON'T**:
- Don't write documentation files (*.md) unless explicitly requested
- Don't create test files unless explicitly requested
- Don't modify package.json manually - use npm/yarn commands
- Don't hardcode values - use environment variables
- Don't mix response formats
- Don't forget to validate required fields
- Don't use inconsistent naming conventions

---

## 11. QUICK REFERENCE - COMMON TASKS

### Create a new endpoint:
1. Create controller method in `controller/`
2. Create service method in `service/` (if needed)
3. Add route in `router/`
4. Add middleware for auth if needed
5. Return consistent response format

### Add a new field to model:
1. Update entity/model schema
2. Update controller validation
3. Update service logic
4. Update related services if needed

### Call another service:
1. Use axios or service helper
2. Add error handling
3. Return consistent response format

---

**Last Updated**: 2025-11-08
**Version**: 1.0

