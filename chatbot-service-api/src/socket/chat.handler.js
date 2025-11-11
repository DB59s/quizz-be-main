const { processMessage } = require('../service/rag.service');

/**
 * Initialize chat handler for Socket.IO
 * @param {Server} io - Socket.IO server instance
 */
function initializeChatHandler(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Handle chat message
    socket.on('chat:message', async (data, callback) => {
      const startTime = Date.now();
      console.log('\n========================================');
      console.log('[Socket.IO] 📨 NEW MESSAGE RECEIVED');
      console.log('========================================');
      console.log('[Socket.IO] Socket ID:', socket.id);
      console.log('[Socket.IO] Timestamp:', new Date().toISOString());
      console.log('[Socket.IO] Data:', JSON.stringify(data, null, 2));

      try {
        // Validate input
        console.log('[Socket.IO] ✓ Step 1: Validating input...');

        if (!data.account_id) {
          console.error('[Socket.IO] ✗ Validation failed: account_id is required');
          const error = { success: false, message: 'account_id is required' };
          if (callback) callback(error);
          return;
        }

        if (!data.prompt || typeof data.prompt !== 'string') {
          console.error('[Socket.IO] ✗ Validation failed: Invalid prompt');
          const error = { success: false, message: 'Invalid prompt' };
          if (callback) callback(error);
          return;
        }

        console.log('[Socket.IO] ✓ Validation passed');
        console.log('[Socket.IO] - Account ID:', data.account_id);
        console.log('[Socket.IO] - Conversation ID:', data.conversation_id || 'NEW');
        console.log('[Socket.IO] - Prompt:', data.prompt);
        console.log('[Socket.IO] - Context:', JSON.stringify(data.context || null));

        // Process message with RAG
        console.log('[Socket.IO] ✓ Step 2: Processing message with RAG...');
        const result = await processMessage(data, data.account_id);

        const processingTime = Date.now() - startTime;
        console.log(`[Socket.IO] ✓ Step 3: RAG processing completed in ${processingTime}ms`);

        // Send response back to client
        const response = {
          success: true,
          data: {
            response: result.response,
            conversation_id: result.conversation_id,
            timestamp: new Date().toISOString()
          }
        };

        console.log('[Socket.IO] ✓ Step 4: Sending response to client');
        console.log('[Socket.IO] - Response length:', result.response.length, 'characters');
        console.log('[Socket.IO] - Conversation ID:', result.conversation_id);
        console.log('[Socket.IO] - Total time:', processingTime, 'ms');
        console.log('========================================');
        console.log('[Socket.IO] ✅ MESSAGE PROCESSED SUCCESSFULLY');
        console.log('========================================\n');

        if (callback) {
          callback(response);
        } else {
          socket.emit('chat:response', response);
        }
      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('\n========================================');
        console.error('[Socket.IO] ❌ ERROR PROCESSING MESSAGE');
        console.error('========================================');
        console.error('[Socket.IO] Error:', error.message);
        console.error('[Socket.IO] Stack:', error.stack);
        console.error('[Socket.IO] Time before error:', processingTime, 'ms');
        console.error('========================================\n');

        const errorResponse = {
          success: false,
          message: error.message || 'Failed to process message',
          data: null
        };

        if (callback) {
          callback(errorResponse);
        } else {
          socket.emit('chat:error', errorResponse);
        }
      }
    });

    // Handle typing indicator
    socket.on('chat:typing', (data) => {
      if (data.account_id) {
        console.log(`[Socket.IO] User ${data.account_id} is typing`);
        // Broadcast to other users in the same conversation (if needed)
        if (data.conversation_id) {
          socket.to(data.conversation_id).emit('chat:typing', {
            account_id: data.account_id,
            conversation_id: data.conversation_id
          });
        }
      }
    });

    // Handle join conversation room
    socket.on('chat:join', (data) => {
      if (data.conversation_id && data.account_id) {
        socket.join(data.conversation_id);
        console.log(`[Socket.IO] User ${data.account_id} joined conversation ${data.conversation_id}`);
      }
    });

    // Handle leave conversation room
    socket.on('chat:leave', (data) => {
      if (data.conversation_id && data.account_id) {
        socket.leave(data.conversation_id);
        console.log(`[Socket.IO] User ${data.account_id} left conversation ${data.conversation_id}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('[Socket.IO] Socket error:', error);
    });
  });

  console.log('[Socket.IO] Chat handler initialized');
}

module.exports = {
  initializeChatHandler
};

