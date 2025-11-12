# 🔌 Gateway Socket.IO Proxy - Luồng xử lý hoàn chỉnh

## 📋 Tổng quan

Gateway API giờ đây hoạt động như một **Socket.IO Proxy**, chuyển tiếp tất cả kết nối Socket.IO từ Frontend đến Chatbot Service.

### 🎯 Lợi ích của kiến trúc này:

1. **Tập trung hóa:** Tất cả traffic đều đi qua Gateway (Port 9008)
2. **Bảo mật:** Gateway có thể thêm authentication/authorization cho Socket.IO
3. **Monitoring:** Dễ dàng theo dõi và log tất cả Socket.IO traffic
4. **Load Balancing:** Có thể scale Chatbot Service mà không ảnh hưởng Frontend
5. **Consistent URL:** Frontend chỉ cần biết Gateway URL, không cần biết Chatbot Service URL

---

## 🏗️ Kiến trúc mới

### **Trước đây (Cũ):**
```
┌──────────┐
│ Frontend │
└────┬─────┘
     │ Socket.IO (Port 9009)
     ▼
┌─────────────────┐
│ Chatbot Service │
└─────────────────┘
```

### **Bây giờ (Mới):**
```
┌──────────┐
│ Frontend │
└────┬─────┘
     │ Socket.IO (Port 9008)
     ▼
┌─────────────────────────────┐
│ Gateway API                 │
│ - Socket.IO Server          │
│ - Socket.IO Proxy Logic     │
└────┬────────────────────────┘
     │ Socket.IO Client (Internal)
     ▼
┌─────────────────┐
│ Chatbot Service │
│ - Socket.IO     │
│ - RAG Service   │
└─────────────────┘
```

---

## 🔄 Luồng xử lý chi tiết

### **1. Frontend kết nối tới Gateway**

```javascript
// Frontend code
const socket = io('http://localhost:9008', {
  transports: ['websocket', 'polling']
});
```

**Gateway nhận kết nối:**
```javascript
// gateway-api/src/socket/proxy.js
io.on('connection', (clientSocket) => {
  console.log(`[Socket.IO Proxy] ✅ Client connected: ${clientSocket.id}`);
  
  // Tạo kết nối tới Chatbot Service cho client này
  const chatbotSocket = ioClient('http://chatbot-service-api:9009', {
    transports: ['websocket', 'polling']
  });
});
```

---

### **2. Gateway tạo kết nối tới Chatbot Service**

Mỗi khi có 1 client kết nối tới Gateway, Gateway sẽ tạo 1 kết nối tương ứng tới Chatbot Service.

**Mapping:**
```
Client A (socket-abc) → Gateway → Chatbot Connection A (socket-xyz)
Client B (socket-def) → Gateway → Chatbot Connection B (socket-uvw)
```

---

### **3. Frontend gửi tin nhắn**

```javascript
// Frontend
socket.emit('chat:message', {
  account_id: '1d18f28b-6735-466f-b0e2-7832ba26f8a2',
  prompt: 'Tiến trình là gì?',
  conversation_id: null
}, (response) => {
  console.log('Response:', response.data.response);
});
```

**Gateway nhận và forward:**
```javascript
// gateway-api/src/socket/proxy.js
clientSocket.on('chat:message', (data, callback) => {
  console.log(`[Socket.IO Proxy] 📤 Forwarding chat:message from client ${clientSocket.id}`);
  
  // Forward tới Chatbot Service
  chatbotSocket.emit('chat:message', data, (response) => {
    console.log(`[Socket.IO Proxy] 📥 Received response from Chatbot Service`);
    
    // Forward response về Frontend
    callback(response);
  });
});
```

---

### **4. Chatbot Service xử lý**

```javascript
// chatbot-service-api/src/socket/chat.handler.js
socket.on('chat:message', async (data, callback) => {
  // Xử lý RAG (như cũ)
  const result = await processMessage(data, data.account_id);
  
  // Trả response
  callback({
    success: true,
    data: {
      response: result.response,
      conversation_id: result.conversation_id
    }
  });
});
```

---

### **5. Gateway nhận response và forward về Frontend**

```javascript
// gateway-api/src/socket/proxy.js
chatbotSocket.emit('chat:message', data, (response) => {
  console.log(`[Socket.IO Proxy] 📥 Received response from Chatbot Service`);
  
  // Forward về Frontend qua callback
  if (callback && typeof callback === 'function') {
    callback(response);
  }
});
```

---

### **6. Frontend nhận response**

```javascript
// Frontend callback
socket.emit('chat:message', data, (response) => {
  if (response.success) {
    displayBotMessage(response.data.response);
    conversationId = response.data.conversation_id;
  }
});
```

---

