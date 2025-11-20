const axios = require('axios');
const { callService } = require('../utils/serviceHelper');

const SUBMISSION_SERVICE_URL = process.env.SUBMISSION_SERVICE_BASEURL || 'http://submission-service-api:9011/api';
const SUBMISSION_SERVICE_TOKEN = process.env.SUBMISSION_SERVICE_API_TOKEN || '';

// In-memory cache for rate limiting (15 minutes per student per quiz)
// Structure: Map<"student_id:class_quiz_id", timestamp>
const submissionCache = new Map();
const RATE_LIMIT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Check if student can submit (rate limiting)
 */
function canSubmit(student_id, class_quiz_id) {
  const cacheKey = `${student_id}:${class_quiz_id}`;
  const lastSubmissionTime = submissionCache.get(cacheKey);
  
  if (!lastSubmissionTime) {
    return { allowed: true };
  }
  
  const now = Date.now();
  const timeSinceLastSubmission = now - lastSubmissionTime;
  
  if (timeSinceLastSubmission < RATE_LIMIT_DURATION) {
    const remainingTime = Math.ceil((RATE_LIMIT_DURATION - timeSinceLastSubmission) / 1000 / 60); // minutes
    return {
      allowed: false,
      remainingMinutes: remainingTime
    };
  }
  
  return { allowed: true };
}

/**
 * Update submission cache
 */
function updateSubmissionCache(student_id, class_quiz_id) {
  const cacheKey = `${student_id}:${class_quiz_id}`;
  submissionCache.set(cacheKey, Date.now());
  
  // Clean up old entries (older than rate limit duration)
  const now = Date.now();
  for (const [key, timestamp] of submissionCache.entries()) {
    if (now - timestamp > RATE_LIMIT_DURATION) {
      submissionCache.delete(key);
    }
  }
}

/**
 * POST /api/v1/submissions - Submit quiz answers (Student only)
 */
async function createSubmission(req, res) {
  try {
    console.log("req. user như sau :    " , req.user);
    const student_id = req?.user?.user_id;

    console.log("student_id" , student_id);
    const { class_quiz_id, answers, total_time } = req.body;

    if (!class_quiz_id) {
      return res.status(400).json({
        success: false,
        message: 'class_quiz_id is required',
        data: null
      });
    }

    // Check rate limiting
    const rateLimitCheck = canSubmit(student_id, class_quiz_id);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `You can only submit once every 15 minutes. Please wait ${rateLimitCheck.remainingMinutes} more minute(s).`,
        data: {
          remainingMinutes: rateLimitCheck.remainingMinutes
        }
      });
    }

    console.log(`[Gateway] Student ${student_id} submitting quiz ${class_quiz_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'POST',
      '/submissions',
      { class_quiz_id, answers, total_time },
      {
        headers: {
          'x-user-id': student_id
        }
      }
    );

    // Update cache after successful submission
    updateSubmissionCache(student_id, class_quiz_id);

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error creating submission:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create submission',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions - Get all submissions (Admin only)
 */
async function getAllSubmissions(req, res) {
  try {
    console.log('[Gateway] Admin fetching all submissions');

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      '/submissions',
      null
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching submissions:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions/student/class/:class_id - Get submissions by class for student
 */
async function getSubmissionsByClassForStudent(req, res) {
  try {
    const student_id = req.user.user_id;
    const { class_id } = req.params;

    console.log(`[Gateway] Student ${student_id} fetching submissions for class ${class_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      `/submissions/student/class/${class_id}`,
      null,
      {
        headers: {
          'x-user-id': student_id
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching submissions by class:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions/:submission_id/result - Get submission result for student
 */
async function getSubmissionResult(req, res) {
  try {
    const student_id = req.user.user_id;
    const { submission_id } = req.params;

    console.log(`[Gateway] Student ${student_id} fetching result for submission ${submission_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      `/submissions/${submission_id}/result`,
      null,
      {
        headers: {
          'x-user-id': student_id
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching submission result:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submission result',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions/class-quiz/:class_quiz_id - Get submissions by class quiz for teacher
 */
async function getSubmissionsByClassQuiz(req, res) {
  try {
    const teacher_id = req.user.user_id;
    const { class_quiz_id } = req.params;
    const { page, limit } = req.query;

    console.log(`[Gateway] Teacher ${teacher_id} fetching submissions for class quiz ${class_quiz_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      `/submissions/class-quiz/${class_quiz_id}?page=${page || 1}&limit=${limit || 10}`,
      null,
      {
        headers: {
          'x-teacher-id': teacher_id
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching submissions by class quiz:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions/:submission_id/teacher - Get submission result for teacher
 */
async function getSubmissionResultForTeacher(req, res) {
  try {
    const teacher_id = req.user.user_id;
    const { submission_id } = req.params;

    console.log(`[Gateway] Teacher ${teacher_id} fetching result for submission ${submission_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      `/submissions/${submission_id}/teacher`,
      null,
      {
        headers: {
          'x-teacher-id': teacher_id
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching submission result for teacher:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submission result',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions/class-quiz/:class_quiz_id/statistics - Get quiz statistics for teacher
 */
async function getQuizStatistics(req, res) {
  try {
    const teacher_id = req.user.user_id;
    const { class_quiz_id } = req.params;

    console.log(`[Gateway] Teacher ${teacher_id} fetching statistics for class quiz ${class_quiz_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      `/submissions/class-quiz/${class_quiz_id}/statistics`,
      null,
      {
        headers: {
          'x-teacher-id': teacher_id
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching quiz statistics:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      data: null
    });
  }
}

/**
 * GET /api/v1/submissions/me - Get my submissions (Student only)
 */
async function getMySubmissions(req, res) {
  try {
    const student_id = req.user.user_id;
    const { page, limit, class_id, status } = req.query;

    console.log(`[Gateway] Student ${student_id} fetching own submissions`);

    // Build query string
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (class_id) params.append('class_id', class_id);
    if (status) params.append('status', status);

    const queryString = params.toString();
    const path = `/submissions/student/${student_id}${queryString ? `?${queryString}` : ''}`;

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'GET',
      path,
      null,
      {
        headers: {
          'x-user-id': student_id
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error fetching my submissions:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      data: null
    });
  }
}

/**
 * POST /api/v1/submissions/:submission_id/grade - Grade a submission (Internal/Admin only)
 */
async function gradeSubmission(req, res) {
  try {
    const { submission_id } = req.params;

    console.log(`[Gateway] Grading submission ${submission_id}`);

    // Call Submission Service
    const response = await callService(
      {
        serviceName: 'Submission Service',
        baseUrl: SUBMISSION_SERVICE_URL,
        apiToken: SUBMISSION_SERVICE_TOKEN
      },
      'POST',
      `/submissions/${submission_id}/grade`,
      null
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Error grading submission:', error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json(error.response || {
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || {
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to grade submission',
      data: null
    });
  }
}

module.exports = {
  createSubmission,
  gradeSubmission,
  getAllSubmissions,
  getSubmissionsByClassForStudent,
  getSubmissionResult,
  getSubmissionsByClassQuiz,
  getSubmissionResultForTeacher,
  getQuizStatistics,
  getMySubmissions
};
