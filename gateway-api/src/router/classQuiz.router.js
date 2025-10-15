const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const {
  assignQuizToClass,
  updateClassQuiz,
  removeQuizFromClass,
  getClassQuizzes,
  getAvailableQuizzesForStudent,
  getClassQuizzesForStudent,
  getClassQuizById
} = require('../controller/classQuiz.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Class Quizzes
 *   description: Quiz assignment to classes management
 */

/**
 * @swagger
 * /api/v1/class-quizzes:
 *   post:
 *     summary: Assign quiz to a class (Teacher only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quiz_id
 *               - class_id
 *               - start_time
 *               - end_time
 *             properties:
 *               quiz_id:
 *                 type: string
 *                 format: uuid
 *                 description: Quiz ID to assign
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               class_id:
 *                 type: string
 *                 description: Class ID
 *                 example: class_123
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Quiz start time
 *                 example: 2025-10-15T08:00:00Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Quiz end time
 *                 example: 2025-10-15T10:00:00Z
 *     responses:
 *       201:
 *         description: Quiz assigned to class successfully
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
 *                   example: Quiz assigned to class successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     quiz_id:
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
 *                     quiz_name:
 *                       type: string
 *                     quiz_description:
 *                       type: string
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Quiz or class not found
 *       409:
 *         description: Quiz already assigned to this class
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, requireRoleOnly(['teacher']), assignQuizToClass);

/**
 * @swagger
 * /api/v1/class-quizzes/{id}:
 *   put:
 *     summary: Update class quiz time (Teacher only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: New start time
 *                 example: 2025-10-15T09:00:00Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: New end time
 *                 example: 2025-10-15T11:00:00Z
 *     responses:
 *       200:
 *         description: Class quiz updated successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class quiz not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, requireRoleOnly(['teacher']), updateClassQuiz);

/**
 * @swagger
 * /api/v1/class-quizzes/{id}:
 *   delete:
 *     summary: Remove quiz from class (Teacher only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Quiz removed from class successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class quiz not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, requireRoleOnly(['teacher']), removeQuizFromClass);

/**
 * @swagger
 * /api/v1/class-quizzes/class/{class_id}:
 *   get:
 *     summary: Get all quizzes for a class (Teacher only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *         example: class_123
 *     responses:
 *       200:
 *         description: List of quizzes assigned to the class
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
 *                   example: Class quizzes retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       quiz_id:
 *                         type: string
 *                         format: uuid
 *                       class_id:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       quiz:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       status:
 *                         type: string
 *                         enum: [upcoming, active, ended]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       500:
 *         description: Internal server error
 */
router.get('/class/:class_id', verifyToken, requireRoleOnly(['teacher']), getClassQuizzes);

/**
 * @swagger
 * /api/v1/class-quizzes/class/{class_id}/student/all:
 *   get:
 *     summary: Get all quizzes for student in a class with pagination (Student only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *         example: class_123
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
 *         description: List of all quizzes with pagination (cached for 1 minute)
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
 *                   example: Class quizzes retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       quiz_id:
 *                         type: string
 *                         format: uuid
 *                       class_id:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [upcoming, active, ended]
 *                       quiz:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     items_per_page:
 *                       type: integer
 *                     total_items:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                 cached:
 *                   type: boolean
 *                   description: Whether data is from cache
 *                 cache_expires_in:
 *                   type: integer
 *                   description: Seconds until cache expires (only if cached=true)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student not enrolled in class
 *       500:
 *         description: Internal server error
 */
router.get('/class/:class_id/student/all', verifyToken, requireRoleOnly(['student']), getClassQuizzesForStudent);

/**
 * @swagger
 * /api/v1/class-quizzes/class/{class_id}/student:
 *   get:
 *     summary: Get available quizzes for student in a class (Student only - Active only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *         example: class_123
 *     responses:
 *       200:
 *         description: List of available quizzes (currently active)
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
 *                   example: Available quizzes retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       quiz_id:
 *                         type: string
 *                         format: uuid
 *                       class_id:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       quiz:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student not enrolled in class
 *       500:
 *         description: Internal server error
 */
router.get('/class/:class_id/student', verifyToken, requireRoleOnly(['student']), getAvailableQuizzesForStudent);

/**
 * @swagger
 * /api/v1/class-quizzes/{id}:
 *   get:
 *     summary: Get class quiz details by ID (Teacher only)
 *     tags: [Class Quizzes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class quiz ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Class quiz details
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
 *                   example: Class quiz retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     quiz_id:
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
 *                     quiz:
 *                       type: object
 *                     status:
 *                       type: string
 *                       enum: [upcoming, active, ended]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class quiz not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, requireRoleOnly(['teacher']), getClassQuizById);

module.exports = router;
