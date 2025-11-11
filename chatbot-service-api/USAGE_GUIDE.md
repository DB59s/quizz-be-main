# 📖 Chatbot Service - Hướng dẫn sử dụng

## 🎯 Tổng quan

Chatbot Service cung cấp 2 loại API:

1. **REST API** (qua Gateway) - Quản lý conversations (list, create, update, delete)
2. **Socket.IO** (trực tiếp) - Chat real-time với Gemini AI (qua RAG)

---

## 🔐 Authentication

### Gateway API (REST)
- **Yêu cầu:** JWT Token trong header `Authorization: Bearer <token>`
- **account_id** được lấy tự động từ JWT token
- **Không cần** truyền account_id trong request

### Socket.IO (Real-time Chat)
- **Không yêu cầu** JWT authentication
- **Phải truyền** `account_id` trong mỗi event data

---

## 📡 REST API (qua Gateway)

### Base URL
```
http://localhost:9000/api/v1/chatbot
```

### 1. Lấy danh sách conversations
```bash
GET /api/v1/chatbot/conversations
Headers:
  Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "conversation_id": "uuid",
      "account_id": "user-id",
      "title": "Hỏi về toán học",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Tạo conversation mới
```bash
POST /api/v1/chatbot/conversations
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
Body:
{
  "title": "Hỏi về toán học"  // Optional
}

Response:
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation_id": "uuid",
    "account_id": "user-id",
    "title": "Hỏi về toán học",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Lấy thông tin conversation
```bash
GET /api/v1/chatbot/conversations/:id
Headers:
  Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "conversation_id": "uuid",
    "account_id": "user-id",
    "title": "Hỏi về toán học",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Cập nhật conversation
```bash
PUT /api/v1/chatbot/conversations/:id
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
Body:
{
  "title": "New title"
}

Response:
{
  "success": true,
  "message": "Conversation updated successfully",
  "data": { ... }
}
```

### 5. Xóa conversation
```bash
DELETE /api/v1/chatbot/conversations/:id
Headers:
  Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Conversation deleted successfully",
  "data": null
}
```

### 6. Lấy messages của conversation
```bash
GET /api/v1/chatbot/conversations/:id/messages
Headers:
  Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "message_id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Giải thích định lý Pythagoras",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "message_id": "uuid",
      "conversation_id": "uuid",
      "role": "model",
      "content": "Định lý Pythagoras là...",
      "created_at": "2024-01-01T00:00:01.000Z"
    }
  ]
}
```

---

## 💬 Socket.IO (Real-time Chat)

### Connection URL
```
http://localhost:9012
```

### Client Setup (JavaScript)
```javascript
import io from 'socket.io-client';

// Kết nối (không cần authentication)
const socket = io('http://localhost:9012');

