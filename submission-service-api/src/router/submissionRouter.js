const express = require('express');
const { submissionController } = require('../controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Student submission endpoints
 */

/**
 * @swagger
 * /submissions:
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
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Submit quiz answers (Student role required)
 *     description: Student submits their answers for a specific ClassQuiz. The system validates enrollment, quiz timing, prevents duplicate submissions, and automatically grades the submission.
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
 *         description: Submission created successfully
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
 *                   example: "Submission created successfully"
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
 *                       description: Status of submission (submitted or graded)
 *                     answers_count:
 *                       type: integer
 *                       description: Number of answers submitted
 *                     graded:
 *                       type: boolean
 *                       example: true
 *                       description: Whether the submission has been graded
 *                     score:
 *                       type: number
 *                       example: 8
 *                       description: Score achieved (only if graded=true)
 *                     n_total_true:
 *                       type: integer
 *                       example: 8
 *                       description: Number of correct answers (only if graded=true)
 *       400:
 *         description: Bad request - Invalid data or quiz not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Student ID not found in token
 *       403:
 *         description: Forbidden - Student not enrolled or ClassQuiz not found
 *       409:
 *         description: Conflict - Submission already exists for this quiz
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
 *                   example: "Submission already exists for this quiz"
 *                 data:
 *                   type: null
 */
router.get('/', submissionController.getAllSubmissions.bind(submissionController));
router.post('/', submissionController.createSubmission.bind(submissionController));

/**
 * @swagger
 * /submissions/{submission_id}/grade:
 *   post:
 *     summary: Grade a submission (Internal API)
 *     description: Automatically grade a submission by comparing student answers with correct answers from Question Service. This is typically called internally after submission creation or by a background job.
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
 *                       description: Total score achieved
 *                       example: 8
 *                     max_score:
 *                       type: number
 *                       description: Maximum possible score
 *                       example: 10
 *                     n_total_true:
 *                       type: integer
 *                       description: Number of correct answers
 *                       example: 8
 *                     total_questions:
 *                       type: integer
 *                       description: Total number of questions
 *                       example: 10
 *                     status:
 *                       type: string
 *                       example: "graded"
 *                     submission_time:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid submission or quiz has no questions
 *       404:
 *         description: Submission not found
 *       409:
 *         description: Conflict - Submission has already been graded
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
 *                   example: "Submission has already been graded"
 *                 data:
 *                   type: null
 */
router.post('/:submission_id/grade', submissionController.gradeSubmission.bind(submissionController));


module.exports = router;
