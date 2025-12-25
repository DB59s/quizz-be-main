const { env } = require('../config');

/**
 * Middleware to verify API token
 * Token should be sent in Authorization header as: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    console.log('[Question Service] Received headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Question Service] Expected API_TOKEN:', env.API_TOKEN);
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
        data: null
      });
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>',
        data: null
      });
    }

    const token = parts[1];

    // Verify token
    if (token !== env.API_TOKEN) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        data: null
      });
    }

    // Token is valid, proceed to next middleware
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed',
      data: null
    });
  }
};

module.exports = authMiddleware;
