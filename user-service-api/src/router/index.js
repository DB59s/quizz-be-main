const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const userRouter = require('./userRouter');
const studentRouter = require('./studentRouter');
const teacherRouter = require('./teacherRouter');
const adminRouter = require('./adminRouter');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount all routes with authentication middleware
router.use('/users', authMiddleware, userRouter);
router.use('/student', authMiddleware, studentRouter);
router.use('/teacher', authMiddleware, teacherRouter);
router.use('/admin', authMiddleware, adminRouter);

module.exports = router;
