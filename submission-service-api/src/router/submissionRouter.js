const express = require('express');
const { submissionController } = require('../controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Submission management endpoints
 */

/**
 * @swagger
 * /submissions:
 *   get:
 *     summary: Get all submissions
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/', submissionController.getAllSubmissions.bind(submissionController));

/**
 * @swagger
 * /submissions/student/{studentId}:
 *   get:
 *     summary: Get submissions by student ID
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/student/:studentId', submissionController.getSubmissionsByStudentId.bind(submissionController));

/**
 * @swagger
 * /submissions/quiz-class/{quizzClassId}:
 *   get:
 *     summary: Get submissions by quiz class ID
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizzClassId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quiz Class ID
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/quiz-class/:quizzClassId', submissionController.getSubmissionsByQuizClassId.bind(submissionController));

/**
 * @swagger
 * /submissions/{id}:
 *   get:
 *     summary: Get submission by ID
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission not found
 */
router.get('/:id', submissionController.getSubmissionById.bind(submissionController));

/**
 * @swagger
 * /submissions:
 *   post:
 *     summary: Create a new submission
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
 *               - student_id
 *               - quizz_class_id
 *               - submission_time
 *             properties:
 *               score:
 *                 type: number
 *                 format: float
 *                 example: 85.5
 *               submission_time:
 *                 type: string
 *                 format: date
 *                 example: "2024-10-22"
 *               total_time:
 *                 type: integer
 *                 example: 1800
 *               n_total_true:
 *                 type: integer
 *                 example: 17
 *               student_id:
 *                 type: string
 *                 example: "student123"
 *               quizz_class_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     answer_id:
 *                       type: string
 *                       format: uuid
 *                     question_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Submission created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', submissionController.createSubmission.bind(submissionController));

/**
 * @swagger
 * /submissions/{id}:
 *   put:
 *     summary: Update submission by ID
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 format: float
 *               total_time:
 *                 type: integer
 *               n_total_true:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission not found
 */
router.put('/:id', submissionController.updateSubmission.bind(submissionController));

/**
 * @swagger
 * /submissions/{id}:
 *   delete:
 *     summary: Delete submission by ID
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission not found
 */
router.delete('/:id', submissionController.deleteSubmission.bind(submissionController));

module.exports = router;
