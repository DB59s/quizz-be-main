const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifyToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user info to request
    req.user = {
      account_id: decoded?.account_id,
      role: decoded?.role
    };

    // Map user_id to specific role-based ID
    if (decoded?.user_id) {
      if (decoded.role === 'admin') {
        req.user.admin_id = decoded.user_id;
      } else if (decoded.role === 'student') {
        req.user.student_id = decoded.user_id;
      } else if (decoded.role === 'teacher') {
        req.user.teacher_id = decoded.user_id;
      }
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: error.message === 'Token expired' ? 'Token expired' : 'Invalid token'
    });
  }
}

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No user information found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
}; 