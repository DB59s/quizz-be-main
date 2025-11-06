const { createServiceCaller, callService } = require('../utils/serviceHelper');
const {
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN,
  QUIZ_SERVICE_BASEURL,
  QUIZ_SERVICE_API_TOKEN,
  QUESTION_SERVICE_BASEURL,
  QUESTION_SERVICE_API_TOKEN
} = require('../config/env');

const SUBMISSION_SERVICE_URL = process.env.SUBMISSION_SERVICE_BASEURL || 'http://submission-service-api:9011/api';
const SUBMISSION_SERVICE_TOKEN = process.env.SUBMISSION_SERVICE_API_TOKEN || '';

// Create pre-configured service callers
const callClassService = createServiceCaller(
  'Class Service',
  CLASS_SERVICE_BASEURL,
  CLASS_SERVICE_API_TOKEN
);

const callQuizService = createServiceCaller(
  'Quiz Service',
  QUIZ_SERVICE_BASEURL,
  QUIZ_SERVICE_API_TOKEN
);

const callQuestionService = createServiceCaller(
  'Question Service',
  QUESTION_SERVICE_BASEURL,
  QUESTION_SERVICE_API_TOKEN
);

const callSubmissionService = (method, path, data = null, options = {}) => {
  return callService(
    {
      serviceName: 'Submission Service',
      baseUrl: SUBMISSION_SERVICE_URL,
      apiToken: SUBMISSION_SERVICE_TOKEN
    },
    method,
    path,
    data,
    options
  );
};

/**
 * GET /api/v1/dashboard/teacher
 * Get dashboard statistics for teacher
 */
async function getTeacherDashboard(req, res) {
  try {
    const teacher_id = req.user?.teacher_id;

    if (!teacher_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only teachers can access this dashboard'
      });
    }

    console.log(`[Gateway] Fetching dashboard for teacher ${teacher_id}`);

    // Fetch all data in parallel using Promise.all
    const [
      totalClassesResponse,
      totalStudentsResponse,
      totalQuizzesResponse,
      totalQuestionsResponse,
      scoreDistributionResponse
    ] = await Promise.all([
      // [KPI 1] Total classes
      callClassService('GET', `/classes/teacher/${teacher_id}/count`)
        .catch(err => {
          console.error('[Dashboard] Error fetching total classes:', err.message);
          return { data: { success: true, data: { count: 0 } } };
        }),

      // [KPI 2] Total students (approved) across all classes
      callClassService('GET', `/classes/teacher/${teacher_id}/students/count`)
        .catch(err => {
          console.error('[Dashboard] Error fetching total students:', err.message);
          return { data: { success: true, data: { count: 0 } } };
        }),

      // [KPI 3] Total quizzes created
      callQuizService('GET', `/quizzes/teacher/${teacher_id}/count`)
        .catch(err => {
          console.error('[Dashboard] Error fetching total quizzes:', err.message);
          return { data: { success: true, data: { count: 0 } } };
        }),

      // [KPI 4] Total questions created
      callQuestionService('GET', `/questions/teacher/${teacher_id}/count`)
        .catch(err => {
          console.error('[Dashboard] Error fetching total questions:', err.message);
          return { data: { success: true, data: { count: 0 } } };
        }),

      // [Chart] Score distribution
      callSubmissionService('GET', `/submissions/teacher/${teacher_id}/score-distribution`)
        .catch(err => {
          console.error('[Dashboard] Error fetching score distribution:', err.message);
          return { data: { success: true, data: [] } };
        })
    ]);

    // Extract data from responses
    const totalClasses = totalClassesResponse?.data?.data?.count || 0;
    const totalStudents = totalStudentsResponse?.data?.data?.count || 0;
    const totalQuizzes = totalQuizzesResponse?.data?.data?.count || 0;
    const totalQuestions = totalQuestionsResponse?.data?.data?.count || 0;
    const scoreDistribution = scoreDistributionResponse?.data?.data || [];

    console.log(`[Gateway] Teacher dashboard fetched successfully`);

    return res.status(200).json({
      success: true,
      data: {
        kpi: {
          total_classes: totalClasses,
          total_students: totalStudents,
          total_quizzes: totalQuizzes,
          total_questions: totalQuestions
        },
        score_distribution_chart: scoreDistribution
      }
    });
  } catch (error) {
    console.error('[Gateway] Error fetching teacher dashboard:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch teacher dashboard'
    });
  }
}

/**
 * GET /api/v1/dashboard/student
 * Get dashboard statistics for student
 */
async function getStudentDashboard(req, res) {
  try {
    const student_id = req.user?.student_id;

    if (!student_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can access this dashboard'
      });
    }

    console.log(`[Gateway] Fetching dashboard for student ${student_id}`);

    // Fetch all data in parallel using Promise.all
    const [
      totalClassesResponse,
      submissionSummaryResponse,
      upcomingQuizzesResponse,
      progressChartResponse
    ] = await Promise.all([
      // [KPI 1] Total classes joined (approved)
      callClassService('GET', `/student-classes/student/${student_id}/count`)
        .catch(err => {
          console.error('[Dashboard] Error fetching total classes:', err.message);
          return { data: { success: true, data: { count: 0 } } };
        }),

      // [KPI 2 & 3] Total submissions and average score
      callSubmissionService('GET', `/submissions/student/${student_id}/summary`)
        .catch(err => {
          console.error('[Dashboard] Error fetching submission summary:', err.message);
          return { data: { success: true, data: { total_submissions: 0, average_score: 0 } } };
        }),

      // [KPI 4] Upcoming quizzes
      callQuizService('GET', `/class-quizzes/student/${student_id}/upcoming/count`)
        .catch(err => {
          console.error('[Dashboard] Error fetching upcoming quizzes:', err.message);
          return { data: { success: true, data: { count: 0 } } };
        }),

      // [Chart] Progress chart
      callSubmissionService('GET', `/submissions/student/${student_id}/progress`)
        .catch(err => {
          console.error('[Dashboard] Error fetching progress chart:', err.message);
          return { data: { success: true, data: [] } };
        })
    ]);

    // Extract data from responses
    const totalClasses = totalClassesResponse?.data?.data?.count || 0;
    const submissionSummary = submissionSummaryResponse?.data?.data || {};
    const totalSubmissions = submissionSummary.total_submissions || 0;
    const averageScore = submissionSummary.average_score || 0;
    const upcomingQuizzes = upcomingQuizzesResponse?.data?.data?.count || 0;
    const progressChart = progressChartResponse?.data?.data || [];

    console.log(`[Gateway] Student dashboard fetched successfully`);

    return res.status(200).json({
      success: true,
      data: {
        kpi: {
          total_classes_joined: totalClasses,
          total_submissions: totalSubmissions,
          average_score: averageScore,
          upcoming_quizzes: upcomingQuizzes
        },
        progress_chart: progressChart
      }
    });
  } catch (error) {
    console.error('[Gateway] Error fetching student dashboard:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch student dashboard'
    });
  }
}

module.exports = {
  getTeacherDashboard,
  getStudentDashboard
};

