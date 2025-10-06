const express = require('express');
const { corsMiddleware } = require('./config');
const apiRouter = require('./router');
const { specs, swaggerUi } = require('./config/swagger');

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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth Service API Documentation'
}));

// Health check endpoint (for Docker)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gateway API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/v1', apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gateway API Server',
    version: '1.0.0',
    documentation: '/api-docs',
    api: '/api/v1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      admin: '/api/v1/admin',
      classes: '/api/v1/classes'
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

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = app;
