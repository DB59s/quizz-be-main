const questionService = require('../service/questionService');

/**
 * Controller for Question operations
 */
class QuestionController {
  /**
   * Create a new question
   * @swagger
   * /api/questions:
   *   post:
   *     summary: Create a new question with answers and subject associations
   *     tags: [Questions]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: X-Teacher-ID
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Teacher ID from gateway authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *               - level
   *               - type
   *               - subject_ids
   *               - answers
   *             properties:
   *               content:
   *                 type: string
   *                 example: Ai là tác giả của Bình Ngô Đại Cáo?
   *               level:
   *                 type: integer
   *                 enum: [1, 2, 3, 4]
   *                 description: 1 (Dễ), 2 (Trung bình), 3 (Khó), 4 (Cực khó)
   *                 example: 1
   *               type:
   *                 type: integer
   *                 enum: [1, 2]
   *                 description: 1 (Single choice), 2 (Multi choice)
   *                 example: 1
   *               subject_ids:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                 example: ["uuid-mon-lich-su", "uuid-mon-van-hoc"]
   *               answers:
   *                 type: array
   *                 minItems: 2
   *                 items:
   *                   type: object
   *                   required:
   *                     - content
   *                     - is_true
   *                   properties:
   *                     content:
   *                       type: string
   *                     is_true:
   *                       type: boolean
   *                 example:
   *                   - content: Nguyễn Trãi
   *                     is_true: true
   *                   - content: Nguyễn Du
   *                     is_true: false
   *                   - content: Trần Hưng Đạo
   *                     is_true: false
   *                   - content: Lê Lợi
   *                     is_true: false
   *     responses:
   *       201:
   *         description: Question created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Question created successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     content:
   *                       type: string
   *                     level:
   *                       type: integer
   *                     type:
   *                       type: integer
   *                     teacher_id:
   *                       type: string
   *                       format: uuid
   *                     created_at:
   *                       type: string
   *                       format: date-time
   *                     updated_at:
   *                       type: string
   *                       format: date-time
   *                     answers:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             format: uuid
   *                           content:
   *                             type: string
   *                           is_true:
   *                             type: boolean
   *                     subject_ids:
   *                       type: array
   *                       items:
   *                         type: string
   *                         format: uuid
   *       400:
   *         description: Bad request - Invalid input data
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Subject not found
   */
  async createQuestion(req, res) {
    try {
      // Get teacher_id from header
      const teacher_id = req.headers['x-teacher-id'];
      
      // Validate teacher_id from header
      if (!teacher_id || teacher_id.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'X-Teacher-ID header is required',
          data: null
        });
      }

      const { content, level, type, subject_ids, answers } = req.body;

