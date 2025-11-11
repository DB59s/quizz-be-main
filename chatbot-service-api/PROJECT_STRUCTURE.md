# 📁 Chatbot Service - Cấu trúc dự án

## 🏗️ Tổng quan kiến trúc

```
chatbot-service-api/
├── src/
│   ├── config/           # Cấu hình hệ thống
│   ├── controller/       # REST API controllers
│   ├── entity/          # TypeORM entities (database schema)
│   ├── middleware/      # Express middlewares
│   ├── router/          # API routes
│   ├── service/         # Business logic
│   ├── socket/          # Socket.IO handlers
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point (HTTP + Socket.IO)
├── .env.development     # Environment variables
├── package.json         # Dependencies
└── Dockerfile           # Docker configuration
```

---

## 📂 Chi tiết từng thư mục

### **1. src/config/** - Cấu hình hệ thống

```
config/
├── cors.js           # CORS configuration
├── data-source.js    # TypeORM DataSource (database connection)
├── env.js            # Environment variables loader
├── swagger.js        # Swagger/OpenAPI documentation
└── index.js          # Export all configs
```

**Chức năng:**
- `data-source.js`: Kết nối PostgreSQL, load entities, synchronize schema
- `env.js`: Load và validate environment variables
- `swagger.js`: Cấu hình Swagger UI cho API documentation

---

### **2. src/entity/** - Database Schema (TypeORM EntitySchema)

```
entity/
├── Conversation.js   # Conversations table
├── ChatMessage.js    # Chat messages table
└── User.js           # Users table (legacy, không dùng)
```

**Schema:**

#### **Conversation**
```javascript
{
  id: UUID (primary key),
  account_id: String (user's account ID),
  title: String (conversation title),
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### **ChatMessage**
```javascript
{
  id: UUID (primary key),
  conversation_id: UUID (foreign key → Conversation),
  role: Enum ['user', 'model'],
  content: Text (message content),
  created_at: Timestamp
}
```

**Quan hệ:**
- Conversation → ChatMessage: One-to-Many (CASCADE delete)

---

### **3. src/service/** - Business Logic

```
service/
├── rag.service.js           # RAG (Retrieval-Augmented Generation) logic
├── conversation.service.js  # Conversation CRUD operations
└── userService.js           # User service (legacy)
```

#### **rag.service.js** - Core RAG Logic

**Main Functions:**

1. **`processMessage(data, account_id)`**
   - Entry point cho RAG pipeline
   - Flow: History → Classify → Retrieve → Generate → Save
   - Return: `{ response, conversation_id }`

2. **`classifyQuery(prompt, context, history)`**
   - Phân loại query thành 3 types:
     - `question_bank`: Hỏi về câu hỏi cụ thể
     - `knowledge_base`: Hỏi về kiến thức chung
     - `history`: Hỏi dựa trên lịch sử chat
   - Sử dụng Gemini AI để classify nếu không có context từ FE

3. **`getRetrievalData(classification, prompt)`**
   - Type 1 (question_bank): Call Question Service API
   - Type 2 (knowledge_base): Call Knowledge Service API (vector search)
   - Type 3 (history): Không cần retrieval

4. **`buildFinalPrompt(type, retrievalData, prompt)`**
   - Build prompt cho Gemini dựa trên type và retrieved data

5. **`callGeminiGenerator(finalPrompt, history)`**
   - Call Gemini AI để generate response
   - Sử dụng chat history để maintain context

6. **`saveToHistory(account_id, conversation_id, userMessage, modelResponse)`**
   - Lưu user message và model response vào database
   - Tự động tạo conversation mới nếu chưa có

7. **`getHistory(conversation_id)`**
   - Lấy chat history từ database
   - Convert sang Gemini format: `[{ role, parts: [content] }]`

---

### **4. src/socket/** - Socket.IO Handlers

```
socket/
└── chat.handler.js   # Socket.IO event handlers
```

**Events:**

1. **`chat:message`** - Main chat event
   ```javascript
   // Input
   {
     account_id: string,
     conversation_id?: string,
     prompt: string,
     context?: { type: 'question'|'knowledge', id?: string }
   }
   
   // Output (callback)
   {
     success: boolean,
     data: {
       response: string,
       conversation_id: string,
       timestamp: string
     }
   }
   ```

2. **`chat:typing`** - Typing indicator
3. **`chat:join`** - Join conversation room
4. **`chat:leave`** - Leave conversation room

---

### **5. src/controller/** - REST API Controllers

```
controller/
├── conversation.controller.js  # Conversation endpoints
└── userController.js           # User endpoints (legacy)
```

**Endpoints:**

- `GET /api/v1/conversations` - List conversations
- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations/:id` - Get conversation by ID
- `PUT /api/v1/conversations/:id` - Update conversation title
- `DELETE /api/v1/conversations/:id` - Delete conversation
- `GET /api/v1/conversations/:id/messages` - Get messages

**Đặc điểm:**
- Không có authentication (nhận account_id từ query/body)
- Gateway sẽ handle JWT authentication

---

### **6. src/router/** - API Routes

```
router/
├── index.js                # Main router (mount all routes)
├── conversation.router.js  # Conversation routes + Swagger docs
└── userRouter.js           # User routes (legacy)
```

---

### **7. src/server.js** - Server Entry Point

