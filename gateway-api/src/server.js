// Load reflect-metadata for TypeORM
require('reflect-metadata');

// Load environment configuration
const { env, AppDataSource } = require('./config');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocketProxy } = require('./socket/proxy');

// Database connection with retry
async function connectDatabase() {
  const maxRetries = 10;
  const retryDelay = 5000; // 5 seconds
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Connecting to database... (attempt ${i + 1}/${maxRetries})`);
      await AppDataSource.initialize();
      console.log('Database connected successfully!');
      console.log(`Database type: ${env.DB_TYPE}`);
      console.log(`Database host: ${env.DB_HOST}:${env.DB_PORT}`);
      console.log(`Database name: ${env.DB_DATABASE}`);
      return;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        console.error('Max database connection retries reached. Exiting...');
        process.exit(1);
      }
      
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Server startup function
async function startServer() {
  try {
    // Create HTTP server
    const server = http.createServer(app);

    // Socket.IO CORS configuration
    const socketCorsOrigin = process.env.CORS_ORIGIN || '*';
    const socketCorsCredentials = process.env.CORS_CREDENTIALS === 'true';

    // Initialize Socket.IO server
    const io = new Server(server, {
      cors: {
        origin: socketCorsOrigin === '*' ? '*' : socketCorsOrigin.split(',').map(o => o.trim()),
        methods: ['GET', 'POST'],
        credentials: socketCorsCredentials
      },
      transports: ['websocket', 'polling']
    });

    console.log('[Gateway Socket.IO] CORS Configuration:');
    console.log(`[Gateway Socket.IO] - Origin: ${socketCorsOrigin}`);
    console.log(`[Gateway Socket.IO] - Credentials: ${socketCorsCredentials}`);

    // Initialize Socket.IO proxy to Chatbot Service
    initializeSocketProxy(io);

    // Start server first (so health check passes)
    server.listen(env.PORT, () => {
      console.log('');
      console.log('🚀 ===================================');
      console.log(`🚀 Gateway running in ${env.NODE_ENV} mode`);
      console.log(`🚀 Server started on port ${env.PORT}`);
      console.log(`🚀 Local URL: http://localhost:${env.PORT}`);
      console.log(`🚀 API URL: http://localhost:${env.PORT}/api`);
      console.log(`🚀 Socket.IO Proxy enabled (→ Chatbot Service)`);
      console.log('🚀 ===================================');
      console.log('');
    });

    // Connect to database in background
    connectDatabase();

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
