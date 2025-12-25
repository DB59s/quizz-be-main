// Export all middlewares
const authMiddleware = require('./auth.middleware');
const gatewayMiddleware = require('./gateway.middleware');
const validationMiddleware = require('./validation.middleware');
const rateLimiterMiddleware = require('./rateLimiter.middleware');

module.exports = {
  authMiddleware,
  gatewayMiddleware,
  validationMiddleware,
  rateLimiterMiddleware,
  // Aliases for convenience
  verifyToken: authMiddleware.verifyToken,
  requireRole: authMiddleware.requireRole,
  // Gateway aliases
  gatewayAuth: gatewayMiddleware.authGatewayMiddleware,
  gatewayRequireRole: gatewayMiddleware.requireRole,
  // Service call utilities
  callUserService: gatewayMiddleware.callUserService,
  // Validation aliases
  validateForgotPasswordRequest: validationMiddleware.validateForgotPasswordRequest,
  validateVerifyOTPRequest: validationMiddleware.validateVerifyOTPRequest,
  validateResetPasswordRequest: validationMiddleware.validateResetPasswordRequest,
  // Rate limiter aliases
  forgotPasswordLimiter: rateLimiterMiddleware.forgotPasswordLimiter,
  verifyOTPLimiter: rateLimiterMiddleware.verifyOTPLimiter,
  resetPasswordLimiter: rateLimiterMiddleware.resetPasswordLimiter,
  authLimiter: rateLimiterMiddleware.authLimiter
}; 