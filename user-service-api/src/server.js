// Load environment configuration
const { env, connectDB } = require('./config');
const app = require('./app');

// Server startup function
async function startServer() {
  try {
    // Initialize database connection
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully!');

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log('');
      console.log('🚀 ===================================');
      console.log(`🚀 User Service running in ${env.NODE_ENV} mode`);
      console.log(`🚀 Server started on port ${env.PORT}`);
      console.log(`🚀 Local URL: http://localhost:${env.PORT}`);
      console.log(`🚀 API URL: http://localhost:${env.PORT}/api/v1`);
      console.log('🚀 ===================================');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
