# 🔌 Socket.IO Client Guide - Chatbot Service

## 📡 Connection Information

### Production URL
```
http://localhost:9009
```
hoặc khi deploy:
```
https://your-domain.com
```

### Port Configuration
- **Development**: `9009`
- **Production**: `9009`

---

## 🚀 Quick Start

### 1. Install Socket.IO Client
```bash
npm install socket.io-client
```

### 2. Basic Connection
```javascript
import io from 'socket.io-client';

// Connect to server
const socket = io('http://localhost:9009', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Listen for connection
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

---

## 📨 Send Message to Chatbot

### Event: `chat:message`

**Request Format:**
```javascript
socket.emit('chat:message', {
  account_id: "550e8400-e29b-41d4-a716-446655440000", // REQUIRED: UUID format
  prompt: "What is React?",                           // REQUIRED: Your question
  conversation_id: "conv-123",                        // OPTIONAL: For continuing conversation
  context: null                                        // OPTIONAL: Additional context
}, (response) => {
  // Callback receives response immediately
  if (response.success) {
    console.log('AI Response:', response.data.response);
    console.log('Conversation ID:', response.data.conversation_id);
  } else {
    console.error('Error:', response.message);
  }
});
```

**Response Format (Success):**
```json
{
  "success": true,
  "data": {
    "response": "React is a JavaScript library...",
    "conversation_id": "uuid-here",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

**Response Format (Error):**
```json
{
  "success": false,
  "message": "account_id must be a valid UUID format",
  "data": null
}
```

---

## 🎯 Complete React Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function ChatbotComponent() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Your user's account_id (must be UUID format!)
  const ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440000";

  useEffect(() => {
    // Connect to chatbot service
    const newSocket = io('http://localhost:9009', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chatbot');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chatbot');
    });

    // Listen for responses (alternative to callback)
    newSocket.on('chat:response', (data) => {
      console.log('Response received:', data);
      setResponse(data.data.response);
      setConversationId(data.data.conversation_id);
      setLoading(false);
    });

    // Listen for errors
    newSocket.on('chat:error', (error) => {
      console.error('Error:', error);
      alert('Error: ' + error.message);
      setLoading(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => newSocket.close();
  }, []);

  const handleSend = () => {
    if (!socket || !message.trim()) return;

    setLoading(true);
    
    // Send message with callback
    socket.emit('chat:message', {
      account_id: ACCOUNT_ID,
      prompt: message,
      conversation_id: conversationId // Continue conversation if exists
    }, (res) => {
      if (res.success) {
        setResponse(res.data.response);
        setConversationId(res.data.conversation_id);
      } else {
        alert('Error: ' + res.message);
      }
      setLoading(false);
    });

    setMessage(''); // Clear input
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>AI Chatbot</h2>
      
      <div>
        <input 
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          disabled={loading}
          style={{ width: '80%', padding: '10px' }}
        />
        <button 
          onClick={handleSend}
          disabled={loading || !message.trim()}
          style={{ padding: '10px 20px', marginLeft: '10px' }}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {response && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <strong>AI Response:</strong>
          <p>{response}</p>
        </div>
      )}

      {conversationId && (
        <p style={{ fontSize: '12px', color: '#666' }}>
          Conversation ID: {conversationId}
        </p>
      )}
    </div>
  );
}

export default ChatbotComponent;
```

---

## 🔧 Additional Features

### Join Conversation Room
```javascript
socket.emit('chat:join', {
  account_id: "your-uuid",
  conversation_id: "conv-123"
});
```

### Leave Conversation Room
```javascript
socket.emit('chat:leave', {
  account_id: "your-uuid",
  conversation_id: "conv-123"
});
```

### Typing Indicator
```javascript
// Send typing indicator
socket.emit('chat:typing', {
  account_id: "your-uuid",
  conversation_id: "conv-123"
});

// Listen for others typing
socket.on('chat:typing', (data) => {
  console.log(`${data.account_id} is typing...`);
});
```

---

## ⚠️ Important Notes

### 1. **UUID Format Required**
`account_id` MUST be in UUID format:
```
✅ Valid:   "550e8400-e29b-41d4-a716-446655440000"
❌ Invalid: "user-123", "test-account", 123
```

### 2. **CORS Configuration**
Server is configured to accept ALL origins (`*`) in docker-compose:
```yaml
CORS_ORIGIN: "*"
CORS_CREDENTIALS: "false"
```

### 3. **Error Handling**
Always handle errors:
```javascript
socket.on('chat:error', (error) => {
  console.error('Socket error:', error.message);
});

socket.on('error', (error) => {
  console.error('Connection error:', error);
});
```

---

## 🧪 Testing

### Using Browser Console
```javascript
const socket = io('http://localhost:9009');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  socket.emit('chat:message', {
    account_id: "550e8400-e29b-41d4-a716-446655440000",
    prompt: "Hello AI!"
  }, (res) => {
    console.log('Response:', res);
  });
});
```

### Using Postman / Thunder Client
Socket.IO connections can be tested with Postman's Socket.IO support.

---

## 📚 Events Reference

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | ← Server | Connection established |
| `disconnect` | ← Server | Connection closed |
| `chat:message` | → Server | Send message to AI |
| `chat:response` | ← Server | Receive AI response |
| `chat:error` | ← Server | Error occurred |
| `chat:typing` | ↔ Both | Typing indicator |
| `chat:join` | → Server | Join conversation room |
| `chat:leave` | → Server | Leave conversation room |

---

## 🌐 Production Deployment

### Environment Variables
```bash
PORT=9009
CORS_ORIGIN=*                    # Allow all origins
CORS_CREDENTIALS=false           # No credentials needed
```

### Specific Origins (if needed)
```bash
CORS_ORIGIN=https://frontend1.com,https://frontend2.com
CORS_CREDENTIALS=true
```

### Frontend Connection
```javascript
// Production
const socket = io('https://chatbot.yourdomain.com');

// With path (if behind proxy)
const socket = io('https://yourdomain.com', {
  path: '/chatbot/socket.io'
});
```

---

## 🐛 Troubleshooting

### Connection Issues
1. Check if server is running: `http://localhost:9009`
2. Verify CORS settings in docker-compose.yml
3. Check browser console for errors

### UUID Validation Error
```
❌ Error: account_id must be a valid UUID format
```
Solution: Use proper UUID format for account_id

### No Response
- Check if callback is provided in emit()
- Listen for `chat:response` event
- Check server logs for errors

---

## 📞 Support

For issues or questions:
- Check server logs: `docker logs quiz_chatbot_service_api`
- Verify environment variables in docker-compose.yml
- Test with provided examples first
