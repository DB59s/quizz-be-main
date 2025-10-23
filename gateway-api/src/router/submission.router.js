const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { 
  createSubmission,
  gradeSubmission,
  getAllSubmissions
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
