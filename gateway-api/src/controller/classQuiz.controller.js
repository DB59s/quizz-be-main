const { createServiceCaller } = require('../utils/serviceHelper');
const { QUIZ_SERVICE_BASEURL, QUIZ_SERVICE_API_TOKEN } = require('../config/env');
const NodeCache = require('node-cache');

console.log('[Gateway] QUIZ_SERVICE_BASEURL:', QUIZ_SERVICE_BASEURL);
console.log('[Gateway] QUIZ_SERVICE_API_TOKEN:', QUIZ_SERVICE_API_TOKEN);

// Create a pre-configured caller for Quiz Service
const callQuizService = createServiceCaller(
  'Quiz Service',
  QUIZ_SERVICE_BASEURL,
  QUIZ_SERVICE_API_TOKEN
);

// Create cache with 60 seconds TTL (1 minute)
const quizListCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Assign quiz to a class (Teacher only)
 * POST /api/v1/class-quizzes
 */
async function assignQuizToClass(req, res) {
  try {
    const { quiz_id, class_id, start_time, end_time } = req.body;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can assign quizzes to classes'
      });
    }

    // Validate required fields
    if (!quiz_id || !class_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Missing required fields: quiz_id, class_id, start_time, end_time'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} assigning quiz ${quiz_id} to class ${class_id}`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'POST',
        '/class-quizzes',
        { quiz_id, class_id, start_time, end_time },
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );

      console.log(`[Gateway] Quiz assigned to class successfully`);
      return res.status(response.status).json(response.data);

    } catch (serviceError) {
      console.error(`[Gateway] Failed to assign quiz to class:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to assign quiz',
          message: serviceError.message || 'Failed to assign quiz to class'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in assignQuizToClass:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Update class quiz time (Teacher only)
 * PUT /api/v1/class-quizzes/:id
 */
async function updateClassQuiz(req, res) {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can update class quizzes'
      });
    }

    if (!start_time && !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'At least one field (start_time or end_time) is required'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} updating class quiz ${id}`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'PUT',
        `/class-quizzes/${id}`,
        { start_time, end_time },
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );

      console.log(`[Gateway] Class quiz updated successfully`);
      return res.status(response.status).json(response.data);

    } catch (serviceError) {
      console.error(`[Gateway] Failed to update class quiz:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to update class quiz',
          message: serviceError.message || 'Failed to update class quiz'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in updateClassQuiz:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Remove quiz from class (Teacher only)
 * DELETE /api/v1/class-quizzes/:id
 */
async function removeQuizFromClass(req, res) {
  try {
    const { id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can remove quizzes from classes'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} removing class quiz ${id}`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'DELETE',
        `/class-quizzes/${id}`,
        null,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );

      console.log(`[Gateway] Quiz removed from class successfully`);
      return res.status(response.status).json(response.data);

    } catch (serviceError) {
      console.error(`[Gateway] Failed to remove quiz from class:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to remove quiz',
          message: serviceError.message || 'Failed to remove quiz from class'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in removeQuizFromClass:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all quizzes for a class (Teacher only)
 * GET /api/v1/class-quizzes/class/:class_id
 */
async function getClassQuizzes(req, res) {
  try {
    const { class_id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view class quizzes'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} getting quizzes for class ${class_id}`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'GET',
        `/class-quizzes/class/${class_id}`,
        null,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );

      console.log(`[Gateway] Class quizzes retrieved successfully`);
      return res.status(response.status).json(response.data);

    } catch (serviceError) {
      console.error(`[Gateway] Failed to get class quizzes:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to get class quizzes',
          message: serviceError.message || 'Failed to retrieve class quizzes'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getClassQuizzes:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get available quizzes for student in a class (Student only)
 * GET /api/v1/class-quizzes/class/:class_id/student
 */
async function getAvailableQuizzesForStudent(req, res) {
  try {
    const { class_id } = req.params;

    // Get student_id from token
    const student_id = req.user?.student_id;

    if (!student_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can view available quizzes'
      });
    }

    console.log(`[Gateway] Student ${student_id} getting available quizzes for class ${class_id}`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'GET',
        `/class-quizzes/class/${class_id}/student`,
        null,
        {
          headers: {
            'x-student-id': student_id
          }
        }
      );

      console.log(`[Gateway] Available quizzes retrieved successfully`);
      return res.status(response.status).json(response.data);

    } catch (serviceError) {
      console.error(`[Gateway] Failed to get available quizzes:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to get available quizzes',
          message: serviceError.message || 'Failed to retrieve available quizzes'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getAvailableQuizzesForStudent:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get class quiz by ID (Teacher only)
 * GET /api/v1/class-quizzes/:id
 */
async function getClassQuizById(req, res) {
  try {
    const { id } = req.params;

    // Get teacher_id from token
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can view class quiz details'
      });
    }

    console.log(`[Gateway] Teacher ${teacher_id} getting class quiz ${id}`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'GET',
        `/class-quizzes/${id}`,
        null,
        {
          headers: {
            'x-teacher-id': teacher_id
          }
        }
      );

      console.log(`[Gateway] Class quiz retrieved successfully`);
      return res.status(response.status).json(response.data);

    } catch (serviceError) {
      console.error(`[Gateway] Failed to get class quiz:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to get class quiz',
          message: serviceError.message || 'Failed to retrieve class quiz'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getClassQuizById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Get all quizzes for student in a class with pagination (Student only)
 * GET /api/v1/class-quizzes/class/:class_id/student/all
 */
async function getClassQuizzesForStudent(req, res) {
  try {
    const { class_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get student_id from token
    const student_id = req.user?.student_id;

    if (!student_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can view class quizzes'
      });
    }

    // Create cache key
    const cacheKey = `class_quizzes_${class_id}_${student_id}_${page}_${limit}`;

    // Check cache first
    const cachedData = quizListCache.get(cacheKey);
    if (cachedData) {
      console.log(`[Gateway] Cache HIT for ${cacheKey}`);
      return res.status(200).json({
        ...cachedData,
        cached: true,
        cache_expires_in: quizListCache.getTtl(cacheKey) ? Math.floor((quizListCache.getTtl(cacheKey) - Date.now()) / 1000) : 0
      });
    }

    console.log(`[Gateway] Cache MISS for ${cacheKey}`);
    console.log(`[Gateway] Student ${student_id} getting quizzes for class ${class_id} (page: ${page}, limit: ${limit})`);

    // Call quiz service
    try {
      const response = await callQuizService(
        'GET',
        `/class-quizzes/class/${class_id}/student/all?page=${page}&limit=${limit}`,
        null,
        {
          headers: {
            'x-student-id': student_id
          }
        }
      );

      console.log(`[Gateway] Class quizzes retrieved successfully`);
      
      // Cache the response
      quizListCache.set(cacheKey, response.data);
      console.log(`[Gateway] Cached data for ${cacheKey} (TTL: 60s)`);

      return res.status(response.status).json({
        ...response.data,
        cached: false
      });

    } catch (serviceError) {
      console.error(`[Gateway] Failed to get class quizzes:`, serviceError.message);
      return res.status(serviceError.statusCode || 500).json(
        serviceError.response || {
          success: false,
          error: 'Failed to get class quizzes',
          message: serviceError.message || 'Failed to retrieve class quizzes'
        }
      );
    }

  } catch (error) {
    console.error('[Gateway] Unexpected error in getClassQuizzesForStudent:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

module.exports = {
  assignQuizToClass,
  updateClassQuiz,
  removeQuizFromClass,
  getClassQuizzes,
  getAvailableQuizzesForStudent,
  getClassQuizzesForStudent,
  getClassQuizById
};
