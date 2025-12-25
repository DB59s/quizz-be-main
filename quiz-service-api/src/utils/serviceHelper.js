const axios = require('axios');

/**
 * Generic helper to call external microservices
 * @param {Object} config - Service configuration
 * @param {string} config.serviceName - Name of the service (for logging)
 * @param {string} config.baseUrl - Base URL of the service
 * @param {string} config.apiToken - API token for authentication
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} path - Service endpoint path (e.g., '/classes')
 * @param {Object} data - Request data (for POST, PUT, PATCH, DELETE requests)
 * @param {Object} options - Additional axios options
 * @returns {Promise} - Axios response
 */
async function callService({serviceName, baseUrl, apiToken} , method, path, data = null , options = {}) {
    if(!baseUrl) {
        throw new Error('Base URL is required');
    }
    if(!apiToken) {
        throw new Error('API token is required');
    }
    const url = `${baseUrl}${path}`;
    
    // Separate headers from other options to prevent overwriting
  const { headers: optionHeaders, ...otherOptions } = options;
  
  const config = {
    method: method.toLowerCase(),
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
      ...optionHeaders
    },
    timeout: otherOptions.timeout || 30000,
    ...otherOptions
  };

    // Add data for POST, PUT, PATCH, DELETE requests
  if (['post', 'put', 'patch', 'delete'].includes(method.toLowerCase()) && data) {
    config.data = data;
  }

   // Add query params if provided
   if (options.params) {
    config.params = options.params;
  }

  console.log(`[Gateway] Calling ${serviceName}: ${method.toUpperCase()} ${url}`);
  
  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    console.error(`[Gateway] ${serviceName} call failed:`, error.message);
    
    if (error.response) {
      // Re-throw with response data for proper error handling
      const serviceError = new Error(error.response.data?.message || `${serviceName} error`);
      serviceError.statusCode = error.response.status;
      serviceError.response = error.response.data;
      throw serviceError;
    }
    
    throw error;
  }
};

/**
 * Create a service caller with pre-configured settings
 * @param {string} serviceName - Name of the service
 * @param {string} baseUrl - Base URL of the service
 * @param {string} apiToken - API token for authentication
 * @returns {Function} - Service caller function
 */
function createServiceCaller(serviceName, baseUrl, apiToken) {
    return (method, path, data = null, options = {}) => {
      return callService({ serviceName, baseUrl, apiToken }, method, path, data, options);
    };
  }

module.exports = {
    callService,
    createServiceCaller
};