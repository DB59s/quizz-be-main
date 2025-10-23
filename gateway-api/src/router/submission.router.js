const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { 
  createSubmission,
  gradeSubmission
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
 *   post:
 *     summary: Submit quiz answers (Student only, Rate limited: 1 submission per 15 minutes per quiz)
 *     description: Student submits their answers for a specific ClassQuiz. The system validates enrollment, quiz timing, prevents duplicate submissions, and automatically grades the submission. Rate limited to 1 submission per 15 minutes per quiz.
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
 *                 format: uuid
 *                 description: ID of the ClassQuiz record
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               answers:
 *                 type: array
 *                 description: Array of student's answers
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_id
 *                     - selected_answer_ids
 *                   properties:
 *                     question_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the question
 *                       example: "660e8400-e29b-41d4-a716-446655440001"
 *                     selected_answer_ids:
 *                       type: array
 *                       description: Array of selected answer IDs (supports multiple choice)
 *                       items:
 *                         type: string
 *                         format: uuid
 *                       example: ["770e8400-e29b-41d4-a716-446655440002"]
 *               total_time:
 *                 type: integer
 *                 description: Time taken to complete quiz (in seconds)
 *                 example: 1150
 *           example:
 *             class_quiz_id: "550e8400-e29b-41d4-a716-446655440000"
 *             answers:
 *               - question_id: "660e8400-e29b-41d4-a716-446655440001"
 *                 selected_answer_ids: ["770e8400-e29b-41d4-a716-446655440002"]
 *               - question_id: "660e8400-e29b-41d4-a716-446655440003"
 *                 selected_answer_ids: ["770e8400-e29b-41d4-a716-446655440004", "770e8400-e29b-41d4-a716-446655440005"]
 *             total_time: 1150
 *     responses:
 *       201:
 *         description: Submission created and graded successfully
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
 *                   example: "Submission created and graded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     submission_id:
 *                       type: string
 *                       format: uuid
 *                     class_quiz_id:
 *                       type: string
 *                       format: uuid
 *                     student_id:
 *                       type: string
 *                     submission_time:
 *                       type: string
 *                       format: date-time
 *                     total_time:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "graded"
 *                     answers_count:
 *                       type: integer
 *                     graded:
 *                       type: boolean
 *                       example: true
 *                     score:
 *                       type: number
 *                       example: 8
 *                     n_total_true:
 *                       type: integer
 *                       example: 8
 *       400:
 *         description: Bad request - Invalid data or quiz not available
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student not enrolled or ClassQuiz not found
 *       409:
 *         description: Conflict - Submission already exists for this quiz
 *       429:
 *         description: Too Many Requests - Rate limit exceeded (15 minutes cooldown)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You can only submit once every 15 minutes. Please wait 12 more minute(s)."
 *                 data:
 *                   type: object
 *                   properties:
 *                     remainingMinutes:
 *                       type: integer
 *                       example: 12
 */
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
