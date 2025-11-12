const { verifyAccessToken } = require('../utils/jwt');

/**
 * JWT Authentication Middleware
 * Validates JWT token from gateway and extracts user info
 */
const jwtMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        data: null
      });
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format. Use Bearer <token>',
        data: null
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = verifyAccessToken(token);
    
    // Attach user info to request
    req.user = decoded; // { account_id, role, user_id }

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token',
      data: null
    });
  }
};

module.exports = jwtMiddleware;

