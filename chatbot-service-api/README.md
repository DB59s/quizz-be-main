# Chatbot Service API

Microservice chatbot với khả năng RAG (Retrieval-Augmented Generation), tích hợp Socket.IO cho real-time chat và Google Gemini AI.

## 🛠 Công nghệ sử dụng

- **NodeJS** với **ExpressJS**
- **TypeORM** với **PostgreSQL**
- **Socket.IO** cho real-time communication
- **Google Gemini AI** (gemini-1.5-flash)
- **No Authentication Required** - Public API
- **RAG** với 3 loại: question_bank, knowledge_base, history

## 📁 Cấu trúc dự án

```
chatbot-service-api/
├── src/
│   ├── config/          # Cấu hình chung
│   │   ├── env.js       # Quản lý biến môi trường
│   │   ├── data-source.js # Cấu hình TypeORM
│   │   ├── cors.js      # Cấu hình CORS
│   │   ├── swagger.js   # Cấu hình Swagger
│   │   └── index.js     # Export tất cả config
│   ├── entity/          # Entity cho TypeORM
│   │   ├── Conversation.js
│   │   └── ChatMessage.js
│   ├── service/         # Business logic
│   │   ├── conversation.service.js  # CRUD conversations
│   │   └── rag.service.js           # RAG logic
│   ├── controller/      # Xử lý request/response
│   │   └── conversation.controller.js
│   ├── router/          # Định nghĩa routes
│   │   ├── conversation.router.js
│   │   └── index.js
│   ├── socket/          # Socket.IO handlers
│   │   └── chat.handler.js
│   ├── middleware/      # Middleware
│   │   ├── authMiddleware.js
│   │   └── jwtMiddleware.js
│   ├── utils/           # Utilities
│   │   ├── jwt.js
│   │   └── serviceHelper.js
│   ├── app.js          # Khởi tạo Express app
│   └── server.js       # Entry point với Socket.IO
├── .env.development    # Environment variables
├── Dockerfile          # Docker configuration
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

Chỉnh sửa file `.env.development`:

```env
NODE_ENV=development
PORT=9012

# Database - PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5435
DB_USERNAME=chatbot_user
DB_PASSWORD=chatbot_password
DB_DATABASE=chatbot_db
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Gemini API
GEMINI_API_KEY=AIzaSyAxEHryNnkfdiEXakn5uadNoxwLNioFDzc

# External Services (no authentication required)
QUESTION_SERVICE_BASEURL=http://localhost:9009/api/v1
KNOWLEDGE_SERVICE_BASEURL=http://localhost:9013/api/v1
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
- **Gateway API (Khuyến nghị):** `http://localhost:9000/api/v1/chatbot`
- **Direct Access:** `http://localhost:9012/api/v1`

### **Qua Gateway API** (Khuyến nghị)

Tất cả các endpoints có thể truy cập qua Gateway API:

| Method | Gateway Endpoint | Mô tả | Params |
|--------|------------------|-------|--------|
| GET | `/api/v1/chatbot/conversations` | Lấy danh sách conversations | ?account_id=xxx |
| POST | `/api/v1/chatbot/conversations` | Tạo conversation mới | body: {account_id, title} |
| GET | `/api/v1/chatbot/conversations/:id` | Lấy thông tin conversation | ?account_id=xxx |
| PUT | `/api/v1/chatbot/conversations/:id` | Cập nhật conversation | ?account_id=xxx, body: {title} |
| DELETE | `/api/v1/chatbot/conversations/:id` | Xóa conversation | ?account_id=xxx |
| GET | `/api/v1/chatbot/conversations/:id/messages` | Lấy messages | ?account_id=xxx |

### **Trực tiếp từ Chatbot Service** (Port 9012)

### Conversation Endpoints (REST API)

| Method | Endpoint | Mô tả | Params |
|--------|----------|-------|--------|
| GET | `/api/v1/conversations` | Lấy danh sách conversations | ?account_id=xxx |
| POST | `/api/v1/conversations` | Tạo conversation mới | body: {account_id, title} |
| GET | `/api/v1/conversations/:id` | Lấy thông tin conversation | ?account_id=xxx |
| PUT | `/api/v1/conversations/:id` | Cập nhật conversation | ?account_id=xxx, body: {title} |
| DELETE | `/api/v1/conversations/:id` | Xóa conversation | ?account_id=xxx |
| GET | `/api/v1/conversations/:id/messages` | Lấy messages của conversation | ?account_id=xxx |

### Socket.IO Events

