const express = require('express');
const subjectRouter = require('./subjectRouter');
const questionRouter = require('./questionRouter');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Mount routers with middleware
router.use('/subjects', authMiddleware, subjectRouter);
router.use('/questions', authMiddleware, questionRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Question Service is running',
    timestamp: new Date().toISOString()
  });
});

// Default API route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Question Service API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      subjects: '/api/subjects',
      questions: '/api/questions'
    }
  });
});

module.exports = router;
