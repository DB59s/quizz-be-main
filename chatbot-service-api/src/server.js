// Load reflect-metadata for TypeORM
require('reflect-metadata');

// Load environment configuration
const { env, AppDataSource } = require('./config');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { initializeChatHandler } = require('./socket/chat.handler');

// Server startup function
async function startServer() {
  try {
    // Initialize database connection
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected successfully!');
    console.log(`Database type: ${env.DB_TYPE}`);
    console.log(`Database host: ${env.DB_HOST}:${env.DB_PORT}`);
    console.log(`Database name: ${env.DB_DATABASE}`);

    // Create HTTP server
    const server = http.createServer(app);

    // Socket.IO CORS configuration from environment
    const socketCorsOrigin = process.env.CORS_ORIGIN || '*';
    const socketCorsCredentials = process.env.CORS_CREDENTIALS === 'true';

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: socketCorsOrigin === '*' ? '*' : socketCorsOrigin.split(',').map(o => o.trim()),
        methods: ['GET', 'POST'],
        credentials: socketCorsCredentials
      },
      transports: ['websocket', 'polling']
    });

    console.log('[Socket.IO] CORS Configuration:');
    console.log(`[Socket.IO] - Origin: ${socketCorsOrigin}`);
    console.log(`[Socket.IO] - Credentials: ${socketCorsCredentials}`);

    // Initialize chat handler (no authentication required)
    initializeChatHandler(io);

    // Start server
    server.listen(env.PORT, () => {
      console.log('');
      console.log('🚀 ===================================');
      console.log(`🚀 Chatbot Service running in ${env.NODE_ENV} mode`);
      console.log(`🚀 Server started on port ${env.PORT}`);
      console.log(`🚀 Local URL: http://localhost:${env.PORT}`);
      console.log(`🚀 API URL: http://localhost:${env.PORT}/api`);
      console.log(`🚀 Socket.IO enabled`);
      console.log('🚀 ===================================');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        AppDataSource.destroy().then(() => {
          console.log('Database connection closed.');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        AppDataSource.destroy().then(() => {
          console.log('Database connection closed.');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
