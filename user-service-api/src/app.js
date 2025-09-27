const express = require('express');
const { corsMiddleware } = require('./config');
const apiRouter = require('./router');
const errorHandler = require('./middleware/errorHandler');

// Create Express application
const app = express();

// Middleware
app.use(corsMiddleware); // CORS configuration
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount API routes with prefix
app.use('/api/v1', apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Service API',
    version: '1.0.0',
    documentation: '/api/v1',
    endpoints: {
      health: '/api/v1/health',
      users: '/api/v1/users',
      students: '/api/v1/students',
      teachers: '/api/v1/teachers',
      admins: '/api/v1/admins'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
