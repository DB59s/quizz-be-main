const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const {
  createSubmission,
  gradeSubmission,
  getAllSubmissions,
  getSubmissionsByClassForStudent,
  getSubmissionResult,
  getSubmissionsByClassQuiz,
  getSubmissionResultForTeacher,
  getQuizStatistics
} = require('../controller/submission.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Student submission endpoints
 */

/**
 * @swagger
 * /api/v1/submissions:
 *   get:
 *     summary: Get all submissions (Admin only)
 *     description: Retrieve all submissions from all students
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all submissions
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
 *                   example: "Submissions retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       submission_id:
 *                         type: string
 *                       student_id:
 *                         type: string
 *                       class_quiz_id:
 *                         type: string
 *                       submission_time:
 *                         type: string
 *                         format: date-time
 *                       total_time:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       score:
 *                         type: number
 *                       graded:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *   post:
 *     summary: Submit quiz answers (Student only)
 *     description: Student submits their answers for a specific ClassQuiz
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_quiz_id
 *               - answers
 *             properties:
 *               class_quiz_id:
 *                 type: string
 *                 description: ID of the ClassQuiz record
 *               answers:
 *                 type: array
 *                 description: Array of student answers
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: string
 *                       description: Question ID
 *                     selected_answer_ids:
 *                       type: array
 *                       description: Selected answer IDs
 *                       items:
 *                         type: string
 *               total_time:
 *                 type: integer
 *                 description: Time taken in seconds
 *     responses:
 *       201:
 *         description: Submission created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Submission already exists
 */
router.get('/', verifyToken, requireRoleOnly(['admin']), getAllSubmissions);
router.post('/', verifyToken, requireRoleOnly(['student']), createSubmission);

/**
 * @swagger
 * /api/v1/submissions/student/class/{class_id}:
 *   get:
 *     summary: Get submissions by class for student
 *     description: Retrieve all submissions of a student in a specific class
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the class
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *       403:
 *         description: Forbidden - Student not enrolled in class
 *       404:
 *         description: Class not found
 */
router.get('/student/class/:class_id', verifyToken, requireRoleOnly(['student']), getSubmissionsByClassForStudent);

/**
 * @swagger
 * /api/v1/submissions/{submission_id}/result:
 *   get:
 *     summary: Get submission result for student
 *     description: Retrieve detailed result of a submission for a student
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission result retrieved successfully
 *       403:
 *         description: Forbidden - Submission does not belong to student
 *       404:
 *         description: Submission not found
 */
router.get('/:submission_id/result', verifyToken, requireRoleOnly(['student']), getSubmissionResult);

/**
 * @swagger
 * /api/v1/submissions/class-quiz/{class_quiz_id}:
 *   get:
 *     summary: Get submissions by class quiz for teacher
 *     description: Retrieve all submissions for a specific class quiz
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_quiz_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Submissions retrieved successfully
 *       403:
 *         description: Forbidden - Teacher does not own this quiz
 *       404:
 *         description: ClassQuiz not found
 */
router.get('/class-quiz/:class_quiz_id', verifyToken, requireRoleOnly(['teacher']), getSubmissionsByClassQuiz);

/**
 * @swagger
 * /api/v1/submissions/{submission_id}/teacher:
 *   get:
 *     summary: Get submission result for teacher
 *     description: Retrieve detailed result of a submission for a teacher
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission result retrieved successfully
 *       403:
 *         description: Forbidden - Teacher does not own this quiz
 *       404:
 *         description: Submission not found
 */
router.get('/:submission_id/teacher', verifyToken, requireRoleOnly(['teacher']), getSubmissionResultForTeacher);

/**
 * @swagger
 * /api/v1/submissions/class-quiz/{class_quiz_id}/statistics:
 *   get:
 *     summary: Get quiz statistics for teacher
 *     description: Retrieve statistics for a specific class quiz
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_quiz_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quiz statistics retrieved successfully
 *       403:
 *         description: Forbidden - Teacher does not own this quiz
 *       404:
 *         description: ClassQuiz not found
 */
router.get('/class-quiz/:class_quiz_id/statistics', verifyToken, requireRoleOnly(['teacher']), getQuizStatistics);

/**
 * @swagger
 * /api/v1/submissions/{submission_id}/grade:
 *   post:
 *     summary: Grade a submission (Admin/Internal only)
 *     description: Manually trigger grading for a submission. This is typically used for re-grading or when auto-grading fails.
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the submission to grade
 *         example: "880e8400-e29b-41d4-a716-446655440006"
 *     responses:
 *       200:
 *         description: Submission graded successfully
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
 *                   example: "Submission graded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     submission_id:
 *                       type: string
 *                       format: uuid
 *                     student_id:
 *                       type: string
 *                     class_quiz_id:
 *                       type: string
 *                       format: uuid
 *                     score:
 *                       type: number
 *                       example: 8
 *                     max_score:
 *                       type: number
 *                       example: 10
 *                     n_total_true:
 *                       type: integer
 *                       example: 8
 *                     total_questions:
 *                       type: integer
 *                       example: 10
 *                     status:
 *                       type: string
 *                       example: "graded"
 *       400:
 *         description: Bad request
 *       404:
 *         description: Submission not found
 *       409:
 *         description: Conflict - Submission has already been graded
 */
router.post('/:submission_id/grade', verifyToken, requireRoleOnly(['admin', 'teacher']), gradeSubmission);

module.exports = router;