      // Validate required fields
      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Question content is required',
          data: null
        });
      }

      if (!level) {
        return res.status(400).json({
          success: false,
          message: 'Question level is required',
          data: null
        });
      }

      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Question type is required',
          data: null
        });
      }

      if (!subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one subject ID is required',
          data: null
        });
      }

      if (!answers || !Array.isArray(answers) || answers.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 answers are required',
          data: null
        });
      }

      // Validate each answer has required fields
      for (const answer of answers) {
        if (!answer.content || answer.content.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'All answers must have content',
            data: null
          });
        }
        if (typeof answer.is_true !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'All answers must have is_true field (boolean)',
            data: null
          });
        }
      }

      // Create question
      const question = await questionService.createQuestion({
        content: content.trim(),
        level: parseInt(level),
        type: parseInt(type),
        teacher_id: teacher_id.trim(),
        subject_ids,
        answers
      });

      return res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: question
      });
    } catch (error) {
      console.error('Error in createQuestion:', error);

      // Handle validation errors
      if (error.code === 'INVALID_LEVEL') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      if (error.code === 'INVALID_TYPE') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      if (error.code === 'INVALID_ANSWERS') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      if (error.code === 'NO_CORRECT_ANSWER') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      if (error.code === 'MULTIPLE_CORRECT_ANSWERS') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      if (error.code === 'NO_SUBJECTS') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      if (error.code === 'SUBJECT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create question',
        data: null
      });
    }
  }

  /**
   * Get questions for a teacher
   * @swagger
   * /api/questions:
   *   get:
   *     summary: Get list of questions created by the teacher
   *     tags: [Questions]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: X-Teacher-ID
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Teacher ID from gateway authentication
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for question content
   *         example: Bình Ngô
   *       - in: query
   *         name: subject_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by subject ID
   *       - in: query
   *         name: level
   *         schema:
   *           type: integer
   *           enum: [1, 2, 3, 4]
   *         description: Filter by question level
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *     responses:
   *       200:
   *         description: List of questions with pagination
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         format: uuid
   *                       content:
   *                         type: string
   *                       level:
   *                         type: integer
   *                       type:
   *                         type: integer
   *                       teacher_id:
   *                         type: string
   *                         format: uuid
   *                       created_at:
   *                         type: string
   *                         format: date-time
   *                       updated_at:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     currentPage:
   *                       type: integer
   *                     itemsPerPage:
   *                       type: integer
   *                     totalItems:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: Unauthorized - Missing X-Teacher-ID header
   */
  async getQuestions(req, res) {
    try {
      // Get teacher_id from header
      const teacher_id = req.headers['x-teacher-id'];
      
      // Validate teacher_id from header
      if (!teacher_id || teacher_id.trim() === '') {
        return res.status(401).json({
          statusCode: 401,
          message: 'X-Teacher-ID header is missing',
          error: 'Unauthorized'
        });
      }

      const { search, subject_id, level, page, limit } = req.query;

      // Get questions
      const result = await questionService.getQuestions(teacher_id.trim(), {
        search: search || '',
        subject_id: subject_id || '',
        level: level || '',
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getQuestions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve questions',
        data: null
      });
    }
  }

  /**
   * Get question by ID
   * @swagger
   * /api/questions/{id}:
   *   get:
   *     summary: Get question details by ID
   *     tags: [Questions]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: X-Teacher-ID
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Teacher ID from gateway authentication
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Question ID
   *     responses:
   *       200:
   *         description: Question details with answers
   *       401:
   *         description: Unauthorized - Missing X-Teacher-ID header
   *       403:
   *         description: Forbidden - Question does not belong to teacher
   *       404:
   *         description: Question not found
   */
  async getQuestionById(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];
      
      if (!teacher_id || teacher_id.trim() === '') {
        return res.status(401).json({
          statusCode: 401,
          message: 'X-Teacher-ID header is missing',
          error: 'Unauthorized'
        });
      }

      const { id } = req.params;

      const question = await questionService.getQuestionById(id, teacher_id.trim());

      return res.status(200).json(question);
    } catch (error) {
      console.error('Error in getQuestionById:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
          error: 'Not Found'
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
          error: 'Forbidden'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve question',
        data: null
      });
    }
  }

  /**
   * Update question
   * @swagger
   * /api/questions/{id}:
   *   patch:
   *     summary: Update a question
   *     tags: [Questions]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: X-Teacher-ID
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Teacher ID from gateway authentication
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Question ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               content:
   *                 type: string
   *                 example: Tác phẩm Bình Ngô Đại Cáo do ai sáng tác?
   *               level:
   *                 type: integer
   *                 enum: [1, 2, 3, 4]
   *               type:
   *                 type: integer
   *                 enum: [1, 2]
   *               answers:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     content:
   *                       type: string
   *                     is_true:
   *                       type: boolean
   *     responses:
   *       200:
   *         description: Question updated successfully
   *       400:
   *         description: Bad request - Invalid data
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Question not found
   */
  async updateQuestion(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];
      
      if (!teacher_id || teacher_id.trim() === '') {
        return res.status(401).json({
          statusCode: 401,
          message: 'X-Teacher-ID header is missing',
          error: 'Unauthorized'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Validate if answers provided
      if (updateData.answers) {
        if (!Array.isArray(updateData.answers)) {
          return res.status(400).json({
            success: false,
            message: 'Answers must be an array',
            data: null
          });
        }

        for (const answer of updateData.answers) {
          if (!answer.content || typeof answer.is_true !== 'boolean') {
            return res.status(400).json({
              success: false,
              message: 'Each answer must have content and is_true fields',
              data: null
            });
          }
        }
      }

      const updatedQuestion = await questionService.updateQuestion(
        id,
        teacher_id.trim(),
        updateData
      );

      return res.status(200).json(updatedQuestion);
    } catch (error) {
      console.error('Error in updateQuestion:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
          error: 'Not Found'
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
          error: 'Forbidden'
        });
      }

      if (error.code === 'INVALID_LEVEL' || error.code === 'INVALID_TYPE' ||
          error.code === 'INVALID_ANSWERS' || error.code === 'NO_CORRECT_ANSWER' ||
          error.code === 'MULTIPLE_CORRECT_ANSWERS') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update question',
        data: null
      });
    }
  }

  /**
   * Delete question
   * @swagger
   * /api/questions/{id}:
   *   delete:
   *     summary: Delete a question
   *     tags: [Questions]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: X-Teacher-ID
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Teacher ID from gateway authentication
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Question ID
   *     responses:
   *       204:
   *         description: Question deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Question not found
   */
  async deleteQuestion(req, res) {
    try {
      const teacher_id = req.headers['x-teacher-id'];
      
      if (!teacher_id || teacher_id.trim() === '') {
        return res.status(401).json({
          statusCode: 401,
          message: 'X-Teacher-ID header is missing',
          error: 'Unauthorized'
        });
      }

      const { id } = req.params;

      await questionService.deleteQuestion(id, teacher_id.trim());

      return res.status(204).send();
    } catch (error) {
      console.error('Error in deleteQuestion:', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
          error: 'Not Found'
        });
      }

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
          error: 'Forbidden'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to delete question',
        data: null
      });
    }
  }
}

module.exports = new QuestionController();
