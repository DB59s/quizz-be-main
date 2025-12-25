const express = require('express');
const classRouter = require('./classRouter');
const studentClassRouter = require('./studentClassRouter');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Mount all routers with middleware
router.use('/classes', authMiddleware, classRouter);
router.use('/student-classes', authMiddleware, studentClassRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


module.exports = router;
