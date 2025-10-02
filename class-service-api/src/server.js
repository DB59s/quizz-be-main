// Load environment configuration
const { env, connectDB, disconnectDB } = require('./config');
const app = require('./app');

// Server startup function
async function startServer() {
  try {
    // Initialize database connection
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully!');
    console.log(`Database: ${env.DB_DATABASE}`);
    console.log(`MongoDB URI: ${env.MONGODB_URI}`);

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log('');
      console.log('🚀 ===================================');
      console.log(`🚀 Server running in ${env.NODE_ENV} mode`);
      console.log(`🚀 Server started on port ${env.PORT}`);
      console.log(`🚀 Local URL: http://localhost:${env.PORT}`);
      console.log(`🚀 API URL: http://localhost:${env.PORT}/api`);
      console.log('🚀 ===================================');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        disconnectDB().then(() => {
          console.log('Database connection closed.');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        disconnectDB().then(() => {
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
