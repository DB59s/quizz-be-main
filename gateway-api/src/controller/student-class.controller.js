const { createServiceCaller } = require('../utils/serviceHelper');
const { CLASS_SERVICE_BASEURL, CLASS_SERVICE_API_TOKEN } = require('../config/env');

// Create a pre-configured caller for Class Service
const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);

/**
 * Student registers for a class
 * POST /api/v1/student-classes
 */
async function registerClass(req, res) {
  try {
    const { class_id } = req.body;

    // Validate input
    if (!class_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'class_id is required'
      });
    }

    // Get student_id from token (set by verifyToken middleware)
    const student_id = req.user?.student_id;

    if (!student_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can register for classes'
      });
    }

    // Prepare request body for class service
    const registrationData = {
      student_id,
      class_id
    };

    console.log(`[Gateway] Student ${student_id} registering for class: ${class_id}`);

    // Call class service to register
    try {
      const response = await callClassService('POST', '/student-classes', registrationData);
      
      console.log(`[Gateway] Registration submitted successfully for student: ${student_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to register for class:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Registration failed',
          message: serviceError.message || 'Failed to register for class. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in registerClass:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all classes a student has registered for
 * GET /api/v1/student-classes/student?status={status}
 */
async function getStudentClasses(req, res) {
  try {
    const { status } = req.query;

    // Get student_id from token (set by verifyToken middleware)
    const student_id = req.user?.student_id;

    if (!student_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can view their classes'
      });
    }

    console.log(`[Gateway] Getting classes for student: ${student_id}`);

    // Build query string
    const queryString = status !== undefined ? `?status=${status}` : '';

    // Call class service to get student's classes
    try {
      const response = await callClassService('GET', `/student-classes/${student_id}${queryString}`);
      
      console.log(`[Gateway] Student classes retrieved successfully for student: ${student_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get student classes:`, serviceError.message);
      
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
    console.error('[Gateway] Unexpected error in getStudentClasses:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Student cancels registration (only if pending)
 * DELETE /api/v1/student-classes/:registration_id
 */
async function cancelRegistration(req, res) {
  try {
    const { _id } = req.params;

    // Validate id
    if (!_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Registration ID is required'
      });
    }

    // Get student_id from token (set by verifyToken midd eware)
    const student_id = req.user?.student_id;

    if (!student_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can cancel registrations'
      });
    }

    // Prepare request body for class service
    const cancelData = {
      student_id
    };

    console.log(`[Gateway] Student ${student_id} cancelling registration: ${_id}`);

    // Call class service to cancel registration
    try {
      const response = await callClassService('DELETE', `/student-classes/${_id}`, cancelData);
      
      console.log(`[Gateway] Registration cancelled successfully: ${_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to cancel registration:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Cancellation failed',
          message: serviceError.message || 'Failed to cancel registration. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in cancelRegistration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Teacher approves student registration
 * PATCH /api/v1/student-classes/:_id/approve
 */
async function approveStudent(req, res) {
  try {
    const { _id } = req.params;

    // Validate id
    if (!_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Registration ID is required'
      });
    }

    // Get teacher_id from token (set by verifyToken middeware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can approve students'
      });
    }

    // Prepare request body for class service
    const approveData = { 
      teacher_id
    };

    console.log(`[Gateway] Teacher ${teacher_id} approving student registration: ${_id}`);

    // Call class service to approve student
    try {
      const response = await callClassService('PATCH', `/student-classes/${_id}/approve`, approveData);
      
      console.log(`[Gateway] Student approved successfully: ${_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to approve student:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Approval failed',
          message: serviceError.message || 'Failed to approve student. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in approveStudent:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Teacher rejects student registration
 * PATCH /api/v1/student-classes/:_id/reject
 */
async function rejectStudent(req, res) {
  try {
    const { _id } = req.params;

    // Validate id
    if (!_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Registration ID is required'
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can reject students'
      });
    }

    // Prepare request body for class service
    const rejectData = {
      teacher_id
    };

    console.log(`[Gateway] Teacher ${teacher_id} rejecting student registration: ${_id}`);

    // Call class service to reject student
    try {
      const response = await callClassService('PATCH', `/student-classes/${_id}/reject`, rejectData);
      
      console.log(`[Gateway] Student rejected successfully: ${_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to reject student:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Rejection failed',
          message: serviceError.message || 'Failed to reject student. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in rejectStudent:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Teacher removes student from class
 * DELETE /api/v1/student-classes/:_id/remove
 */
async function removeStudent(req, res) {
  try {
    const { _id } = req.params;

    // Validate id
    if (!_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Registration ID is required'
      });
    }

    // Get teacher_id from token (set by verifyToken middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can remove students'
      });
    }

    // Prepare request body for class service
    const removeData = {
      teacher_id
    };

    console.log(`[Gateway] Teacher ${teacher_id} removing student from class: ${_id}`);

    // Call class service to remove student
    try {
      const response = await callClassService('DELETE', `/student-classes/${_id}/remove`, removeData);
      
      console.log(`[Gateway] Student removed successfully: ${_id}`);
      
      // Return the response from class service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to remove student:`, serviceError.message);
      
      // Return error from class service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Removal failed',
          message: serviceError.message || 'Failed to remove student. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in removeStudent:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  registerClass,
  getStudentClasses,
  cancelRegistration,
  approveStudent,
  rejectStudent,
  removeStudent,
  callClassService
};