**Chức năng:**
1. Initialize TypeORM DataSource (database connection)
2. Create HTTP server with Express app
3. Initialize Socket.IO server
4. Mount Socket.IO chat handler
5. Start server on PORT (default: 9012)

**Flow:**
```
server.js
  ↓
Initialize Database (TypeORM)
  ↓
Create HTTP Server (Express)
  ↓
Initialize Socket.IO
  ↓
Mount Chat Handler
  ↓
Listen on Port 9012
```

---

## 🔄 Flow hoàn chỉnh khi user gửi message

### **Socket.IO Flow:**

```
1. Frontend gửi Socket.IO event 'chat:message'
   ↓
2. chat.handler.js nhận event
   ↓
3. Validate input (account_id, prompt)
   ↓
4. Call rag.service.processMessage()
   ↓
5. RAG Pipeline:
   a. getHistory() - Lấy lịch sử chat
   b. classifyQuery() - Phân loại query
   c. getRetrievalData() - Lấy dữ liệu từ external services
   d. buildFinalPrompt() - Build prompt cho Gemini
   e. callGeminiGenerator() - Call Gemini AI
   f. saveToHistory() - Lưu vào database
   ↓
6. Return response qua callback
```

### **Logging Flow (Chi tiết):**

```
[Socket.IO] 📨 NEW MESSAGE RECEIVED
  ↓
[Socket.IO] ✓ Step 1: Validating input...
  ↓
[Socket.IO] ✓ Step 2: Processing message with RAG...
  ↓
[RAG] 🤖 STARTING RAG PROCESSING
  ↓
[RAG] Step 1: Getting conversation history...
[RAG] ✓ History retrieved: X messages
  ↓
[RAG] Step 2: Classifying query...
[RAG:Classify] Analyzing context...
[RAG:Classify] ✓ Type: question_bank/knowledge_base/history
  ↓
[RAG] Step 3: Retrieving data...
[RAG:Retrieval] Type: X
[RAG:Retrieval] Fetching from external service...
[RAG:Retrieval] ✓ Data retrieved
  ↓
[RAG] Step 4: Building final prompt...
[RAG] ✓ Final prompt length: X characters
  ↓
[RAG] Step 5: Calling Gemini AI...
[RAG] ✓ Gemini response received
  ↓
[RAG] Step 6: Saving to database...
[RAG:Save] Creating/Using conversation...
[RAG:Save] ✓ User message saved
[RAG:Save] ✓ Model response saved
  ↓
[RAG] ✅ RAG PROCESSING COMPLETED
  ↓
[Socket.IO] ✓ Step 3: RAG processing completed
[Socket.IO] ✓ Step 4: Sending response to client
[Socket.IO] ✅ MESSAGE PROCESSED SUCCESSFULLY
```

---

## 🔌 External Services

### **1. Question Service (Port 9009)**
- **Endpoint:** `GET /api/v1/questions/internal/:id`
- **Chức năng:** Lấy chi tiết câu hỏi (question text, answers, explanation)
- **Khi nào dùng:** RAG Type 1 (question_bank)

### **2. Knowledge Service (Port 9013)**
- **Endpoint:** `POST /api/v1/internal/knowledge/search`
- **Chức năng:** Vector search trong knowledge base
- **Khi nào dùng:** RAG Type 2 (knowledge_base)

### **3. Gemini AI**
- **API Key:** AIzaSyAxEHryNnkfdiEXakn5uadNoxwLNioFDzc
- **Model:** gemini-1.5-flash
- **Chức năng:** 
  - Classify query (classifierModel)
  - Generate response (generatorModel)

---

## 🗄️ Database

**Type:** PostgreSQL  
**Port:** 5435  
**Database:** chatbot_db  
**User:** chatbot_user  

**Tables:**
- `conversations` - Lưu conversations
- `chat_messages` - Lưu messages (CASCADE delete với conversation)

---

## 🚀 Deployment

**Docker:**
- Port: 9012 (HTTP + Socket.IO)
- Environment: .env.development
- Health check: GET /api/health

**Dependencies:**
- express
- socket.io
- typeorm
- pg (PostgreSQL driver)
- @google/generative-ai (Gemini)
- axios (HTTP client)
- swagger-ui-express

---

## 📝 Logging Convention

**Format:**
```
[Component] Symbol Message
```

**Components:**
- `[Socket.IO]` - Socket.IO handler
- `[RAG]` - RAG service main
- `[RAG:Classify]` - Classification step
- `[RAG:Retrieval]` - Retrieval step
- `[RAG:Save]` - Database save step

**Symbols:**
- `📨` - New message received
- `🤖` - RAG processing start
- `✓` - Success
- `✗` - Validation failed
- `⚠` - Warning
- `❌` - Error
- `✅` - Complete success

---

## 🐛 Debug Tips

1. **Check logs** - Tất cả steps đều có logging chi tiết
2. **Verify external services** - Question Service và Knowledge Service phải running
3. **Check database** - Verify messages được lưu vào `chat_messages` table
4. **Test Socket.IO** - Dùng Socket.IO client tool để test
5. **Check Gemini API** - Verify API key còn valid

---

## 📚 Related Documents

- `USAGE_GUIDE.md` - Hướng dẫn sử dụng API
- `README.md` - Setup và installation
- Swagger UI: http://localhost:9012/api-docs

