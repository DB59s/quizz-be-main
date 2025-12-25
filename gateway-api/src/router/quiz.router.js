const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { 
  createQuiz, 
  getQuizzes, 
  getQuizById, 
  updateQuiz, 
  deleteQuiz,
  getQuizForStudent,
  createQuizFromAI
} = require('../controller/quiz.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quizzes
 *   description: Quiz management endpoints (Teacher only)
 */

/**
 * @swagger
 * /api/v1/quizzes:
 *   post:
 *     summary: Create a new quiz with questions (Teacher only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
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
 *                 description: Quiz name
 *                 example: Math Quiz 1
 *               description:
 *                 type: string
 *                 description: Quiz description
 *                 example: Quiz about basic math operations
 *               question_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of question IDs to include in the quiz
 *                 example: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
 *     responses:
 *       201:
 *         description: Quiz created successfully
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
 *                   example: Quiz created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                       format: uuid
 *                     question_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, requireRoleOnly(['teacher']), createQuiz);

/**
 * @swagger
 * /api/v1/quizzes/from-ai:
 *   post:
 *     summary: Create quiz from AI-generated questions (Teacher only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name_quiz
 *               - subject_id_question
 *               - questions
 *             properties:
 *               name_quiz:
 *                 type: string
 *                 description: Quiz name
 *                 example: "Kiểm tra Địa lý Việt Nam"
 *               des_quiz:
 *                 type: string
 *                 description: Quiz description
 *                 example: "Bài kiểm tra về địa lý Việt Nam"
 *               total_time:
 *                 type: integer
 *                 description: Total time in minutes (optional)
 *                 example: 30
 *               subject_id_question:
 *                 type: string
 *                 description: Subject ID for all questions
 *                 example: "uuid-subject-id"
 *               questions:
 *                 type: array
 *                 description: Array of AI-generated questions
 *                 items:
 *                   type: object
 *                   required:
 *                     - content
 *                     - level
 *                     - type
 *                     - answers
 *                   properties:
 *                     content:
 *                       type: string
 *                       example: "Việt Nam thuộc khu vực nào trên thế giới?"
 *                     level:
 *                       type: integer
 *                       enum: [1, 2, 3, 4]
 *                       description: "1=EASY, 2=MEDIUM, 3=HARD, 4=VERY_HARD"
 *                       example: 1
 *                     type:
 *                       type: string
 *                       enum: ["1", "2"]
 *                       description: "1=single answer, 2=multiple answers"
 *                       example: "1"
 *                     answers:
 *                       type: array
 *                       minItems: 2
 *                       items:
 *                         type: object
 *                         required:
 *                           - content
 *                           - is_true
 *                         properties:
 *                           content:
 *                             type: string
 *                             example: "Đông Nam Á"
 *                           is_true:
 *                             type: boolean
 *                             example: true
 *     responses:
 *       201:
 *         description: Quiz created successfully
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
 *                   example: Quiz created successfully from AI-generated questions
 *                 data:
 *                   type: object
 *                   properties:
 *                     quiz:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         total_time:
 *                           type: integer
 *                     questions_created:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Bad request - validation failed
 *       403:
 *         description: Forbidden - only teachers can create quizzes
 *       500:
 *         description: Internal server error
 */
router.post('/from-ai', verifyToken, requireRoleOnly(['teacher']), createQuizFromAI);

/**
 * @swagger
 * /api/v1/quizzes:
 *   get:
 *     summary: Get list of quizzes created by the teacher (Teacher only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: List of quizzes with pagination
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
 *                   example: Quizzes retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, requireRoleOnly(['teacher']), getQuizzes);

/**
 * @swagger
 * /api/v1/quizzes/{id}:
 *   get:
 *     summary: Get quiz details by ID with full question data (Teacher only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Quiz details with questions
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
 *                   example: Quiz retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                       format: uuid
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           content:
 *                             type: string
 *                           level:
 *                             type: integer
 *                           type:
 *                             type: integer
 *                           answers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 content:
 *                                   type: string
 *                                 is_true:
 *                                   type: boolean
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quiz does not belong to teacher
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, requireRoleOnly(['teacher']), getQuizById);

/**
 * @swagger
 * /api/v1/quizzes/{id}:
 *   put:
 *     summary: Update a quiz (Teacher only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated quiz name
 *                 example: Math Quiz 1 (Updated)
 *               description:
 *                 type: string
 *                 description: Updated quiz description
 *                 example: Updated quiz about advanced math
 *               question_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Updated array of question IDs
 *     responses:
 *       200:
 *         description: Quiz updated successfully
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
 *                   example: Quiz updated successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quiz does not belong to teacher
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, requireRoleOnly(['teacher']), updateQuiz);

/**
 * @swagger
 * /api/v1/quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz (Teacher only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
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
 *                   example: Quiz deleted successfully
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quiz does not belong to teacher
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, requireRoleOnly(['teacher']), deleteQuiz);

/**
 * @swagger
 * /api/v1/quizzes/{id}/student:
 *   get:
 *     summary: Get quiz for student with authorization check (Student only)
 *     tags: [Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Quiz details with questions for student
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
 *                   example: Quiz retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                       format: uuid
 *                     class_id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           content:
 *                             type: string
 *                           level:
 *                             type: integer
 *                           type:
 *                             type: integer
 *                           answers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 content:
 *                                   type: string
 *                                 is_true:
 *                                   type: boolean
 *       400:
 *         description: Bad request - Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student not in class or quiz not available
 *       404:
 *         description: Quiz not found or not assigned to any class
 *       500:
 *         description: Internal server error
 */
router.get('/:id/student', verifyToken, requireRoleOnly(['student']), getQuizForStudent);

module.exports = router;