**Client → Server:**
- `chat:message` - Gửi tin nhắn chat (data: {account_id, prompt, context, conversation_id})
- `chat:typing` - Thông báo đang gõ (data: {account_id, conversation_id})
- `chat:join` - Join conversation room (data: {account_id, conversation_id})
- `chat:leave` - Leave conversation room (data: {account_id, conversation_id})

**Server → Client:**
- `chat:response` - Nhận response từ AI
- `chat:error` - Nhận thông báo lỗi

**Note:** Không cần JWT token. Client phải gửi `account_id` trong mỗi request.

### Other Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| GET | `/api/docs` | Swagger documentation |

## 📝 Ví dụ sử dụng

### REST API - Tạo conversation mới
```bash
curl -X POST http://localhost:9012/api/v1/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "your-account-id",
    "title": "Hỏi về toán học"
  }'
```

### REST API - Lấy danh sách conversations
```bash
curl "http://localhost:9012/api/v1/conversations?account_id=your-account-id"
```

### Socket.IO - Gửi tin nhắn chat
```javascript
// Client-side code
import io from 'socket.io-client';

// Kết nối không cần authentication
const socket = io('http://localhost:9012');

// Gửi tin nhắn (phải có account_id)
socket.emit('chat:message', {
  account_id: 'your-account-id',
  conversation_id: 'uuid-here',  // optional, nếu không có sẽ tạo mới
  prompt: 'Giải thích định lý Pythagoras',
  context: {
    type: 'question',  // hoặc 'knowledge_base'
    id: 'question-uuid'  // optional
  }
}, (response) => {
  if (response.success) {
    console.log('AI Response:', response.data.response);
    console.log('Conversation ID:', response.data.conversation_id);
  }
});

// Nhận response
socket.on('chat:response', (data) => {
  console.log('Received:', data);
});

// Nhận lỗi
socket.on('chat:error', (error) => {
  console.error('Error:', error);
});
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

### RAG (Retrieval-Augmented Generation)

Service hỗ trợ 3 loại RAG:

1. **question_bank** (Type 1):
   - FE chỉ định question_id
   - Lấy câu hỏi từ Question Service
   - Sử dụng nội dung câu hỏi làm context

2. **knowledge_base** (Type 2):
   - FE chỉ định knowledge_type
   - Gọi Knowledge Service để vector search
   - Sử dụng kết quả search làm context

3. **history** (Type 3):
   - Không có context từ FE
   - Chỉ sử dụng lịch sử chat
   - AI trả lời dựa trên conversation history

### Socket.IO Architecture
- JWT authentication middleware
- Real-time bidirectional communication
- Event-based messaging
- Callback pattern cho response

### Service Layer
- **conversation.service.js**: CRUD operations cho conversations và messages
- **rag.service.js**: RAG logic (classifier, retrieval, generator)

### Controller Layer
- Xử lý HTTP requests/responses
- Gọi service methods
- Format response

### Router Layer
- Định nghĩa routes
- JWT middleware protection
- Mount vào Express app

## 🔧 Mở rộng

### Thêm Socket.IO Event mới
1. Thêm handler trong `src/socket/chat.handler.js`
2. Emit event từ client với tên event tương ứng

### Thêm RAG Type mới
1. Cập nhật classifier trong `rag.service.js`
2. Thêm logic retrieval cho type mới
3. Cập nhật buildFinalPrompt để xử lý context mới

### Thêm Entity mới
1. Tạo file trong `src/entity/`
2. Thêm entity vào `src/config/data-source.js`

### Thêm Service mới
1. Tạo file trong `src/service/`
2. Import và sử dụng trong controller hoặc socket handler

### Thêm Router mới
1. Tạo file trong `src/router/`
2. Mount trong `src/router/index.js`

## 🐳 Docker

### Build và chạy với Docker Compose

```bash
# Build và start tất cả services
docker-compose up -d

# Chỉ build chatbot service
docker-compose build chatbot-service-api

# Xem logs
docker-compose logs -f chatbot-service-api

# Stop service
docker-compose down
```

### Environment trong Docker
- Database host: `quiz_postgres_chatbot`
- Port mapping: `9012:9012`
- Network: `quiz_network`

## 📚 Dependencies chính

- **express**: Web framework
- **socket.io**: Real-time communication
- **typeorm**: ORM cho PostgreSQL
- **@google/generative-ai**: Google Gemini AI
- **jsonwebtoken**: JWT authentication
- **axios**: HTTP client cho service calls
- **node-cache**: In-memory caching
- **swagger-jsdoc**: API documentation

## 🔐 Security

- JWT authentication cho REST API
- JWT authentication cho Socket.IO connections
- Service-to-service authentication với API tokens
- CORS configuration
- Input validation

## 📖 API Documentation

Swagger documentation có sẵn tại: `http://localhost:9012/api/docs`
