const { env } = require('../config');

const authMiddleware = (req, res, next) => {
  try {
    // Lấy token từ Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        data: null
      });
    }

    // Kiểm tra format Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format. Use Bearer <token>',
        data: null
      });
    }

    // Lấy token từ header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // So sánh với token cứng trong config
    if (token !== env.API_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
        data: null
      });
    }

    // Token hợp lệ, cho phép tiếp tục
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      data: null
    });
  }
};

module.exports = authMiddleware; 