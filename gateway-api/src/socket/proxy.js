const { io: ioClient } = require('socket.io-client');
const { env } = require('../config');

/**
 * Socket.IO Proxy - Forward connections from Gateway to Chatbot Service
 * 
 * Flow:
 * Frontend → Gateway (Port 9008) → Chatbot Service (Port 9009)
 */

// Chatbot Service URL (internal Docker network)
const CHATBOT_SERVICE_URL = env.CHATBOT_SERVICE_BASEURL.replace('/api/v1', ''); // Remove /api/v1 suffix
console.log('[Socket.IO Proxy] Chatbot Service URL:', CHATBOT_SERVICE_URL);

/**
 * Initialize Socket.IO proxy
 * @param {Server} io - Socket.IO server instance from Gateway
 */
function initializeSocketProxy(io) {
  console.log('[Socket.IO Proxy] Initializing proxy to Chatbot Service...');

  // Handle client connections to Gateway
  io.on('connection', (clientSocket) => {
    console.log(`[Socket.IO Proxy] ✅ Client connected to Gateway: ${clientSocket.id}`);

    // Create connection to Chatbot Service for this client
    const chatbotSocket = ioClient(CHATBOT_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    console.log(`[Socket.IO Proxy] 🔗 Connecting to Chatbot Service for client ${clientSocket.id}...`);

    // ========================================
    // CHATBOT SERVICE → GATEWAY → CLIENT
    // ========================================

    // When connected to Chatbot Service
    chatbotSocket.on('connect', () => {
      console.log(`[Socket.IO Proxy] ✅ Connected to Chatbot Service (${chatbotSocket.id}) for client ${clientSocket.id}`);
    });

    // When disconnected from Chatbot Service
    chatbotSocket.on('disconnect', (reason) => {
      console.log(`[Socket.IO Proxy] ❌ Disconnected from Chatbot Service for client ${clientSocket.id}: ${reason}`);
    });

    // Connection error to Chatbot Service
    chatbotSocket.on('connect_error', (error) => {
      console.error(`[Socket.IO Proxy] ❌ Connection error to Chatbot Service for client ${clientSocket.id}:`, error.message);
      clientSocket.emit('chat:error', {
        success: false,
        message: 'Failed to connect to Chatbot Service',
        error: error.message
      });
    });

    // Forward chat:response from Chatbot Service to Client
    chatbotSocket.on('chat:response', (data) => {
      console.log(`[Socket.IO Proxy] 📥 Forwarding chat:response to client ${clientSocket.id}`);
      clientSocket.emit('chat:response', data);
    });

    // Forward chat:error from Chatbot Service to Client
    chatbotSocket.on('chat:error', (data) => {
      console.log(`[Socket.IO Proxy] ⚠️ Forwarding chat:error to client ${clientSocket.id}`);
      clientSocket.emit('chat:error', data);
    });

    // Forward chat:typing from Chatbot Service to Client
    chatbotSocket.on('chat:typing', (data) => {
      clientSocket.emit('chat:typing', data);
    });

    // Forward chat:stop_typing from Chatbot Service to Client
    chatbotSocket.on('chat:stop_typing', (data) => {
      clientSocket.emit('chat:stop_typing', data);
    });

    // ========================================
    // CLIENT → GATEWAY → CHATBOT SERVICE
    // ========================================

    // Forward chat:message from Client to Chatbot Service
    clientSocket.on('chat:message', (data, callback) => {
      console.log(`[Socket.IO Proxy] 📤 Forwarding chat:message from client ${clientSocket.id} to Chatbot Service`);
      console.log(`[Socket.IO Proxy] - Account ID: ${data.account_id}`);
      console.log(`[Socket.IO Proxy] - Prompt: ${data.prompt?.substring(0, 50)}...`);
      console.log(`[Socket.IO Proxy] - Conversation ID: ${data.conversation_id || 'NEW'}`);

      // Forward to Chatbot Service with callback
      chatbotSocket.emit('chat:message', data, (response) => {
        console.log(`[Socket.IO Proxy] 📥 Received response from Chatbot Service for client ${clientSocket.id}`);
        
        // Forward response back to client via callback
        if (callback && typeof callback === 'function') {
          callback(response);
        }
      });
    });

    // Forward chat:typing from Client to Chatbot Service
    clientSocket.on('chat:typing', (data) => {
      chatbotSocket.emit('chat:typing', data);
    });

    // Forward chat:stop_typing from Client to Chatbot Service
    clientSocket.on('chat:stop_typing', (data) => {
      chatbotSocket.emit('chat:stop_typing', data);
    });

    // Forward chat:join from Client to Chatbot Service
    clientSocket.on('chat:join', (data) => {
      console.log(`[Socket.IO Proxy] 🚪 Client ${clientSocket.id} joining conversation ${data.conversation_id}`);
      chatbotSocket.emit('chat:join', data);
    });

    // Forward chat:leave from Client to Chatbot Service
    clientSocket.on('chat:leave', (data) => {
      console.log(`[Socket.IO Proxy] 🚪 Client ${clientSocket.id} leaving conversation ${data.conversation_id}`);
      chatbotSocket.emit('chat:leave', data);
    });

    // ========================================
    // CLEANUP
    // ========================================

    // When client disconnects from Gateway
    clientSocket.on('disconnect', (reason) => {
      console.log(`[Socket.IO Proxy] ❌ Client ${clientSocket.id} disconnected from Gateway: ${reason}`);
      
      // Close connection to Chatbot Service
      if (chatbotSocket && chatbotSocket.connected) {
        console.log(`[Socket.IO Proxy] 🔌 Closing connection to Chatbot Service for client ${clientSocket.id}`);
        chatbotSocket.close();
      }
    });

    // Handle errors from client
    clientSocket.on('error', (error) => {
      console.error(`[Socket.IO Proxy] ❌ Client ${clientSocket.id} error:`, error.message);
    });
  });

  console.log('[Socket.IO Proxy] ✅ Proxy initialized successfully');
}

module.exports = { initializeSocketProxy };