socket.on('connect', () => {
  console.log('Connected to chatbot service');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chatbot service');
});
```

### Events

#### 1. `chat:message` - Gửi tin nhắn và nhận response

**Client → Server:**
```javascript
socket.emit('chat:message', {
  account_id: 'user-account-id',        // Bắt buộc
  conversation_id: 'uuid',              // Optional (nếu không có sẽ tạo mới)
  prompt: 'Giải thích định lý Pythagoras',
  context: {                            // Optional
    type: 'question',                   // 'question' hoặc 'knowledge'
    id: 'question-uuid'                 // ID của question hoặc knowledge
  }
}, (response) => {
  // Callback nhận response ngay lập tức
  if (response.success) {
    console.log('AI Response:', response.data.response);
    console.log('Conversation ID:', response.data.conversation_id);
  } else {
    console.error('Error:', response.message);
  }
});
```

**Response Format:**
```javascript
{
  success: true,
  data: {
    response: "Định lý Pythagoras là...",
    conversation_id: "uuid",
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. `chat:typing` - Thông báo đang gõ

```javascript
socket.emit('chat:typing', {
  account_id: 'user-account-id',
  conversation_id: 'uuid'
});
```

#### 3. `chat:join` - Join conversation room

```javascript
socket.emit('chat:join', {
  account_id: 'user-account-id',
  conversation_id: 'uuid'
});
```

#### 4. `chat:leave` - Leave conversation room

```javascript
socket.emit('chat:leave', {
  account_id: 'user-account-id',
  conversation_id: 'uuid'
});
```

---

## 🤖 RAG (Retrieval-Augmented Generation)

### 3 Loại RAG

#### Type 1: Question Bank
- **Khi nào:** Người dùng hỏi về một câu hỏi cụ thể trong ngân hàng câu hỏi
- **Context:**
  ```javascript
  {
    type: 'question',
    id: 'question-uuid'  // BẮT BUỘC nếu biết ID câu hỏi
  }
  ```
- **Retrieval:**
  - **Nếu có `id`:** Lấy chi tiết câu hỏi từ Question Service bằng ID
  - **Nếu không có `id`:** Thử search câu hỏi bằng text (nếu Question Service hỗ trợ)
  - **Fallback:** Chuyển sang knowledge_base nếu không tìm thấy
- **Prompt:** Gemini sẽ giải thích câu hỏi và đáp án

**⚠️ Lưu ý:** Nên LUÔN gửi `id` khi user đang xem một câu hỏi cụ thể để đảm bảo chính xác 100%

#### Type 2: Knowledge Base
- **Khi nào:** Người dùng hỏi về kiến thức chung, lý thuyết
- **Context:**
  ```javascript
  {
    type: 'knowledge'
  }
  ```
- **Retrieval:** Vector search trong Knowledge Service
- **Prompt:** Gemini sẽ trả lời dựa trên kiến thức được retrieve

#### Type 3: History
- **Khi nào:** Câu hỏi liên quan đến lịch sử chat trước đó
- **Context:** Không cần (hoặc không truyền)
- **Retrieval:** Không có
- **Prompt:** Gemini sẽ trả lời dựa trên lịch sử chat

---

## 🔄 Flow hoàn chỉnh

### Scenario 1: Chat mới (không có conversation)

```javascript
// 1. User gửi tin nhắn đầu tiên
socket.emit('chat:message', {
  account_id: 'user-123',
  // Không có conversation_id
  prompt: 'Giải thích định lý Pythagoras',
  context: {
    type: 'question',
    id: 'question-456'
  }
}, (response) => {
  // 2. Nhận response với conversation_id mới
  console.log(response.data.conversation_id); // "conv-789"
  
  // 3. Lưu conversation_id để dùng cho tin nhắn tiếp theo
  const conversationId = response.data.conversation_id;
});

// 4. Gửi tin nhắn tiếp theo trong cùng conversation
socket.emit('chat:message', {
  account_id: 'user-123',
  conversation_id: 'conv-789',  // Dùng conversation_id từ response trước
  prompt: 'Cho ví dụ cụ thể'
}, (response) => {
  console.log(response.data.response);
});
```

### Scenario 2: Tiếp tục conversation cũ

```javascript
// 1. Lấy danh sách conversations từ REST API
fetch('http://localhost:9000/api/v1/chatbot/conversations', {
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  }
})
.then(res => res.json())
.then(data => {
  const conversations = data.data;
  const selectedConv = conversations[0];
  
  // 2. Lấy messages của conversation
  return fetch(`http://localhost:9000/api/v1/chatbot/conversations/${selectedConv.conversation_id}/messages`, {
    headers: {
      'Authorization': 'Bearer ' + jwtToken
    }
  });
})
.then(res => res.json())
.then(data => {
  const messages = data.data;
  console.log('Chat history:', messages);
  
  // 3. Gửi tin nhắn mới trong conversation này
  socket.emit('chat:message', {
    account_id: 'user-123',
    conversation_id: selectedConv.conversation_id,
    prompt: 'Câu hỏi tiếp theo'
  }, (response) => {
    console.log(response.data.response);
  });
});
```

---

## 💾 Database

### Messages được lưu tự động

Khi bạn gửi tin nhắn qua Socket.IO:
1. **User message** được lưu vào database với `role: 'user'`
2. **AI response** được lưu vào database với `role: 'model'`
3. Cả 2 messages đều có cùng `conversation_id`

Bạn **KHÔNG CẦN** gọi API riêng để lưu messages. Chúng được lưu tự động trong quá trình xử lý RAG.

---

## ⚠️ Lưu ý quan trọng

1. **REST API** (conversations) dùng JWT authentication qua Gateway
2. **Socket.IO** (chat) KHÔNG dùng JWT, phải truyền `account_id` trong data
3. Messages được lưu **tự động** khi chat qua Socket.IO
4. Conversation được tạo **tự động** nếu không truyền `conversation_id`
5. Để tiếp tục chat cũ, phải truyền `conversation_id` từ lần chat trước

---

## 🧪 Testing

### Test REST API
```bash
# Get JWT token first
TOKEN="your-jwt-token"

# List conversations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/api/v1/chatbot/conversations

# Create conversation
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}' \
  http://localhost:9000/api/v1/chatbot/conversations
```

### Test Socket.IO
Sử dụng Socket.IO client hoặc tool như [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)

---

## 📚 Swagger Documentation

- **Gateway API:** http://localhost:9000/api-docs
- **Chatbot Service:** http://localhost:9012/api/docs

