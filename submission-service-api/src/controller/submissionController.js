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

}

module.exports = new SubmissionController();
