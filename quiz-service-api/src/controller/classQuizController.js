const classQuizService = require('../service/classQuizService');

/**
 * Controller for ClassQuiz operations
 */
class ClassQuizController {
  /**
   * Assign quiz to a class
   * POST /api/class-quizzes
   */
  async assignQuizToClass(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'X-Teacher-ID header is required'
        });
      }

      const { quiz_id, class_id, start_time, end_time } = req.body;

      // Validate required fields
      if (!quiz_id || !class_id || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: quiz_id, class_id, start_time, end_time'
        });
      }

      const classQuiz = await classQuizService.assignQuizToClass(
        { quiz_id, class_id, start_time, end_time },
        teacher_id
      );

      return res.status(201).json({
        success: true,
        message: 'Quiz assigned to class successfully',
        data: classQuiz
      });
    } catch (error) {
      console.error('Error in assignQuizToClass:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'INVALID_DATE' || error.code === 'INVALID_TIME_RANGE') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'ALREADY_ASSIGNED') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'CLASS_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to assign quiz to class',
        error: error.message
      });
    }
  }

  /**
   * Update class quiz time
   * PUT /api/class-quizzes/:id
   */
  async updateClassQuiz(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'X-Teacher-ID header is required'
        });
      }

      const { id } = req.params;
      const { start_time, end_time } = req.body;

      if (!start_time && !end_time) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (start_time or end_time) is required'
        });
      }

      const classQuiz = await classQuizService.updateClassQuiz(
        id,
        { start_time, end_time },
        teacher_id
      );

      return res.status(200).json({
        success: true,
        message: 'Class quiz updated successfully',
        data: classQuiz
      });
    } catch (error) {
      console.error('Error in updateClassQuiz:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'INVALID_DATE' || error.code === 'INVALID_TIME_RANGE') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update class quiz',
        error: error.message
      });
    }
  }

  /**
   * Remove quiz from class
   * DELETE /api/class-quizzes/:id
   */
  async removeQuizFromClass(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'X-Teacher-ID header is required'
        });
      }

      const { id } = req.params;

      await classQuizService.removeQuizFromClass(id, teacher_id);

      return res.status(200).json({
        success: true,
        message: 'Quiz removed from class successfully'
      });
    } catch (error) {
      console.error('Error in removeQuizFromClass:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to remove quiz from class',
        error: error.message
      });
    }
  }

  /**
   * Get all quizzes assigned to a class (for teacher)
   * GET /api/class-quizzes/class/:class_id
   */
  async getClassQuizzes(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'X-Teacher-ID header is required'
        });
      }

      const { class_id } = req.params;

      const classQuizzes = await classQuizService.getClassQuizzes(class_id, teacher_id);

      return res.status(200).json({
        success: true,
        message: 'Class quizzes retrieved successfully',
        data: classQuizzes
      });
    } catch (error) {
      console.error('Error in getClassQuizzes:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve class quizzes',
        error: error.message
      });
    }
  }

  /**
   * Get available quizzes for student in a class (only active)
   * GET /api/class-quizzes/class/:class_id/student
   */
  async getAvailableQuizzesForStudent(req, res) {
    try {
      const student_id = req.headers['x-student-id'];

      if (!student_id) {
        return res.status(401).json({
          success: false,
          message: 'X-Student-ID header is required'
        });
      }

      const { class_id } = req.params;

      const quizzes = await classQuizService.getAvailableQuizzesForStudent(class_id, student_id);

      return res.status(200).json({
        success: true,
        message: 'Available quizzes retrieved successfully',
        data: quizzes
      });
    } catch (error) {
      console.error('Error in getAvailableQuizzesForStudent:', error);

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve available quizzes',
        error: error.message
      });
    }
  }

  /**
   * Get all quizzes for student in a class with pagination
   * GET /api/class-quizzes/class/:class_id/student/all
   */
  async getClassQuizzesForStudent(req, res) {
    try {
      const student_id = req.headers['x-student-id'];

      if (!student_id) {
        return res.status(401).json({
          success: false,
          message: 'X-Student-ID header is required'
        });
      }

      const { class_id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await classQuizService.getClassQuizzesForStudent(
        class_id,
        student_id,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      return res.status(200).json({
        success: true,
        message: 'Class quizzes retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getClassQuizzesForStudent:', error);

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve class quizzes',
        error: error.message
      });
    }
  }

  /**
   * Get class quiz by ID
   * GET /api/class-quizzes/:id
   */
  async getClassQuizById(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];
      const isServiceCall = req.headers['x-service-call'] === 'true';

      // Only require teacher_id if not a service-to-service call
      if (!teacher_id && !isServiceCall) {
        return res.status(401).json({
          success: false,
          message: 'X-Teacher-ID header is required'
        });
      }

      const { id } = req.params;

      const classQuiz = await classQuizService.getClassQuizById(id, teacher_id, isServiceCall);

      return res.status(200).json({
        success: true,
        message: 'Class quiz retrieved successfully',
        data: classQuiz
      });
    } catch (error) {
      console.error('Error in getClassQuizById:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve class quiz',
        error: error.message
      });
    }
  }
}

module.exports = new ClassQuizController();
