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

/**
 * Update class information (Teacher only)
 * PATCH /api/v1/classes/:class_id
 */
async function updateClass(req, res) {
  try {
    const { class_id } = req.params;
    const { name, description, status } = req.body;

    // Validate class_id
    if (!class_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'class_id is required'
      });
    }

    // Validate at least one field to update
    if (!name && !description && !status) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least one field (name, description, or status) must be provided'
      });
    }

    // Validate name length if provided
    if (name && (name.length < 3 || name.length > 100)) {
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

    // Validate status if provided
    if (status && !['active', 'inactive', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: "Status must be one of: 'active', 'inactive', 'closed'"
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can update classes'
      });
    }

    // Prepare request body for class service
    const updateData = {
      teacher_id
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    console.log(`[Gateway] Updating class ${class_id} for teacher: ${teacher_id}`);

    // Call class service to update class
    try {
      const response = await callClassService('PATCH', `/classes/${class_id}`, updateData);
      
      console.log(`[Gateway] Class updated successfully: ${class_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to update class:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Class update failed',
          message: serviceError.message || 'Failed to update class. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in updateClass:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Delete class (Teacher only)
 * DELETE /api/v1/classes/:class_id
 */
async function deleteClass(req, res) {
  try {
    const { class_id } = req.params;

    // Validate class_id
    if (!class_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'class_id is required'
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can delete classes'
      });
    }

    // Prepare request body for class service
    const deleteData = {
      teacher_id
    };

    console.log(`[Gateway] Deleting class ${class_id} for teacher: ${teacher_id}`);

    // Call class service to delete class
    try {
      const response = await callClassService('DELETE', `/classes/${class_id}`, deleteData);
      
      console.log(`[Gateway] Class deleted successfully: ${class_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to delete class:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Class deletion failed',
          message: serviceError.message || 'Failed to delete class. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in deleteClass:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all classes for logged-in teacher
 * GET /api/v1/classes/teachers
 */
async function getTeacherClasses(req, res) {
  try {
    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view classes'
      });
    }

    console.log(`[Gateway] Getting classes for teacher: ${teacher_id}`);

    // Call class service to get teacher's classes
    try {
      const response = await callClassService('GET', `/classes/${teacher_id}`);
      
      console.log(`[Gateway] Classes retrieved successfully for teacher: ${teacher_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get teacher classes:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve classes',
          message: serviceError.message || 'Failed to retrieve classes. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getTeacherClasses:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get class details (Teacher only)
 * GET /api/v1/classes/:class_id
 */
async function getClassDetails(req, res) {
  try {
    const { class_id } = req.params;

    // Validate class_id
    if (!class_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'class_id is required'
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view class details'
      });
    }

    console.log(`[Gateway] Getting class details ${class_id} for teacher: ${teacher_id}`);

    // Call class service to get class details
    try {
      const response = await callClassService('GET', `/classes/${class_id}?teacher_id=${teacher_id}`);
      
      console.log(`[Gateway] Class details retrieved successfully: ${class_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get class details:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve class details',
          message: serviceError.message || 'Failed to retrieve class details. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getClassDetails:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get class info by class code (for students to view before joining)
 * GET /api/v1/classes/join/:class_code
 */
async function getClassByCode(req, res) {
  try {
    const { class_code } = req.params;

    // Validate class_code
    if (!class_code) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'class_code is required'
      });
    }

    console.log(`[Gateway] Getting class info by code: ${class_code}`);

    // Call class service to get class by code
    try {
      const response = await callClassService('GET', `/classes/join/${class_code}`);
      
      console.log(`[Gateway] Class info retrieved successfully for code: ${class_code}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get class by code:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve class information',
          message: serviceError.message || 'Failed to retrieve class information. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getClassByCode:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get students in a class (Teacher only)
 * GET /api/v1/classes/teacher/:class_id/students?status={status}
 */
async function getClassStudents(req, res) {
  try {
    const { class_id } = req.params;
    const { status } = req.query;

    // Validate class_id
    if (!class_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'class_id is required'
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view class students'
      });
    }

    console.log(`[Gateway] Getting students for class ${class_id}, teacher: ${teacher_id}`);

    // Build query string
    const queryString = status ? `?status=${status}` : '';

    // Call class service to get class students
    try {
      const response = await callClassService('GET', `/classes/${teacher_id}/${class_id}/students${queryString}`);
      
      console.log(`[Gateway] Class students retrieved successfully for class: ${class_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get class students:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve class students',
          message: serviceError.message || 'Failed to retrieve class students. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getClassStudents:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  createClass,
  updateClass,
  deleteClass,
  getTeacherClasses,
  getClassDetails,
  getClassByCode,
  getClassStudents,
  callClassService
};
