const axios = require('axios');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * API Gateway middleware that handles authentication, authorization and request forwarding
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @param {string} serviceBaseUrlEnv - Environment variable name for service base URL
 * @returns {Function} - Express middleware function
 */
function gatewayMiddleware(allowedRoles, serviceBaseUrlEnv) {
  return async (req, res, next) => {
    try {
      // Step 1: Extract and verify JWT token
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'No token provided'
        });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token format'
        });
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'No token provided'
        });
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: error.message === 'Token expired' ? 'Token expired' : 'Invalid token'
        });
      }

      // Step 2: Check role authorization
      const userRole = decoded.role;
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Skip role check if allowedRoles is empty (for authGatewayMiddleware)
      if (rolesArray.length > 0 && !rolesArray.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      // Step 3: Get service base URL from environment
      const serviceBaseUrl = process.env[serviceBaseUrlEnv];
      
      if (!serviceBaseUrl) {
        console.error(`Service base URL not configured: ${serviceBaseUrlEnv}`);
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Service configuration error'
        });
      }

      // Step 4: Prepare request to forward
      const targetUrl = `${serviceBaseUrl}${req.path}`;
      
      // Prepare headers for forwarding
      const forwardHeaders = {
        ...req.headers,
        'x-account-id': decoded.accountId.toString(),
        'x-user-id': decoded.accountId.toString(),
        'x-user-role': userRole,
        // Remove the original authorization header if you don't want to forward it
        // 'authorization': undefined
      };

      // Remove host header to avoid conflicts
      delete forwardHeaders.host;

      // Step 5: Forward request to target service
      try {
        const axiosConfig = {
          method: req.method.toLowerCase(),
          url: targetUrl,
          headers: forwardHeaders,
          params: req.query,
          timeout: 30000, // 30 seconds timeout
        };

        // Add body for POST, PUT, PATCH requests
        if (['post', 'put', 'patch'].includes(req.method.toLowerCase())) {
          axiosConfig.data = req.body;
        }

        console.log(`[Gateway] Forwarding ${req.method} ${req.path} to ${targetUrl}`);
        
        const response = await axios(axiosConfig);
        
        // Forward response status and data
        res.status(response.status).json(response.data);
        
      } catch (error) {
        console.error(`[Gateway] Error forwarding request:`, error.message);
        
        if (error.response) {
          // Service responded with error status
          res.status(error.response.status).json(error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
          // Service is not available
          res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: 'Target service is not available'
          });
        } else if (error.code === 'ENOTFOUND') {
          // DNS resolution failed
          res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: 'Target service host not found'
          });
        } else if (error.code === 'ETIMEDOUT') {
          // Request timeout
          res.status(504).json({
            success: false,
            error: 'Gateway Timeout',
            message: 'Request to target service timed out'
          });
        } else {
          // Other errors
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to process request'
          });
        }
      }
      
    } catch (error) {
      console.error('[Gateway] Unexpected error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  };
}

/**
 * Simple authentication middleware that only verifies token without role checking
 * Useful for routes that need authentication but no specific role
 * @param {string} serviceBaseUrlEnv - Environment variable name for service base URL
 * @returns {Function} - Express middleware function
 */
function authGatewayMiddleware(serviceBaseUrlEnv) {
  return gatewayMiddleware([], serviceBaseUrlEnv);
}

/**
 * Middleware factory for requiring specific roles
 * @param {string|string[]} roles - Single role or array of allowed roles
 * @returns {Function} - Function that creates gateway middleware
 */
function requireRole(roles) {
  return function(serviceBaseUrlEnv) {
    return gatewayMiddleware(roles, serviceBaseUrlEnv);
  };
}

module.exports = {
  gatewayMiddleware,
  authGatewayMiddleware,
  requireRole,
}; 