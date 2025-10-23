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
    const student_id = req.user.user_id;
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
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
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
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
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
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
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
  getAllSubmissions
};
