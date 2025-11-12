# 📚 FRONTEND INTEGRATION GUIDE - Chatbot System

> **Hướng dẫn tích hợp Frontend với hệ thống Chatbot AI**  
> **Production Domain:** `api.vuquangduy.online`  
> **Last Updated:** 2025-11-12

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kết nối Socket.IO](#2-kết-nối-socketio)
3. [Gửi tin nhắn chat](#3-gửi-tin-nhắn-chat)
4. [Các loại câu hỏi](#4-các-loại-câu-hỏi)
5. [Response format](#5-response-format)
6. [Error handling](#6-error-handling)
7. [Code examples](#7-code-examples)
8. [Testing](#8-testing)

---

## 1. TỔNG QUAN HỆ THỐNG

### 🏗️ Kiến trúc

```
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│             │         │             │         │                  │
│  Frontend   │────────▶│   Gateway   │────────▶│ Chatbot Service  │
│             │ Socket  │   (Proxy)   │ Socket  │                  │
└─────────────┘         └─────────────┘         └──────────────────┘
                              │                          │
                              │                          ├──▶ Question Service
                              │                          │
                              │                          ├──▶ Knowledge Service
                              │                          │
                              │                          └──▶ Gemini AI
```

### 🌐 Production URLs

| Service | URL | Port | Protocol |
|---------|-----|------|----------|
| **Gateway (Socket.IO)** | `wss://api.vuquangduy.online` | 443 | WebSocket |
| Gateway API | `https://api.vuquangduy.online/api/v1` | 443 | HTTPS |

### 🔑 Thông tin quan trọng

- ✅ **Không cần JWT token** cho Socket.IO
- ✅ **Bắt buộc gửi `account_id`** trong mỗi request
- ✅ **Hỗ trợ cả WebSocket và Polling**
- ✅ **CORS enabled** - Cho phép tất cả origins

---

## 2. KẾT NỐI SOCKET.IO

### 📦 Cài đặt

```bash
# NPM
npm install socket.io-client

# Yarn
yarn add socket.io-client

# CDN (cho HTML thuần)
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

### 🔌 Kết nối

#### **React/Vue/Angular:**

```javascript
import { io } from 'socket.io-client';

// Production
const socket = io('https://api.vuquangduy.online', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Development (local)
const socket = io('http://localhost:9008', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

#### **HTML thuần (CDN):**

```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script>
  const socket = io('https://api.vuquangduy.online', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
</script>
```

### 📡 Events kết nối

```javascript
// Kết nối thành công
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
});

// Mất kết nối
socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Lỗi kết nối
socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Reconnecting
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 Reconnecting... Attempt:', attemptNumber);
});

// Reconnected
socket.on('reconnect', (attemptNumber) => {
  console.log('✅ Reconnected after', attemptNumber, 'attempts');
});
```

---

## 3. GỬI TIN NHẮN CHAT

### 📨 Event: `chat:message`

**Đây là event chính để gửi tin nhắn và nhận response từ AI.**

### 📝 Request Format

```javascript
socket.emit('chat:message', {
  account_id: string,        // BẮT BUỘC - UUID của user
  prompt: string,            // BẮT BUỘC - Câu hỏi của user
  conversation_id: string,   // OPTIONAL - UUID của conversation (nếu có)
  context: {                 // OPTIONAL - Context để force phân loại
    type: string,            // 'question' hoặc 'knowledge'
    id: string               // ID của question (nếu type = 'question')
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

### 📋 Chi tiết các tham số

| Tham số | Type | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `account_id` | `string` (UUID) | ✅ **BẮT BUỘC** | ID của user đang chat. Dùng để lưu lịch sử chat và phân loại câu hỏi |
| `prompt` | `string` | ✅ **BẮT BUỘC** | Câu hỏi của user. Tối thiểu 1 ký tự |
| `conversation_id` | `string` (UUID) | ❌ Optional | ID của conversation hiện tại. Nếu không có, hệ thống sẽ tạo conversation mới |
| `context` | `object` | ❌ Optional | Context để force phân loại câu hỏi (xem chi tiết bên dưới) |
| `context.type` | `string` | ❌ Optional | Loại câu hỏi: `'question'` hoặc `'knowledge'` |
| `context.id` | `string` (UUID) | ❌ Optional | ID của question (chỉ dùng khi `type = 'question'`) |

---

## 4. CÁC LOẠI CÂU HỎI

Hệ thống hỗ trợ **3 loại câu hỏi**. Frontend có thể **force phân loại** bằng cách gửi `context`, hoặc để hệ thống **tự động phân loại** bằng Gemini AI.

### 📚 Type 1: QUESTION BANK (Ngân hàng câu hỏi)

**Khi nào dùng:**
- User đang xem một câu hỏi cụ thể và muốn AI giải thích
- User click vào nút "Giải thích câu hỏi này"
- User muốn hỏi về một câu hỏi trắc nghiệm cụ thể

**Request:**

```javascript
socket.emit('chat:message', {
  account_id: '550e8400-e29b-41d4-a716-446655440000',
  prompt: 'Giải thích câu hỏi này cho tôi',
  context: {
    type: 'question',
    id: 'abc123-question-uuid-here'  // ID của question từ Question Service
  }
}, (response) => {
  console.log(response.data.response);
});
```

**Luồng xử lý:**
1. Frontend gửi `context.type = 'question'` và `context.id`
2. Chatbot Service gọi Question Service để lấy chi tiết câu hỏi
3. Gemini AI phân tích câu hỏi và đưa ra giải thích chi tiết
4. Response trả về giải thích về câu hỏi đó

**Response example:**
```
"Câu hỏi này hỏi về khái niệm Deadlock trong hệ điều hành. 

Deadlock xảy ra khi các tiến trình chờ đợi lẫn nhau để giải phóng tài nguyên...

Đáp án đúng là B vì..."
```

---

### 🧠 Type 2: KNOWLEDGE BASE (Tri thức chung)

**Khi nào dùng:**
- User hỏi về kiến thức chung, khái niệm, lý thuyết
- User muốn tìm hiểu về một chủ đề cụ thể
- User click vào nút "Tìm kiếm tri thức"

**Request:**

```javascript
socket.emit('chat:message', {
  account_id: '550e8400-e29b-41d4-a716-446655440000',
  prompt: 'Tiến trình trong hệ điều hành là gì?',
  context: {
    type: 'knowledge'
  }
}, (response) => {
  console.log(response.data.response);
});
```

**Luồng xử lý:**
1. Frontend gửi `context.type = 'knowledge'`
2. Chatbot Service gọi Knowledge Service (RAG) để tìm kiếm vector database
3. Knowledge Service trả về 10 chunks liên quan nhất
4. Gemini AI tổng hợp thông tin từ các chunks và trả lời

**Response example:**
```
"Dựa trên tài liệu về Hệ điều hành:

Tiến trình (Process) là một chương trình đang được thực thi. Mỗi tiến trình có:
- Không gian địa chỉ riêng
- Bộ đếm chương trình (Program Counter)
- Ngăn xếp (Stack)
- Dữ liệu (Data section)

Nguồn: Chương 2 - Quản lý tiến trình, trang 45-47"
```

---

### 💬 Type 3: GENERAL CHAT (Chat chung)

**Khi nào dùng:**
- User hỏi câu hỏi chung không liên quan đến học tập
- User muốn chat tự do với AI
- Không gửi `context` hoặc để hệ thống tự phân loại

**Request:**

```javascript
socket.emit('chat:message', {
  account_id: '550e8400-e29b-41d4-a716-446655440000',
  prompt: 'Kể cho tôi một câu chuyện vui',
  // Không gửi context - để hệ thống tự phân loại
}, (response) => {
  console.log(response.data.response);
});
```

**Luồng xử lý:**
1. Frontend không gửi `context`
2. Chatbot Service dùng Gemini AI để phân loại câu hỏi
3. Gemini AI nhận diện đây là câu hỏi chung (không liên quan học tập)
4. Gemini AI trả lời trực tiếp dựa trên lịch sử chat

**Response example:**
```
"Được thôi! Để tôi kể cho bạn nghe một câu chuyện vui:

Ngày xửa ngày xưa, có một lập trình viên..."
```

---

## 5. RESPONSE FORMAT

### ✅ Success Response

```javascript
{
  success: true,
  data: {
    response: "Câu trả lời từ AI...",
    conversation_id: "uuid-of-conversation",
    timestamp: "2025-11-12T10:30:00.000Z"
  }
}
```

### ❌ Error Response

```javascript
{
  success: false,
  message: "Error message here",
  data: null
}
```

---

## 6. ERROR HANDLING

### 🔴 Các loại lỗi thường gặp

```javascript
socket.emit('chat:message', data, (response) => {
  if (!response.success) {
    switch (response.message) {
      case 'account_id is required':
        // Thiếu account_id
        console.error('Vui lòng đăng nhập');
        break;
      
      case 'Invalid prompt':
        // Prompt không hợp lệ
        console.error('Vui lòng nhập câu hỏi');
        break;
      
      case 'Failed to generate response':
        // Lỗi từ Gemini AI
        console.error('Không thể tạo câu trả lời. Vui lòng thử lại');
        break;
      
      default:
        console.error('Lỗi:', response.message);
    }
  }
});

// Lắng nghe error event
socket.on('chat:error', (error) => {
  console.error('Chat error:', error.message);
  // Hiển thị thông báo lỗi cho user
});
```

---

## 7. CODE EXAMPLES

### 🎯 Example 1: React Hook

```javascript
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://api.vuquangduy.online';

export function useChatbot(accountId) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  // Initialize socket
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Send message
  const sendMessage = useCallback((prompt, context = null) => {
    if (!socket || !connected) {
      console.error('Socket not connected');
      return;
    }

    // Add user message to UI
    setMessages(prev => [...prev, {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }]);

    // Send to server
    socket.emit('chat:message', {
      account_id: accountId,
      prompt,
      conversation_id: conversationId,
      context
    }, (response) => {
      if (response.success) {
        // Add AI response to UI
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date()
        }]);

        // Save conversation ID
        setConversationId(response.data.conversation_id);
      } else {
        console.error('Error:', response.message);
      }
    });
  }, [socket, connected, accountId, conversationId]);

  return {
    connected,
    messages,
    sendMessage
  };
}
```

**Usage:**

```javascript
function ChatComponent() {
  const accountId = '550e8400-e29b-41d4-a716-446655440000'; // From auth
  const { connected, messages, sendMessage } = useChatbot(accountId);

  const handleSend = (text) => {
    sendMessage(text);
  };

  const handleExplainQuestion = (questionId) => {
    sendMessage('Giải thích câu hỏi này', {
      type: 'question',
      id: questionId
    });
  };

  return (
    <div>
      <div>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <button onClick={() => handleSend('Tiến trình là gì?')}>
        Ask Question
      </button>
    </div>
  );
}
```

---

### 🎯 Example 2: Vue 3 Composition API

```vue
<template>
  <div class="chatbot">
    <div class="status">
      <span v-if="connected">🟢 Connected</span>
      <span v-else>🔴 Disconnected</span>
    </div>

    <div class="messages">
      <div v-for="(msg, i) in messages" :key="i" :class="msg.role">
        <strong>{{ msg.role }}:</strong> {{ msg.content }}
      </div>
    </div>

    <div class="input">
      <input v-model="inputText" @keyup.enter="sendMessage" placeholder="Ask a question..." />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://api.vuquangduy.online';
const accountId = '550e8400-e29b-41d4-a716-446655440000'; // From auth

const socket = ref(null);
const connected = ref(false);
const messages = ref([]);
const conversationId = ref(null);
const inputText = ref('');

onMounted(() => {
  socket.value = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true
  });

  socket.value.on('connect', () => {
    console.log('✅ Connected');
    connected.value = true;
  });

  socket.value.on('disconnect', () => {
    console.log('❌ Disconnected');
    connected.value = false;
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});

const sendMessage = () => {
  if (!inputText.value.trim() || !connected.value) return;

  const prompt = inputText.value;
  inputText.value = '';

  // Add user message
  messages.value.push({
    role: 'user',
    content: prompt
  });

  // Send to server
  socket.value.emit('chat:message', {
    account_id: accountId,
    prompt,
    conversation_id: conversationId.value
  }, (response) => {
    if (response.success) {
      messages.value.push({
        role: 'assistant',
        content: response.data.response
      });
      conversationId.value = response.data.conversation_id;
    } else {
      console.error('Error:', response.message);
    }
  });
};
</script>
```

---

### 🎯 Example 3: Vanilla JavaScript (HTML thuần)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Chatbot Demo</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  <style>
    .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
    .user { background: #e3f2fd; text-align: right; }
    .assistant { background: #f5f5f5; text-align: left; }
    .status { padding: 10px; font-weight: bold; }
    .connected { color: green; }
    .disconnected { color: red; }
  </style>
</head>
<body>
  <div id="status" class="status disconnected">🔴 Disconnected</div>
  <div id="messages"></div>
  <input id="input" type="text" placeholder="Ask a question..." />
  <button onclick="sendMessage()">Send</button>

  <script>
    const SOCKET_URL = 'https://api.vuquangduy.online';
    const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000'; // From auth

    let conversationId = null;

    // Connect to socket
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected');
      document.getElementById('status').innerHTML = '🟢 Connected';
      document.getElementById('status').className = 'status connected';
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected');
      document.getElementById('status').innerHTML = '🔴 Disconnected';
      document.getElementById('status').className = 'status disconnected';
    });

    // Send message function
    function sendMessage() {
      const input = document.getElementById('input');
      const prompt = input.value.trim();

      if (!prompt) return;

      // Add user message to UI
      addMessage('user', prompt);
      input.value = '';

      // Send to server
      socket.emit('chat:message', {
        account_id: ACCOUNT_ID,
        prompt: prompt,
        conversation_id: conversationId
      }, (response) => {
        if (response.success) {
          // Add AI response to UI
          addMessage('assistant', response.data.response);
          conversationId = response.data.conversation_id;
        } else {
          alert('Error: ' + response.message);
        }
      });
    }

    // Add message to UI
    function addMessage(role, content) {
      const messagesDiv = document.getElementById('messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + role;
      messageDiv.innerHTML = '<strong>' + role + ':</strong> ' + content;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Enter key to send
    document.getElementById('input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
```

---

### 🎯 Example 4: Giải thích câu hỏi cụ thể

```javascript
// Khi user click vào nút "Giải thích câu hỏi này"
function explainQuestion(questionId) {
  socket.emit('chat:message', {
    account_id: currentUser.id,
    prompt: 'Giải thích câu hỏi này cho tôi',
    context: {
      type: 'question',
      id: questionId  // ID từ Question Service
    }
  }, (response) => {
    if (response.success) {
      // Hiển thị giải thích trong modal hoặc panel
      showExplanationModal(response.data.response);
    }
  });
}

// Khi user hỏi về một câu hỏi cụ thể trong chat
function askAboutQuestion(questionId, userQuestion) {
  socket.emit('chat:message', {
    account_id: currentUser.id,
    prompt: userQuestion, // VD: "Tại sao đáp án B lại đúng?"
    context: {
      type: 'question',
      id: questionId
    }
  }, (response) => {
    if (response.success) {
      addMessageToChat('assistant', response.data.response);
    }
  });
}
```

---

### 🎯 Example 5: Tìm kiếm tri thức

```javascript
// Khi user click vào nút "Tìm kiếm tri thức"
function searchKnowledge(query) {
  socket.emit('chat:message', {
    account_id: currentUser.id,
    prompt: query,
    context: {
      type: 'knowledge'
    }
  }, (response) => {
    if (response.success) {
      // Hiển thị kết quả tìm kiếm
      displayKnowledgeResult(response.data.response);
    }
  });
}

// Example usage
searchKnowledge('Tiến trình trong hệ điều hành là gì?');
searchKnowledge('Giải thích về Deadlock');
searchKnowledge('Thuật toán điều độ CPU');
```

---

### 🎯 Example 6: Chat tự do (để hệ thống tự phân loại)

```javascript
// Khi user chat tự do, không gửi context
function sendFreeChat(message) {
  socket.emit('chat:message', {
    account_id: currentUser.id,
    prompt: message,
    // Không gửi context - để hệ thống tự phân loại
  }, (response) => {
    if (response.success) {
      addMessageToChat('assistant', response.data.response);
    }
  });
}

// Hệ thống sẽ tự động phân loại:
sendFreeChat('Tiến trình là gì?');           // → knowledge_base
sendFreeChat('Kể cho tôi một câu chuyện');   // → general chat
sendFreeChat('Giải thích câu hỏi về SQL');   // → question_bank (nếu tìm thấy)
```

---

## 8. TESTING

### 🧪 Test với Browser Console

```javascript
// 1. Mở browser console (F12)
// 2. Load Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(script);

// 3. Sau khi load xong, connect
const socket = io('https://api.vuquangduy.online', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => console.log('✅ Connected'));

// 4. Test gửi message
socket.emit('chat:message', {
  account_id: '550e8400-e29b-41d4-a716-446655440000',
  prompt: 'Tiến trình là gì?'
}, (response) => {
  console.log('Response:', response);
});
```

### 🧪 Test với Postman

Postman hỗ trợ Socket.IO testing:

1. Tạo new request → chọn **Socket.IO**
2. URL: `https://api.vuquangduy.online`
3. Event name: `chat:message`
4. Message:
```json
{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "Tiến trình là gì?"
}
```
5. Click **Send**

---

## 9. BEST PRACTICES

### ✅ Nên làm

1. **Lưu conversation_id** để tiếp tục cuộc hội thoại
2. **Hiển thị loading state** khi đang chờ response
3. **Handle reconnection** khi mất kết nối
4. **Validate input** trước khi gửi
5. **Show error messages** thân thiện với user
6. **Implement retry logic** cho failed requests
7. **Cache messages** locally để tránh mất dữ liệu

### ❌ Không nên làm

1. ❌ Gửi message khi chưa connect
2. ❌ Gửi prompt rỗng
3. ❌ Quên gửi account_id
4. ❌ Tạo nhiều socket connections
5. ❌ Không handle errors
6. ❌ Không cleanup socket khi unmount component

---

## 10. TROUBLESHOOTING

### ❓ Không kết nối được?

```javascript
// Check connection status
console.log('Connected:', socket.connected);
console.log('Socket ID:', socket.id);

// Check transports
socket.on('connect', () => {
  console.log('Transport:', socket.io.engine.transport.name);
});
```

### ❓ Không nhận được response?

```javascript
// Make sure to use callback
socket.emit('chat:message', data, (response) => {
  console.log('Response:', response);
});

// Or listen to chat:response event
socket.on('chat:response', (data) => {
  console.log('Response:', data);
});
```

### ❓ Lỗi "account_id is required"?

```javascript
// Make sure account_id is included
socket.emit('chat:message', {
  account_id: currentUser.id,  // ✅ Required
  prompt: 'Your question'
});
```

---

## 11. API REFERENCE

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | ← Server | Kết nối thành công |
| `disconnect` | ← Server | Mất kết nối |
| `connect_error` | ← Server | Lỗi kết nối |
| `reconnect` | ← Server | Kết nối lại thành công |
| `chat:message` | → Server | Gửi tin nhắn |
| `chat:response` | ← Server | Nhận response (nếu không dùng callback) |
| `chat:error` | ← Server | Nhận lỗi |
| `chat:typing` | ↔ Both | Typing indicator |

### Request Schema

```typescript
interface ChatMessageRequest {
  account_id: string;           // UUID - Required
  prompt: string;               // Required
  conversation_id?: string;     // UUID - Optional
  context?: {
    type: 'question' | 'knowledge';
    id?: string;                // UUID - Required if type = 'question'
  };
}
```

### Response Schema

```typescript
interface ChatMessageResponse {
  success: boolean;
  data?: {
    response: string;
    conversation_id: string;
    timestamp: string;
  };
  message?: string;  // Error message if success = false
}
```

---

## 12. SUPPORT

### 📧 Contact

- **Email:** vuduy050903@gmail.com
- **Domain:** api.vuquangduy.online

### 📚 Documentation

- Gateway API Docs: `https://api.vuquangduy.online/api-docs`
- Socket.IO Docs: `https://socket.io/docs/v4/`

---

**🎉 Chúc bạn tích hợp thành công!**
