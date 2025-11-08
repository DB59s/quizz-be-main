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
      try {
        console.log(`[Socket.IO] Received message:`, data);

        // Validate input
        if (!data.account_id) {
          const error = { success: false, message: 'account_id is required' };
          if (callback) callback(error);
          return;
        }

        if (!data.prompt || typeof data.prompt !== 'string') {
          const error = { success: false, message: 'Invalid prompt' };
          if (callback) callback(error);
          return;
        }

        // Process message with RAG
        const result = await processMessage(data, data.account_id);

        // Send response back to client
        const response = {
          success: true,
          data: {
            response: result.response,
            conversation_id: result.conversation_id,
            timestamp: new Date().toISOString()
          }
        };

        console.log(`[Socket.IO] Sending response for account ${data.account_id}`);

        if (callback) {
          callback(response);
        } else {
          socket.emit('chat:response', response);
        }
      } catch (error) {
        console.error('[Socket.IO] Error processing message:', error);

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

