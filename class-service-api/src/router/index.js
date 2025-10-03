const express = require('express');
const userRouter = require('./userRouter');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Mount all routers with middleware
router.use('/users', authMiddleware, userRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Default API route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Base Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users'
    }
  });
});

module.exports = router;