## 📊 Sơ đồ luồng hoàn chỉnh

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER GỬI CÂU HỎI                             │
│  "Tiến trình trong hệ điều hành là gì?"                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: Emit 'chat:message' qua Socket.IO                   │
│  URL: ws://localhost:9008                                      │
│  Data: { account_id, prompt, conversation_id }                │
│  Thời gian: ~1-5ms                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GATEWAY: Nhận event từ Frontend                               │
│  File: gateway-api/src/socket/proxy.js                         │
│  Action: clientSocket.on('chat:message')                       │
│  Thời gian: ~1-5ms                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GATEWAY: Forward tới Chatbot Service                          │
│  Action: chatbotSocket.emit('chat:message', data, callback)    │
│  URL: ws://chatbot-service-api:9009 (internal)                 │
│  Thời gian: ~1-10ms                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  CHATBOT SERVICE: Nhận event từ Gateway                        │
│  File: chatbot-service-api/src/socket/chat.handler.js          │
│  Action: socket.on('chat:message')                             │
│  Thời gian: ~1-5ms                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  CHATBOT SERVICE: Xử lý RAG                                    │
│  File: chatbot-service-api/src/service/rag.service.js          │
│  Steps:                                                        │
│  1. Get History (10-50ms)                                      │
│  2. Classify Query (500-2000ms)                                │
│  3. Retrieval (0-3000ms)                                       │
│  4. Build Prompt (1-10ms)                                      │
│  5. Gemini Generator (1000-5000ms)                             │
│  6. Save DB (20-100ms)                                         │
│  Tổng: ~1.5s - 10s                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  CHATBOT SERVICE: Trả response về Gateway                      │
│  Action: callback({ success: true, data: {...} })              │
│  Thời gian: ~1-5ms                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GATEWAY: Nhận response từ Chatbot Service                     │
│  File: gateway-api/src/socket/proxy.js                         │
│  Action: chatbotSocket.emit callback                           │
│  Thời gian: ~1-5ms                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GATEWAY: Forward response về Frontend                         │
│  Action: callback(response)                                    │
│  Thời gian: ~1-5ms                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: Nhận response                                       │
│  Action: socket.emit callback                                  │
│  Display: Hiển thị câu trả lời                                 │
│  Thời gian: ~1-10ms                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER NHẬN CÂU TRẢ LỜI                        │
│  "Tiến trình là chương trình đang chạy..."                     │
│                                                                 │
│  TỔNG THỜI GIAN: ~1.5s - 10s (tùy loại RAG)                    │
│  + Gateway overhead: ~10-50ms (negligible)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Cấu hình

### **Gateway (Port 9008)**

**File:** `gateway-api/src/server.js`
```javascript
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false
  },
  transports: ['websocket', 'polling']
});

initializeSocketProxy(io);
```

**File:** `gateway-api/src/socket/proxy.js`
```javascript
const CHATBOT_SERVICE_URL = 'http://chatbot-service-api:9009';

function initializeSocketProxy(io) {
  io.on('connection', (clientSocket) => {
    const chatbotSocket = ioClient(CHATBOT_SERVICE_URL, {
      transports: ['websocket', 'polling']
    });
    
    // Forward events bidirectionally
    clientSocket.on('chat:message', (data, callback) => {
      chatbotSocket.emit('chat:message', data, callback);
    });
  });
}
```

---

### **Frontend (Browser)**

**File:** `chatbot-test-ui.html`
```javascript
const GATEWAY_URL = 'http://localhost:9008';
const socket = io(GATEWAY_URL, {
  transports: ['websocket', 'polling']
});

socket.emit('chat:message', {
  account_id: '1d18f28b-6735-466f-b0e2-7832ba26f8a2',
  prompt: 'Tiến trình là gì?',
  conversation_id: null
}, (response) => {
  console.log('Response:', response);
});
```

---

### **Chatbot Service (Port 9009)**

**File:** `chatbot-service-api/src/socket/chat.handler.js`
```javascript
// Không thay đổi gì, vẫn xử lý như cũ
socket.on('chat:message', async (data, callback) => {
  const result = await processMessage(data, data.account_id);
  callback({
    success: true,
    data: {
      response: result.response,
      conversation_id: result.conversation_id
    }
  });
});
```

---

## 📝 Các events được proxy

| Event | Direction | Mô tả |
|-------|-----------|-------|
| `connect` | ← Server | Kết nối thành công |
| `disconnect` | ← Server | Mất kết nối |
| `chat:message` | → Server | Gửi tin nhắn |
| `chat:response` | ← Server | Nhận phản hồi |
| `chat:error` | ← Server | Lỗi xảy ra |
| `chat:typing` | ↔ Both | Typing indicator |
| `chat:stop_typing` | ↔ Both | Stop typing |
| `chat:join` | → Server | Join conversation room |
| `chat:leave` | → Server | Leave conversation room |

**Tất cả events đều được Gateway proxy bidirectionally (2 chiều).**

---

## 🎯 Ví dụ cụ thể

### **Ví dụ 1: Chat với Knowledge Base**

```javascript
// Frontend
socket.emit('chat:message', {
  account_id: '1d18f28b-6735-466f-b0e2-7832ba26f8a2',
  prompt: 'Tiến trình là gì?',
  conversation_id: null,
  context: { type: 'knowledge' }
}, (response) => {
  console.log(response.data.response);
});
```

