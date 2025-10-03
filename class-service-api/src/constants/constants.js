/**
 * Application-wide constants and enums
 */

// Student-Class registration status
const STUDENT_CLASS_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Status code mapping (for query parameters)
const STUDENT_CLASS_STATUS_CODE = {
  0: 'pending',
  1: 'approved',
  2: 'rejected'
};

// Reverse mapping
const STUDENT_CLASS_STATUS_TO_CODE = {
  'pending': 0,
  'approved': 1,
  'rejected': 2
};

// Class status
const CLASS_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CLOSED: 'closed'
};

module.exports = {
  STUDENT_CLASS_STATUS,
  STUDENT_CLASS_STATUS_CODE,
  STUDENT_CLASS_STATUS_TO_CODE,
  CLASS_STATUS
};
