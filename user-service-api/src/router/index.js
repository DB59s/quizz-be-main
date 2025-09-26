const express = require('express');
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

// Mount all routes
router.use('/users', userRouter);
router.use('/students', studentRouter);
router.use('/teachers', teacherRouter);
router.use('/admins', adminRouter);

module.exports = router;
