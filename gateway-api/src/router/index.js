const express = require('express');
const authRouter = require('./auth.router');
const userRouter = require('./user.router');
const adminRouter = require('./admin.router');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: General
 *   description: General API endpoints
 */

// Mount all routers
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [General]
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
 *                   example: "Server is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:30:00.000Z"
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
 * /api/v1:
 *   get:
 *     summary: API welcome endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Welcome message with available endpoints
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
 *                   example: "Welcome to Gateway API v1"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/api/v1/health"
 *                     auth:
 *                       type: string
 *                       example: "/api/v1/auth"
 *                     users:
 *                       type: string
 *                       example: "/api/v1/users"
 *                     admin:
 *                       type: string
 *                       example: "/api/v1/admin"
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Gateway API v1',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      admin: '/api/v1/admin',
      docs: '/api-docs'
    }
  });
});

module.exports = router;
