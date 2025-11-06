const { submissionService } = require('../service');

class SubmissionController {

  // Create new submission - POST /api/submissions
  // Role: Student
  async createSubmission(req, res) {
    try {
      const submissionData = req.body;
      
      // Get student_id from JWT token (passed by Gateway)
      // Assuming Gateway adds user info to req.user or req.headers
      const student_id = req.user?.user_id || req.headers['x-user-id'];
      
      if (!student_id) {
        return res.status(401).json({
          success: false,
          message: 'Student ID not found in token',
          data: null
        });
      }

      if (!submissionData || Object.keys(submissionData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
          data: null
        });
      }

      const submission = await submissionService.createSubmission(student_id, submissionData);
      
      // Prepare response data
      const responseData = {
        submission_id: submission.id,
        class_quiz_id: submission.class_quiz_id,
        student_id: submission.student_id,
        submission_time: submission.submission_time,
        total_time: submission.total_time,
        status: submission.status,
        answers_count: submission.answers?.length || 0
      };

      // Include grading results if available
      if (submission.status === 'graded') {
        responseData.score = submission.score;
        responseData.n_total_true = submission.n_total_true;
        responseData.graded = true;
      } else {
        responseData.graded = false;
      }
      
      res.status(201).json({
        success: true,
        message: submission.status === 'graded' 
          ? 'Submission created and graded successfully' 
          : 'Submission created successfully',
        data: responseData
      });
    } catch (error) {
      console.error('Error creating submission:', error.message);
      
      // Handle specific error codes
      let statusCode = 500;
      if (error.statusCode === 409) {
        statusCode = 409; // Conflict - already submitted
      } else if (error.message.includes('not found') || error.message.includes('not enrolled')) {
        statusCode = 403; // Forbidden
      } else if (error.message.includes('required') || error.message.includes('not started') || error.message.includes('deadline')) {
        statusCode = 400; // Bad request
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get all submissions - GET /api/submissions
  // Role: Admin
  async getAllSubmissions(req, res) {
    try {
      const submissions = await submissionService.getAllSubmissions();
      
      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      console.error('Error fetching submissions:', error.message);
      
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submissions by class for student - GET /api/submissions/student/class/:class_id
  // Role: Student
  async getSubmissionsByClassForStudent(req, res) {
    try {
      const student_id = req.user?.user_id || req.headers['x-user-id'];
      const { class_id } = req.params;

      if (!student_id) {
        return res.status(401).json({
          success: false,
          message: 'Student ID not found in token',
          data: null
        });
      }

      if (!class_id) {
        return res.status(400).json({
          success: false,
          message: 'class_id is required',
          data: null
        });
      }

      const submissions = await submissionService.getSubmissionsByClassForStudent(student_id, class_id);

      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      console.error('Error getting submissions by class:', error.message);

      let statusCode = 500;
      if (error.statusCode === 403) {
        statusCode = 403;
      } else if (error.statusCode === 404) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submission result for student - GET /api/submissions/:submission_id/result
  // Role: Student
  async getSubmissionResult(req, res) {
    try {
      const student_id = req.user?.user_id || req.headers['x-user-id'];
      const { submission_id } = req.params;

      if (!student_id) {
        return res.status(401).json({
          success: false,
          message: 'Student ID not found in token',
          data: null
        });
      }

      if (!submission_id) {
        return res.status(400).json({
          success: false,
          message: 'submission_id is required',
          data: null
        });
      }

      const result = await submissionService.getSubmissionResult(student_id, submission_id);

      res.status(200).json({
        success: true,
        message: 'Submission result retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting submission result:', error.message);

      let statusCode = 500;
      if (error.statusCode === 403) {
        statusCode = 403;
      } else if (error.statusCode === 404) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submissions by class quiz for teacher - GET /api/submissions/class-quiz/:class_quiz_id
  // Role: Teacher
  async getSubmissionsByClassQuiz(req, res) {
    try {
      const teacher_id = req.user?.user_id || req.headers['x-teacher-id'];
      const { class_quiz_id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID not found in token',
          data: null
        });
      }

      if (!class_quiz_id) {
        return res.status(400).json({
          success: false,
          message: 'class_quiz_id is required',
          data: null
        });
      }

      const result = await submissionService.getSubmissionsByClassQuiz(teacher_id, class_quiz_id, { page, limit });

      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting submissions by class quiz:', error.message);

      let statusCode = 500;
      if (error.statusCode === 403) {
        statusCode = 403;
      } else if (error.statusCode === 404) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submission result for teacher - GET /api/submissions/:submission_id/teacher
  // Role: Teacher
  async getSubmissionResultForTeacher(req, res) {
    try {
      const teacher_id = req.user?.user_id || req.headers['x-teacher-id'];
      const { submission_id } = req.params;

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID not found in token',
          data: null
        });
      }

      if (!submission_id) {
        return res.status(400).json({
          success: false,
          message: 'submission_id is required',
          data: null
        });
      }

      const result = await submissionService.getSubmissionResultForTeacher(teacher_id, submission_id);

      res.status(200).json({
        success: true,
        message: 'Submission result retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting submission result for teacher:', error.message);

      let statusCode = 500;
      if (error.statusCode === 403) {
        statusCode = 403;
      } else if (error.statusCode === 404) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get quiz statistics for teacher - GET /api/submissions/class-quiz/:class_quiz_id/statistics
  // Role: Teacher
  async getQuizStatistics(req, res) {
    try {
      const teacher_id = req.user?.user_id || req.headers['x-teacher-id'];
      const { class_quiz_id } = req.params;

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID not found in token',
          data: null
        });
      }

      if (!class_quiz_id) {
        return res.status(400).json({
          success: false,
          message: 'class_quiz_id is required',
          data: null
        });
      }

      const result = await submissionService.getQuizStatistics(teacher_id, class_quiz_id);

      res.status(200).json({
        success: true,
        message: 'Quiz statistics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting quiz statistics:', error.message);

      let statusCode = 500;
      if (error.statusCode === 403) {
        statusCode = 403;
      } else if (error.statusCode === 404) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Grade a submission - POST /api/submissions/:submission_id/grade
  // Internal API - typically called after submission creation or by background job
  async gradeSubmission(req, res) {
    try {
      const { submission_id } = req.params;

      if (!submission_id) {
        return res.status(400).json({
          success: false,
          message: 'submission_id is required',
          data: null
        });
      }

      const result = await submissionService.gradeSubmission(submission_id);

      res.status(200).json({
        success: true,
        message: 'Submission graded successfully',
        data: result
      });
    } catch (error) {
      console.error('Error grading submission:', error.message);

      let statusCode = 500;
      if (error.statusCode === 404) {
        statusCode = 404;
      } else if (error.message.includes('already been graded')) {
        statusCode = 409; // Conflict
      } else if (error.message.includes('not found') || error.message.includes('no questions')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Get score distribution for teacher's quizzes
   * GET /api/submissions/teacher/:teacher_id/score-distribution
   */
  async getTeacherScoreDistribution(req, res) {
    try {
      const { teacher_id } = req.params;

      if (!teacher_id) {
        return res.status(400).json({
          success: false,
          message: 'teacher_id is required',
          data: null
        });
      }

      const distribution = await submissionService.getTeacherScoreDistribution(teacher_id);

      return res.status(200).json({
        success: true,
        message: 'Score distribution retrieved successfully',
        data: distribution
      });
    } catch (error) {
      console.error('Error getting teacher score distribution:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get score distribution',
        data: null
      });
    }
  }

  /**
   * Get submission summary for student
   * GET /api/submissions/student/:student_id/summary
   */
  async getStudentSubmissionSummary(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: 'student_id is required',
          data: null
        });
      }

      const summary = await submissionService.getStudentSubmissionSummary(student_id);

      return res.status(200).json({
        success: true,
        message: 'Submission summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      console.error('Error getting student submission summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get submission summary',
        data: null
      });
    }
  }

  /**
   * Get progress chart for student
   * GET /api/submissions/student/:student_id/progress
   */
  async getStudentProgress(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: 'student_id is required',
          data: null
        });
      }

      const progress = await submissionService.getStudentProgress(student_id);

      return res.status(200).json({
        success: true,
        message: 'Student progress retrieved successfully',
        data: progress
      });
    } catch (error) {
      console.error('Error getting student progress:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get student progress',
        data: null
      });
    }
  }

}

module.exports = new SubmissionController();
