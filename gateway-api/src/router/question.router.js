const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { 
  createQuestion, 
  getQuestions, 
  getQuestionById, 
  updateQuestion, 
  deleteQuestion 
} = require('../controller/question.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management endpoints (Teacher only)
 */

/**
 * @swagger
 * /api/v1/questions:
 *   post:
 *     summary: Create a new question with answers and subject associations (Teacher only)
 *     tags: [Questions]
 *     security:
 *       - BearerAuth: []
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
 *                 description: Question content
 *                 example: Ai là tác giả của Bình Ngô Đại Cáo?
 *               level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 description: Question difficulty level (1=Dễ, 2=Trung bình, 3=Khó, 4=Cực khó)
 *                 example: 1
 *               type:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: Question type (1=Single choice, 2=Multi choice)
 *                 example: 1
 *               subject_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of subject IDs
 *                 example: ["550e8400-e29b-41d4-a716-446655440000"]
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
 *                       description: Answer content
 *                     is_true:
 *                       type: boolean
 *                       description: Whether this is a correct answer
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
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, requireRoleOnly(['teacher']), createQuestion);

/**
 * @swagger
 * /api/v1/questions:
 *   get:
 *     summary: Get list of questions created by the teacher (Teacher only)
 *     tags: [Questions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *         description: Filter by question level
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         example: 10
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
 *                       subjects:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, requireRoleOnly(['teacher']), getQuestions);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   get:
 *     summary: Get question details by ID (Teacher only)
 *     tags: [Questions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Question details with answers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 content:
 *                   type: string
 *                 level:
 *                   type: integer
 *                 type:
 *                   type: integer
 *                 teacher_id:
 *                   type: string
 *                   format: uuid
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 answers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       content:
 *                         type: string
 *                       is_true:
 *                         type: boolean
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Question does not belong to teacher
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, requireRoleOnly(['teacher']), getQuestionById);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   patch:
 *     summary: Update a question (Teacher only)
 *     tags: [Questions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated question content
 *                 example: Ai là tác giả của Bình Ngô Đại Cáo? (Updated)
 *               level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 description: Updated difficulty level
 *                 example: 2
 *               type:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: Updated question type
 *                 example: 1
 *               subject_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Updated array of subject IDs
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
 *                 description: Updated answers array
 *     responses:
 *       200:
 *         description: Question updated successfully
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
 *                   example: Question updated successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Question does not belong to teacher
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', verifyToken, requireRoleOnly(['teacher']), updateQuestion);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   delete:
 *     summary: Delete a question (Teacher only)
 *     tags: [Questions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       204:
 *         description: Question deleted successfully (No Content)
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Question does not belong to teacher
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, requireRoleOnly(['teacher']), deleteQuestion);

module.exports = router;
