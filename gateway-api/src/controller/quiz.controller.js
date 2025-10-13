const { createServiceCaller } = require('../utils/serviceHelper');
const { QUIZ_SERVICE_BASEURL, QUIZ_SERVICE_API_TOKEN } = require('../config/env');

console.log('[Gateway] QUIZ_SERVICE_BASEURL:', QUIZ_SERVICE_BASEURL);
console.log('[Gateway] QUIZ_SERVICE_API_TOKEN:', QUIZ_SERVICE_API_TOKEN);

// Create a pre-configured caller for Quiz Service
const callQuizService = createServiceCaller(
  'Quiz Service',
  QUIZ_SERVICE_BASEURL,
  QUIZ_SERVICE_API_TOKEN
);

/**
 * Create a new quiz (Teacher only)
 * POST /api/v1/quizzes
 */
async function createQuiz(req, res) {
  try {
    const { name, description, question_ids } = req.body;

    // Get teacher_id from token (set by requireRoleOnly middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can create quizzes'
      });
    }

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Quiz name is required'
      });
    }

    if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least one question ID is required'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} creating quiz`);

    // Prepare request data
    const quizData = {
      name: name.trim(),
      description: description ? description.trim() : undefined,
      question_ids
    };

    // Call quiz service with X-Teacher-ID header
    try {
      const response = await callQuizService(
        'POST', 
        '/quizzes', 
        quizData,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Quiz created successfully by teacher: ${teacher_id}`);
      
      // Return the response from quiz service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to create quiz:`, serviceError.message);
      
      // Return error from quiz service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Quiz creation failed',
          message: serviceError.message || 'Failed to create quiz. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in createQuiz:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all quizzes for teacher with pagination
 * GET /api/v1/quizzes?page=1&limit=10
 */
async function getQuizzes(req, res) {
  try {
    const { page, limit } = req.query;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view quizzes'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} getting quizzes`);

    // Build query string
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Call quiz service with x-teacher-id header
    try {
      const response = await callQuizService(
        'GET', 
        `/quizzes${queryString}`,
        null,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Quizzes retrieved successfully for teacher: ${teacher_id}`);
      
      // Return the response from quiz service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get quizzes:`, serviceError.message);
      
      // Return error from quiz service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve quizzes',
          message: serviceError.message || 'Failed to retrieve quizzes. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getQuizzes:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get quiz by ID (Teacher only)
 * GET /api/v1/quizzes/:id
 */
async function getQuizById(req, res) {
  try {
    const { id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view quizzes'
      });
    }

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Quiz ID is required'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} getting quiz: ${id}`);

    // Call quiz service with x-teacher-id header
    try {
      const response = await callQuizService(
        'GET', 
        `/quizzes/${id}`,
        null,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Quiz retrieved successfully: ${id}`);
      
      // Return the response from quiz service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get quiz:`, serviceError.message);
      
      // Return error from quiz service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve quiz',
          message: serviceError.message || 'Failed to retrieve quiz. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getQuizById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Update quiz (Teacher only)
 * PUT /api/v1/quizzes/:id
 */
async function updateQuiz(req, res) {
  try {
    const { id } = req.params;
    const { name, description, question_ids } = req.body;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can update quizzes'
      });
    }

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Quiz ID is required'
      });
    }

    // At least one field should be provided for update
    if (!name && !description && !question_ids) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least one field must be provided for update'
      });
    }

    // Validate question_ids if provided
    if (question_ids && (!Array.isArray(question_ids) || question_ids.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'question_ids must be a non-empty array'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} updating quiz: ${id}`);

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (question_ids) updateData.question_ids = question_ids;

    // Call quiz service with x-teacher-id header
    try {
      const response = await callQuizService(
        'PUT', 
        `/quizzes/${id}`,
        updateData,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Quiz updated successfully: ${id}`);
      
      // Return the response from quiz service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to update quiz:`, serviceError.message);
      
      // Return error from quiz service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Quiz update failed',
          message: serviceError.message || 'Failed to update quiz. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in updateQuiz:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Delete quiz (Teacher only)
 * DELETE /api/v1/quizzes/:id
 */
async function deleteQuiz(req, res) {
  try {
    const { id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can delete quizzes'
      });
    }

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Quiz ID is required'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} deleting quiz: ${id}`);

    // Call quiz service with x-teacher-id header
    try {
      const response = await callQuizService(
        'DELETE', 
        `/quizzes/${id}`,
        null,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Quiz deleted successfully: ${id}`);
      
      // Return the response from quiz service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to delete quiz:`, serviceError.message);
      
      // Return error from quiz service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Quiz deletion failed',
          message: serviceError.message || 'Failed to delete quiz. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in deleteQuiz:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  callQuizService
};
