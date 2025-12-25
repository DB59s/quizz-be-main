/**
 * Constants for Gateway API
 * Defines all enum values used across the application
 */

// Account roles
const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// Account status
const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  BANNED: 'banned',
  DELETED: 'deleted'
};

// Authentication providers
const AUTH_PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google'
};

module.exports = {
  ROLES,
  ACCOUNT_STATUS,
  AUTH_PROVIDERS
};