**Flow:**
```
Frontend (Port 9008)
  → Gateway Socket.IO Proxy
    → Chatbot Service (Port 9009)
      → RAG Service
        → Knowledge Service (Port 9013)
          → ChromaDB Vector Search
        ← 10 chunks
      ← Gemini AI
    ← Response
  ← Response
← Display
```

**Thời gian:** ~4-8s

---

### **Ví dụ 2: Chat với Question Bank**

```javascript
// Frontend
socket.emit('chat:message', {
  account_id: '1d18f28b-6735-466f-b0e2-7832ba26f8a2',
  prompt: 'Giải thích câu hỏi về deadlock',
  conversation_id: 'conv-123',
  context: { type: 'question', id: 'q-deadlock-001' }
}, (response) => {
  console.log(response.data.response);
});
```

**Flow:**
```
Frontend (Port 9008)
  → Gateway Socket.IO Proxy
    → Chatbot Service (Port 9009)
      → RAG Service
        → Quiz Service (Port 9010)
          → Get question by ID
        ← Question data
      ← Gemini AI
    ← Response
  ← Response
← Display
```

**Thời gian:** ~2-4s

---

## 🔍 Debugging & Monitoring

### **Xem logs Gateway:**
```bash
docker logs quiz_gateway_api --tail 100 -f
```

**Output mẫu:**
```
[Socket.IO Proxy] ✅ Client connected to Gateway: abc123
[Socket.IO Proxy] 🔗 Connecting to Chatbot Service for client abc123...
[Socket.IO Proxy] ✅ Connected to Chatbot Service (xyz789) for client abc123
[Socket.IO Proxy] 📤 Forwarding chat:message from client abc123 to Chatbot Service
[Socket.IO Proxy] - Account ID: 1d18f28b-6735-466f-b0e2-7832ba26f8a2
[Socket.IO Proxy] - Prompt: Tiến trình là gì?...
[Socket.IO Proxy] - Conversation ID: NEW
[Socket.IO Proxy] 📥 Received response from Chatbot Service for client abc123
```

---

### **Xem logs Chatbot Service:**
```bash
docker logs quiz_chatbot_service_api --tail 100 -f
```

**Output mẫu:**
```
[RAG] 🤖 STARTING RAG PROCESSING
[RAG] Input:
[RAG] - Account ID: 1d18f28b-6735-466f-b0e2-7832ba26f8a2
[RAG] - Prompt: Tiến trình là gì?
[RAG] Step 1: Getting conversation history...
[RAG] Step 2: Classifying query...
[RAG] Step 3: Retrieving data...
[RAG] Step 4: Building final prompt...
[RAG] Step 5: Calling Gemini AI...
[RAG] Step 6: Saving to database...
[RAG] ✅ RAG PROCESSING COMPLETED
```

---

## ✅ Tóm tắt

### **Thay đổi chính:**

1. ✅ **Gateway giờ có Socket.IO Server** (Port 9008)
2. ✅ **Gateway proxy tất cả Socket.IO traffic** tới Chatbot Service
3. ✅ **Frontend chỉ cần connect tới Gateway** (không cần biết Chatbot Service)
4. ✅ **Chatbot Service không thay đổi gì** (vẫn xử lý như cũ)
5. ✅ **Tất cả events được proxy bidirectionally**

### **Lợi ích:**

- 🎯 **Tập trung hóa:** Tất cả traffic qua Gateway
- 🔒 **Bảo mật:** Có thể thêm auth/authorization
- 📊 **Monitoring:** Dễ dàng theo dõi traffic
- ⚖️ **Load Balancing:** Có thể scale Chatbot Service
- 🔗 **Consistent URL:** Frontend chỉ cần biết Gateway URL

### **URL mới:**

- **Frontend connect:** `ws://localhost:9008` (Gateway)
- **Gateway → Chatbot:** `ws://chatbot-service-api:9009` (internal)

---

## 🚀 Cách test

1. **Mở file `chatbot-test-ui.html`** trong browser
2. **Kiểm tra console:** Phải thấy "Connected to Gateway"
3. **Gửi tin nhắn:** Click 1 trong 3 scenarios
4. **Xem logs Gateway:** `docker logs quiz_gateway_api -f`
5. **Xem logs Chatbot:** `docker logs quiz_chatbot_service_api -f`

**Nếu thành công, bạn sẽ thấy:**
- Frontend: "Connected to Gateway"
- Gateway logs: "Client connected", "Forwarding chat:message"
- Chatbot logs: "RAG PROCESSING COMPLETED"
- Frontend: Nhận được response

---

## 📚 Tài liệu liên quan

- [FRONTEND_SOCKET_FLOW.md](./FRONTEND_SOCKET_FLOW.md) - Cách Frontend chat qua Socket.IO
- [BACKEND_PROCESSING_FLOW.md](./BACKEND_PROCESSING_FLOW.md) - Quy trình Backend xử lý
- [chatbot-service-api/SOCKET_CLIENT_GUIDE.md](./chatbot-service-api/SOCKET_CLIENT_GUIDE.md) - Socket.IO Client Guide

