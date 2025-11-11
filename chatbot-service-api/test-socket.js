/**
 * Test Socket.IO Chat
 * 
 * Usage:
 *   node test-socket.js
 * 
 * This script will:
 * 1. Connect to Socket.IO server
 * 2. Send a test message
 * 3. Receive and display the response
 * 4. Show all logs
 */

const io = require('socket.io-client');

// Configuration
const SOCKET_URL = 'http://localhost:9012';
const TEST_ACCOUNT_ID = 'test-account-123';

// Test scenarios
const TEST_SCENARIOS = {
  1: {
    name: 'Test without context (auto-classify)',
    data: {
      account_id: TEST_ACCOUNT_ID,
      prompt: 'Giải thích định lý Pythagoras là gì?',
    }
  },
  2: {
    name: 'Test with question context (Type 1: question_bank)',
    data: {
      account_id: TEST_ACCOUNT_ID,
      prompt: 'Giải thích câu hỏi này cho tôi',
      context: {
        type: 'question',
        id: 'some-question-id-here'  // Replace with real question ID
      }
    }
  },
  3: {
    name: 'Test with knowledge context (Type 2: knowledge_base)',
    data: {
      account_id: TEST_ACCOUNT_ID,
      prompt: 'Lý thuyết về hàm số bậc 2',
      context: {
        type: 'knowledge'
      }
    }
  },
  4: {
    name: 'Test with existing conversation',
    data: {
      account_id: TEST_ACCOUNT_ID,
      conversation_id: 'existing-conv-id-here',  // Replace with real conversation ID
      prompt: 'Tiếp tục giải thích thêm',
    }
  }
};

// Select scenario (change this number to test different scenarios)
const SELECTED_SCENARIO = 1;

console.log('\n========================================');
console.log('🧪 SOCKET.IO CHAT TEST');
console.log('========================================');
console.log('Server:', SOCKET_URL);
console.log('Scenario:', TEST_SCENARIOS[SELECTED_SCENARIO].name);
console.log('========================================\n');

// Connect to Socket.IO
console.log('[Test] Connecting to Socket.IO server...');
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection events
socket.on('connect', () => {
  console.log('[Test] ✓ Connected to Socket.IO server');
  console.log('[Test] Socket ID:', socket.id);
  console.log('\n[Test] Sending message...');
  console.log('[Test] Data:', JSON.stringify(TEST_SCENARIOS[SELECTED_SCENARIO].data, null, 2));
  console.log('\n========================================');
  console.log('[Test] Waiting for response...');
  console.log('========================================\n');

  // Send message
  const startTime = Date.now();
  socket.emit('chat:message', TEST_SCENARIOS[SELECTED_SCENARIO].data, (response) => {
    const duration = Date.now() - startTime;
    
    console.log('\n========================================');
    console.log('[Test] ✅ RESPONSE RECEIVED');
    console.log('========================================');
    console.log('[Test] Duration:', duration, 'ms');
    console.log('[Test] Response:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log('\n[Test] ✓ Success!');
      console.log('[Test] - Conversation ID:', response.data.conversation_id);
      console.log('[Test] - Response length:', response.data.response.length, 'characters');
      console.log('[Test] - Response preview:', response.data.response.substring(0, 200) + '...');
    } else {
      console.log('\n[Test] ✗ Error:', response.message);
    }
    
    console.log('\n========================================');
    console.log('[Test] Test completed. Disconnecting...');
    console.log('========================================\n');
    
    socket.disconnect();
    process.exit(0);
  });
});

socket.on('connect_error', (error) => {
  console.error('[Test] ❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('[Test] Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('[Test] ❌ Socket error:', error);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\n[Test] ❌ Timeout: No response after 60 seconds');
  socket.disconnect();
  process.exit(1);
}, 60000);

console.log('[Test] Waiting for connection...\n');

