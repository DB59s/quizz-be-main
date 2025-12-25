const express = require('express');
const conversationRouter = require('./conversation.router');
const geminiRouter = require('./gemini.router');

const router = express.Router();

// Mount v1 API routes
router.use('/v1/conversations', conversationRouter);
router.use('/v1/gemini', geminiRouter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Welcome to Base Backend API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Chatbot Service API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      conversations: '/api/v1/conversations',
      gemini: '/api/v1/gemini',
      socket: 'ws://localhost:9012 (Socket.IO)'
    }
  });
});

module.exports = router;
