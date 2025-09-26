// Export all middlewares
const authMiddleware = require('./auth.middleware');
const gatewayMiddleware = require('./gateway.middleware');

module.exports = {
  authMiddleware,
  gatewayMiddleware,
  // Aliases for convenience
  verifyToken: authMiddleware.verifyToken,
  requireRole: authMiddleware.requireRole,
  // Gateway aliases
  gatewayAuth: gatewayMiddleware.authGatewayMiddleware,
  gatewayRequireRole: gatewayMiddleware.requireRole
}; 