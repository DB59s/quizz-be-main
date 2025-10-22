const { submissionService } = require('../service');

class SubmissionController {
  // Get all submissions - GET /api/submissions
  async getAllSubmissions(req, res) {
    try {
      const submissions = await submissionService.getAllSubmissions();
      
      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      console.error('Error getting submissions:', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submission by ID - GET /api/submissions/:id
  async getSubmissionById(req, res) {
    try {
      const { id } = req.params;

      const submission = await submissionService.getSubmissionById(id);
      
      res.status(200).json({
        success: true,
        message: 'Submission retrieved successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error getting submission:', error.message);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submissions by student ID - GET /api/submissions/student/:studentId
  async getSubmissionsByStudentId(req, res) {
    try {
      const { studentId } = req.params;

      const submissions = await submissionService.getSubmissionsByStudentId(studentId);
      
      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      console.error('Error getting submissions by student:', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get submissions by quiz class ID - GET /api/submissions/quiz-class/:quizzClassId
  async getSubmissionsByQuizClassId(req, res) {
    try {
      const { quizzClassId } = req.params;

      const submissions = await submissionService.getSubmissionsByQuizClassId(quizzClassId);
      
      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      console.error('Error getting submissions by quiz class:', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Create new submission - POST /api/submissions
  async createSubmission(req, res) {
    try {
      const submissionData = req.body;
      
      if (!submissionData || Object.keys(submissionData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
          data: null
        });
      }

      const submission = await submissionService.createSubmission(submissionData);
      
      res.status(201).json({
        success: true,
        message: 'Submission created successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error creating submission:', error.message);
      
      const statusCode = error.message.includes('Validation failed') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Update submission - PUT /api/submissions/:id
  async updateSubmission(req, res) {
    try {
      const { id } = req.params;
      const submissionData = req.body;

      if (!submissionData || Object.keys(submissionData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
          data: null
        });
      }

      const submission = await submissionService.updateSubmission(id, submissionData);
      
      res.status(200).json({
        success: true,
        message: 'Submission updated successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error updating submission:', error.message);
      
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('Validation failed')) {
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Delete submission - DELETE /api/submissions/:id
  async deleteSubmission(req, res) {
    try {
      const { id } = req.params;

      const result = await submissionService.deleteSubmission(id);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });
    } catch (error) {
      console.error('Error deleting submission:', error.message);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = new SubmissionController();
