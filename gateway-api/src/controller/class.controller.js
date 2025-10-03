const { createServiceCaller } = require('../utils/serviceHelper');
const { CLASS_SERVICE_BASEURL, CLASS_SERVICE_API_TOKEN } = require('../config/env');

// Create a pre-configured caller for Class Service
const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);

/**
 * Create new class (Teacher only)
 * POST /api/v1/classes
 */
async function createClass(req, res) {
  try {
    const { name, description, max_students } = req.body;

    // Validate input
    if (!name || !max_students) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Name and max_students are required'
      });
    }

    // Validate name length
    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Name must be between 3 and 100 characters'
      });
    }

    // Validate description length if provided
    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Description must not exceed 500 characters'
      });
    }

    // Validate max_students
    if (!Number.isInteger(max_students) || max_students < 1) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'max_students must be a positive integer'
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can create classes'
      });
    }

    // Prepare request body for class service
    const classData = {
      teacher_id,
      name,
      description: description || '',
      max_students
    };

    console.log(`[Gateway] Creating class for teacher: ${teacher_id}`);

    // Call class service to create class
    try {
      const response = await callClassService('POST', '/classes', classData);
      
      console.log(`[Gateway] Class created successfully: ${response.data.data?._id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to create class:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Class creation failed',
          message: serviceError.message || 'Failed to create class. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in createClass:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  createClass,
  callClassService
};
