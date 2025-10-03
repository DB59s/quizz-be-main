# Service Helper Guide

## Tổng quan
Đã tạo một helper chung (`serviceHelper.js`) để xử lý việc gọi các microservices từ Gateway API, giúp code DRY (Don't Repeat Yourself) và dễ maintain.

## Cấu trúc

### File: `src/utils/serviceHelper.js`

Cung cấp 2 functions chính:

#### 1. `callService(config, method, path, data, options)`
Function generic để gọi bất kỳ service nào.

**Parameters:**
- `config.serviceName` - Tên service (dùng cho logging)
- `config.baseUrl` - Base URL của service
- `config.apiToken` - API token để authenticate
- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `path` - Endpoint path (e.g., '/classes')
- `data` - Request body (optional)
- `options` - Additional axios options (optional)

**Example:**
```javascript
const { callService } = require('../utils/serviceHelper');

const response = await callService(
  {
    serviceName: 'Class Service',
    baseUrl: 'http://localhost:3002',
    apiToken: 'secret-token'
  },
  'POST',
  '/classes',
  { name: 'Test Class', max_students: 50 }
);
```

#### 2. `createServiceCaller(serviceName, baseUrl, apiToken)`
Factory function tạo một caller đã được pre-configured cho một service cụ thể.

**Returns:** Function với signature `(method, path, data, options)`

**Example:**
```javascript
const { createServiceCaller } = require('../utils/serviceHelper');

// Tạo caller cho Class Service
const callClassService = createServiceCaller(
  'Class Service',
  process.env.CLASS_SERVICE_BASEURL,
  process.env.CLASS_SERVICE_API_TOKEN
);

// Sử dụng
const response = await callClassService('POST', '/classes', {
  name: 'Test Class',
  max_students: 50
});
```

## Cách sử dụng

### Option 1: Pre-configured Caller (Recommended)

Tạo một caller được config sẵn ở đầu file:

```javascript
const { createServiceCaller } = require('../utils/serviceHelper');
const { CLASS_SERVICE_BASEURL, CLASS_SERVICE_API_TOKEN } = require('../config/env');

// Tạo caller
const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);

// Sử dụng trong controller
async function createClass(req, res) {
  try {
    const response = await callClassService('POST', '/classes', req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    // Handle error
  }
}
```

### Option 2: Direct Call

Gọi trực tiếp với full config:

```javascript
const { callService } = require('../utils/serviceHelper');

async function someFunction() {
  const response = await callService(
    {
      serviceName: 'Quiz Service',
      baseUrl: process.env.QUIZ_SERVICE_BASEURL,
      apiToken: process.env.QUIZ_SERVICE_API_TOKEN
    },
    'GET',
    '/quizzes/123'
  );
}
```

## Các service đã implement

### 1. User Service
**File:** `src/middlewares/gateway.middleware.js`

```javascript
const callUserService = createServiceCaller(
  'User Service',
  USER_SERVICE_BASEURL,
  USER_SERVICE_API_TOKEN
);
```

**Usage:**
```javascript
const { callUserService } = require('../middlewares/gateway.middleware');

// Tạo teacher
await callUserService('POST', '/users', {
  account_id: '123',
  email: 'teacher@example.com',
  role: 'teacher',
  full_name: 'John Doe',
  department: 'IT'
});

// Lấy thông tin teacher
await callUserService('GET', '/teachers/teacher123');
```

### 2. Class Service
**File:** `src/controller/class.controller.js`

```javascript
const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);
```

**Usage:**
```javascript
// Tạo class
await callClassService('POST', '/classes', {
  teacher_id: 'teacher123',
  name: 'Web Programming',
  description: 'Learn web development',
  max_students: 50
});

// Lấy danh sách class
await callClassService('GET', '/classes/teacher123');

// Cập nhật class
await callClassService('PATCH', '/classes/class123', {
  teacher_id: 'teacher123',
  name: 'Advanced Web Programming'
});
```

## Features

### ✅ Error Handling
- Tự động catch và re-throw errors với proper format
- Bao gồm status code và response data
- Logging chi tiết cho debugging

### ✅ Automatic Headers
- Content-Type: application/json
- Authorization: Bearer {token}
- Custom headers qua options

### ✅ Smart Data Handling
- Tự động thêm body cho POST/PUT/PATCH
- Support query params qua options.params
- Configurable timeout (default 30s)

### ✅ Consistent Logging
```
[Gateway] Calling Class Service: POST http://localhost:3002/classes
[Gateway] Class Service call failed: Class not found
```

## Thêm Service Mới

### Bước 1: Thêm config vào `env.js`
```javascript
// Service URLs
NEW_SERVICE_BASEURL: process.env.NEW_SERVICE_BASEURL || 'http://localhost:3003',

// Service API Tokens
NEW_SERVICE_API_TOKEN: process.env.NEW_SERVICE_API_TOKEN || 'default-token',
```

### Bước 2: Tạo caller trong controller
```javascript
const { createServiceCaller } = require('../utils/serviceHelper');
const { NEW_SERVICE_BASEURL, NEW_SERVICE_API_TOKEN } = require('../config/env');

const callNewService = createServiceCaller(
  'New Service',
  NEW_SERVICE_BASEURL,
  NEW_SERVICE_API_TOKEN
);

// Export nếu cần dùng ở file khác
module.exports = {
  callNewService,
  // ... other exports
};
```

### Bước 3: Sử dụng
```javascript
async function someController(req, res) {
  try {
    const response = await callNewService('POST', '/endpoint', req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      error.response || { success: false, message: error.message }
    );
  }
}
```

## Best Practices

### 1. Tạo caller ở module level
```javascript
// ✅ Good - Tạo một lần, reuse nhiều lần
const callClassService = createServiceCaller(...);

function controller1() {
  await callClassService(...);
}

function controller2() {
  await callClassService(...);
}
```

```javascript
// ❌ Bad - Tạo lại mỗi lần gọi
function controller() {
  const callClassService = createServiceCaller(...);
  await callClassService(...);
}
```

### 2. Centralize service callers
Nếu nhiều controller cần dùng cùng service, export caller:

```javascript
// services/classService.js
const { createServiceCaller } = require('../utils/serviceHelper');
const { CLASS_SERVICE_BASEURL, CLASS_SERVICE_API_TOKEN } = require('../config/env');

const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);

module.exports = { callClassService };
```

```javascript
// controllers/class.controller.js
const { callClassService } = require('../services/classService');
```

### 3. Error handling pattern
```javascript
try {
  const response = await callClassService('POST', '/classes', data);
  return res.status(response.status).json(response.data);
} catch (serviceError) {
  console.error(`Failed to create class:`, serviceError.message);
  return res.status(serviceError.statusCode || 500).json(
    serviceError.response || {
      success: false,
      message: serviceError.message
    }
  );
}
```

## Advanced Options

### Custom Headers
```javascript
await callClassService('POST', '/classes', data, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Query Parameters
```javascript
await callClassService('GET', '/classes', null, {
  params: {
    status: 'active',
    page: 1,
    limit: 10
  }
});
```

### Custom Timeout
```javascript
await callClassService('POST', '/classes', data, {
  timeout: 60000 // 60 seconds
});
```

## Migration từ code cũ

### Before (Duplicate code)
```javascript
async function callClassService(method, path, data) {
  const url = `${CLASS_SERVICE_BASEURL}${path}`;
  const config = {
    method: method.toLowerCase(),
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLASS_SERVICE_API_TOKEN}`
    },
    timeout: 30000
  };
  if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
    config.data = data;
  }
  const response = await axios(config);
  return response;
}
```

### After (Using helper)
```javascript
const { createServiceCaller } = require('../utils/serviceHelper');

const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);
```

**Benefits:**
- ✅ Giảm ~40 lines code
- ✅ Consistent error handling
- ✅ Better logging
- ✅ Easier to maintain
- ✅ Reusable across services
