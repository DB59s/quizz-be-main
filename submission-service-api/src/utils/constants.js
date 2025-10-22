/**
 * Application Constants and Enums
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Response Messages
const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request data',
  UNAUTHORIZED: 'Access denied. Authentication required.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error'
};

// User Status Enum
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

// User Roles Enum
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  GUEST: 'guest'
};

// Database Operations
const DB_OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Date Formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'DD/MM/YYYY HH:mm:ss'
};

// API Response Format
const API_RESPONSE = {
  SUCCESS: (data = null, message = RESPONSE_MESSAGES.SUCCESS) => ({
    success: true,
    message,
    data
  }),
  ERROR: (message = RESPONSE_MESSAGES.INTERNAL_ERROR, data = null) => ({
    success: false,
    message,
    data
  })
};

// Environment Types
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
};

// Token Types
const TOKEN_TYPES = {
  BEARER: 'Bearer',
  API_KEY: 'ApiKey',
  BASIC: 'Basic'
};

module.exports = {
  HTTP_STATUS,
  RESPONSE_MESSAGES,
  USER_STATUS,
  USER_ROLES,
  DB_OPERATIONS,
  PAGINATION,
  DATE_FORMATS,
  API_RESPONSE,
  ENVIRONMENTS,
  TOKEN_TYPES
};
