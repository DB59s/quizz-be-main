// Export all middlewares
const authMiddleware = require('./auth.middleware');

module.exports = {
  authMiddleware,
  // Aliases for convenience
  verifyToken: authMiddleware.verifyToken,
  requireRole: authMiddleware.requireRole
}; 