const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for forgot password endpoint
 * Limit: 5 requests per hour per IP
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many forgot password attempts. Please try again later.',
    retryAfter: 'Requests are limited to 5 per hour'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many forgot password attempts. Please try again later.',
      retryAfter: 'Requests are limited to 5 per hour'
    });
  }
});

/**
 * Rate limiter for verify OTP endpoint
 * Limit: 10 requests per 15 minutes per IP
 */
const verifyOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many OTP verification attempts. Please try again later.',
    retryAfter: 'Requests are limited to 10 per 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many OTP verification attempts. Please try again later.',
      retryAfter: 'Requests are limited to 10 per 15 minutes'
    });
  }
});

/**
 * Rate limiter for reset password endpoint
 * Limit: 3 requests per hour per IP
 */
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many password reset attempts. Please try again later.',
    retryAfter: 'Requests are limited to 3 per hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: 'Requests are limited to 3 per hour'
    });
  }
});

/**
 * General rate limiter for auth endpoints
 * Limit: 20 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: 'Requests are limited to 20 per 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 'Requests are limited to 20 per 15 minutes'
    });
  }
});

module.exports = {
  forgotPasswordLimiter,
  verifyOTPLimiter,
  resetPasswordLimiter,
  authLimiter,
};
