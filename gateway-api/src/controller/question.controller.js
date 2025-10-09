const { createServiceCaller } = require('../utils/serviceHelper');
const { QUESTION_SERVICE_BASEURL, QUESTION_SERVICE_API_TOKEN } = require('../config/env');

// Create a pre-configured caller for Question Service
const callQuestionService = createServiceCaller(
  'Question Service',
  QUESTION_SERVICE_BASEURL,
  QUESTION_SERVICE_API_TOKEN
);

/**
 * Create a new question (Teacher only)
 * POST /api/v1/questions
 */
async function createQuestion(req, res) {
  try {
    const { content, level, type, subject_ids, answers } = req.body;

    // Get teacher_id from token (set by requireRoleOnly middleware)
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can create questions'
      });
    }

    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Question content is required'
      });
    }

    if (!level) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Question level is required (1-4)'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Question type is required (1=Single choice, 2=Multi choice)'
      });
    }

    if (!subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least one subject ID is required'
      });
    }

    if (!answers || !Array.isArray(answers) || answers.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least 2 answers are required'
      });
    }

    // Validate each answer
    for (const answer of answers) {
      if (!answer.content || answer.content.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'All answers must have content'
        });
      }
      if (typeof answer.is_true !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'All answers must have is_true field (boolean)'
        });
      }
    }

    console.log(`[Gateway] Teacher ${teacher_id} creating question`);

    // Prepare request data
    const questionData = {
      content: content.trim(),
      level: parseInt(level),
      type: parseInt(type),
      subject_ids,
      answers
    };

    // Call question service with X-Teacher-ID header
    try {
      const response = await callQuestionService(
        'POST', 
        '/questions', 
        questionData,
        {
          headers: {
            'X-Teacher-ID': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Question created successfully by teacher: ${teacher_id}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to create question:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Question creation failed',
          message: serviceError.message || 'Failed to create question. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in createQuestion:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all questions for teacher with filters
 * GET /api/v1/questions?search=&subject_id=&level=&page=1&limit=10
 */
async function getQuestions(req, res) {
  try {
    const { search, subject_id, level, page, limit } = req.query;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view questions'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} getting questions`);

    // Build query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (subject_id) queryParams.append('subject_id', subject_id);
    if (level) queryParams.append('level', level);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Call question service with X-Teacher-ID header
    try {
      const response = await callQuestionService(
        'GET', 
        `/questions${queryString}`,
        null,
        {
          headers: {
            'X-Teacher-ID': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Questions retrieved successfully for teacher: ${teacher_id}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get questions:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve questions',
          message: serviceError.message || 'Failed to retrieve questions. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getQuestions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get question by ID (Teacher only)
 * GET /api/v1/questions/:id
 */
async function getQuestionById(req, res) {
  try {
    const { id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view questions'
      });
    }

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Question ID is required'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} getting question: ${id}`);

    // Call question service with X-Teacher-ID header
    try {
      const response = await callQuestionService(
        'GET', 
        `/questions/${id}`,
        null,
        {
          headers: {
            'X-Teacher-ID': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Question retrieved successfully: ${id}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to get question:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to retrieve question',
          message: serviceError.message || 'Failed to retrieve question. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getQuestionById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Update question (Teacher only)
 * PATCH /api/v1/questions/:id
 */
async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const { content, level, type, subject_ids, answers } = req.body;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can update questions'
      });
    }

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Question ID is required'
      });
    }

    // At least one field should be provided for update
    if (!content && !level && !type && !subject_ids && !answers) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least one field must be provided for update'
      });
    }

    // Validate answers if provided
    if (answers) {
      if (!Array.isArray(answers) || answers.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'At least 2 answers are required'
        });
      }

      for (const answer of answers) {
        if (!answer.content || answer.content.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'All answers must have content'
          });
        }
        if (typeof answer.is_true !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'All answers must have is_true field (boolean)'
          });
        }
      }
    }

    console.log(`[Gateway] Teacher ${teacher_id} updating question: ${id}`);

    // Prepare update data
    const updateData = {};
    if (content) updateData.content = content.trim();
    if (level) updateData.level = parseInt(level);
    if (type) updateData.type = parseInt(type);
    if (subject_ids) updateData.subject_ids = subject_ids;
    if (answers) updateData.answers = answers;

    // Call question service with X-Teacher-ID header
    try {
      const response = await callQuestionService(
        'PATCH', 
        `/questions/${id}`,
        updateData,
        {
          headers: {
            'X-Teacher-ID': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Question updated successfully: ${id}`);
      
      // Return the response from question service
      return res.status(response.status).json(response.data);
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to update question:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Question update failed',
          message: serviceError.message || 'Failed to update question. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in updateQuestion:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Delete question (Teacher only)
 * DELETE /api/v1/questions/:id
 */
async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can delete questions'
      });
    }

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Question ID is required'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} deleting question: ${id}`);

    // Call question service with X-Teacher-ID header
    try {
      const response = await callQuestionService(
        'DELETE', 
        `/questions/${id}`,
        null,
        {
          headers: {
            'X-Teacher-ID': teacher_id
          }
        }
      );
      
      console.log(`[Gateway] Question deleted successfully: ${id}`);
      
      // Return the response from question service (204 No Content)
      return res.status(response.status).send();
      
    } catch (serviceError) {
      console.error(`[Gateway] Failed to delete question:`, serviceError.message);
      
      // Return error from question service
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Question deletion failed',
          message: serviceError.message || 'Failed to delete question. Please try again.'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in deleteQuestion:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  callQuestionService
};
