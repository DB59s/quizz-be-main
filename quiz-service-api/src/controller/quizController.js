const quizService = require('../service/quizService');
const serviceHelper = require('../utils/serviceHelper');

/**
 * Controller for Quiz operations
 */
class QuizController {
  /**
   * @swagger
   * /quizzes:
   *   post:
   *     summary: Create a new quiz
   *     tags: [Quiz]
   *     parameters:
   *       - in: header
   *         name: x-teacher-id
   *         required: true
   *         schema:
   *           type: string
   *         description: Teacher ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - question_ids
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Math Quiz 1"
   *               description:
   *                 type: string
   *                 example: "Quiz about basic math"
   *               question_ids:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["uuid-1", "uuid-2"]
   *     responses:
   *       201:
   *         description: Quiz created successfully
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Missing teacher ID
   */
  async createQuiz(req, res) {
    try {
      // Get teacher_id from header
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID is required in header (x-teacher-id)'
        });
      }

      const { name, description, question_ids } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Quiz name is required'
        });
      }

      if (!question_ids || !Array.isArray(question_ids)) {
        return res.status(400).json({
          success: false,
          message: 'question_ids must be an array'
        });
      }

      // Create quiz
      const quiz = await quizService.createQuiz({
        name,
        description,
        teacher_id,
        question_ids
      });

      return res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz
      });
    } catch (error) {
      console.error('Error in createQuiz:', error);

      // Handle validation errors
      if (error.code === 'INVALID_NAME') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'NO_QUESTIONS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create quiz',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /quizzes:
   *   get:
   *     summary: Get all quizzes for a teacher
   *     tags: [Quiz]
   *     parameters:
   *       - in: header
   *         name: x-teacher-id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: List of quizzes
   */
  async getQuizzes(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID is required in header (x-teacher-id)'
        });
      }

      const { page, limit } = req.query;

      const result = await quizService.getQuizzes(teacher_id, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      });

      return res.status(200).json({
        success: true,
        message: 'Quizzes retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Error in getQuizzes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve quizzes',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /quizzes/{id}:
   *   get:
   *     summary: Get quiz by ID
   *     tags: [Quiz]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: header
   *         name: x-teacher-id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Quiz details
   *       404:
   *         description: Quiz not found
   */
  async getQuizById(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];
      const isServiceCall = req.headers['x-service-call'] === 'true';

      // Only require teacher_id if not a service-to-service call
      if (!teacher_id && !isServiceCall) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID is required in header (x-teacher-id)'
        });
      }

      const { id } = req.params;

      const quiz = await quizService.getQuizById(id, teacher_id, isServiceCall);

      return res.status(200).json({
        success: true,
        message: 'Quiz retrieved successfully',
        data: quiz
      });
    } catch (error) {
      console.error('Error in getQuizById:', error);

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
        message: 'Failed to retrieve quiz',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /quizzes/{id}:
   *   put:
   *     summary: Update quiz
   *     tags: [Quiz]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: header
   *         name: x-teacher-id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               question_ids:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Quiz updated successfully
   */
  async updateQuiz(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID is required in header (x-teacher-id)'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const quiz = await quizService.updateQuiz(id, teacher_id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Quiz updated successfully',
        data: quiz
      });
    } catch (error) {
      console.error('Error in updateQuiz:', error);

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

      if (error.code === 'INVALID_NAME' || error.code === 'NO_QUESTIONS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update quiz',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /quizzes/{id}:
   *   delete:
   *     summary: Delete quiz
   *     tags: [Quiz]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: header
   *         name: x-teacher-id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Quiz deleted successfully
   */
  async deleteQuiz(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];

      if (!teacher_id) {
        return res.status(401).json({
          success: false,
          message: 'Teacher ID is required in header (x-teacher-id)'
        });
      }

      const { id } = req.params;

      await quizService.deleteQuiz(id, teacher_id);

      return res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteQuiz:', error);

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
        message: 'Failed to delete quiz',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /quizzes/{id}/student:
   *   get:
   *     summary: Get quiz for student with authorization
   *     tags: [Quiz]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: header
   *         name: x-student-id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Quiz details with questions
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Quiz not found
   */
  async getQuizForStudent(req, res) {
    try {
      const student_id = req.headers['x-student-id'];

      if (!student_id) {
        return res.status(401).json({
          success: false,
          message: 'Student ID is required in header (x-student-id)'
        });
      }

      const { id } = req.params;

      const quiz = await quizService.getQuizForStudent(id, student_id);

      return res.status(200).json({
        success: true,
        message: 'Quiz retrieved successfully',
        data: quiz
      });
    } catch (error) {
      console.error('Error in getQuizForStudent:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'NOT_ASSIGNED') {
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

      if (error.code === 'NOT_STARTED') {
        return res.status(403).json({
          success: false,
          message: error.message,
          start_time: error.start_time
        });
      }

      if (error.code === 'ENDED') {
        return res.status(403).json({
          success: false,
          message: error.message,
          end_time: error.end_time
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve quiz',
        error: error.message
      });
    }
  }

  /**
   * Get total number of quizzes for a teacher
   * GET /quizzes/teacher/:teacher_id/count
   */
  async getTeacherQuizzesCount(req, res) {
    try {
      const { teacher_id } = req.params;

      if (!teacher_id) {
        return res.status(400).json({
          success: false,
          message: 'teacher_id is required'
        });
      }

      const count = await quizService.getTeacherQuizzesCount(teacher_id);

      return res.status(200).json({
        success: true,
        message: 'Total quizzes count retrieved successfully',
        data: { count }
      });
    } catch (error) {
      console.error('Error getting teacher quizzes count:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get quizzes count',
        error: error.message
      });
    }
  }
}

module.exports = new QuizController();
