const { createServiceCaller } = require('../utils/serviceHelper');
const { QUESTION_SERVICE_BASEURL, QUESTION_SERVICE_API_TOKEN } = require('../config/env');

// Create a pre-configured caller for Question Service
const callQuestionService = createServiceCaller(
  'Question Service',
  QUESTION_SERVICE_BASEURL,
  QUESTION_SERVICE_API_TOKEN
);

/**
 * Create a new subject (Admin only)
 * POST /api/v1/subjects
 */
async function createSubject(req, res) {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject name is required'
      });
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject name must be between 2 and 255 characters'
      });
    }

    console.log(`[Gateway] Admin creating subject: ${name}`);

    // Call question service to create subject
    try {
      const response = await callQuestionService('POST', '/subjects', { name: name.trim() });
      
      console.log(`[Gateway] Subject created successfully: ${name}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to create subject:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Subject creation failed',
          message: serviceError.message || 'Failed to create subject. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in createSubject:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all subjects with pagination and search
 * GET /api/v1/subjects?page=1&limit=10&search=Toán
 */
async function getAllSubjects(req, res) {
  try {
    const { page, limit, search } = req.query;

    console.log(`[Gateway] Getting all subjects (page: ${page || 1}, limit: ${limit || 10}, search: ${search || 'none'})`);

    // Build query string
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Call question service to get subjects
    try {
      const response = await callQuestionService('GET', `/subjects${queryString}`);
      
      console.log(`[Gateway] Subjects retrieved successfully`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get subjects:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve subjects',
          message: serviceError.message || 'Failed to retrieve subjects. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getAllSubjects:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get subject by ID
 * GET /api/v1/subjects/:id
 */
async function getSubjectById(req, res) {
  try {
    const { id } = req.params;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject ID is required'
      });
    }

    console.log(`[Gateway] Getting subject by ID: ${id}`);

    // Call question service to get subject
    try {
      const response = await callQuestionService('GET', `/subjects/${id}`);
      
      console.log(`[Gateway] Subject retrieved successfully: ${id}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get subject:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve subject',
          message: serviceError.message || 'Failed to retrieve subject. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getSubjectById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Update subject (Admin only)
 * PATCH /api/v1/subjects/:id
 */
async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject ID is required'
      });
    }

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject name is required'
      });
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject name must be between 2 and 255 characters'
      });
    }

    console.log(`[Gateway] Admin updating subject ${id}: ${name}`);

    // Call question service to update subject
    try {
      const response = await callQuestionService('PATCH', `/subjects/${id}`, { name: name.trim() });
      
      console.log(`[Gateway] Subject updated successfully: ${id}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to update subject:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Subject update failed',
          message: serviceError.message || 'Failed to update subject. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in updateSubject:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Delete subject (Admin only)
 * DELETE /api/v1/subjects/:id
 */
async function deleteSubject(req, res) {
  try {
    const { id } = req.params;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject ID is required'
      });
    }

    console.log(`[Gateway] Admin deleting subject: ${id}`);

    // Call question service to delete subject
    try {
      const response = await callQuestionService('DELETE', `/subjects/${id}`);
      
      console.log(`[Gateway] Subject deleted successfully: ${id}`);
      
      // Return the response from question service (204 No Content)
      return res.status(response.status).send();
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to delete subject:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Subject deletion failed',
          message: serviceError.message || 'Failed to delete subject. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in deleteSubject:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  callQuestionService
};
