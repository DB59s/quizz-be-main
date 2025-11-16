const express = require('express');
const geminiController = require('../controller/gemini.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { uploadPDF } = require('../middleware/upload.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gemini AI
 *   description: AI-powered content generation and quiz creation
 */

/**
 * @swagger
 * /api/v1/gemini/generate-quiz:
 *   post:
 *     summary: Generate quiz questions from PDF file - Async (Teachers only)
 *     description: Starts quiz generation and returns a job_id immediately. Use the quiz-status endpoint to check progress.
 *     tags: [Gemini AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing exam questions or study material
 *     responses:
 *       202:
 *         description: Quiz generation started - returns job_id
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
 *                   example: Quiz generation started. Use the job_id to check status.
 *                 data:
 *                   type: object
 *                   properties:
 *                     job_id:
 *                       type: string
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     status:
 *                       type: string
 *                       example: "processing"
 *                     check_status_url:
 *                       type: string
 *                       example: "/api/v1/gemini/quiz-status/550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Bad request - missing file or invalid file type
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - only teachers can access this endpoint
 *       500:
 *         description: Internal server error
 */
router.post('/generate-quiz', verifyToken, requireRoleOnly(['teacher']), uploadPDF.single('file'), geminiController.generateQuiz);

/**
 * @swagger
 * /api/v1/gemini/quiz-status/{jobId}:
 *   get:
 *     summary: Get quiz generation job status (Teachers only)
 *     description: Check the status of an async quiz generation job
 *     tags: [Gemini AI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID returned from generate-quiz endpoint
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     job_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                     progress:
 *                       type: string
 *                       example: "Processing chunk 2/3 (questions 41-80)"
 *                     total_questions:
 *                       type: integer
 *                     processed_questions:
 *                       type: integer
 *                     current_chunk:
 *                       type: integer
 *                     total_chunks:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                       description: Only present when completed
 *                     questions:
 *                       type: array
 *                       description: Only present when completed
 *                     error:
 *                       type: string
 *                       description: Only present when failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only teachers can access
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get('/quiz-status/:jobId', verifyToken, requireRoleOnly(['teacher']), geminiController.getQuizStatus);

/**
 * @swagger
 * /api/v1/gemini/generate:
 *   post:
 *     summary: Generate content from text prompt
 *     tags: [Gemini AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Text prompt for content generation
 *                 example: "Explain quantum computing in simple terms"
 *     responses:
 *       200:
 *         description: Content generated successfully
 *       400:
 *         description: Bad request - missing prompt
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/generate', verifyToken, geminiController.generateContent);

/**
 * @swagger
 * /api/v1/gemini/analyze-file:
 *   post:
 *     summary: Analyze PDF file with custom prompt
 *     tags: [Gemini AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - prompt
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to analyze
 *               prompt:
 *                 type: string
 *                 description: Custom prompt for file analysis
 *                 example: "Summarize the main points of this document"
 *     responses:
 *       200:
 *         description: File analyzed successfully
 *       400:
 *         description: Bad request - missing file or prompt
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/analyze-file', verifyToken, uploadPDF.single('file'), geminiController.analyzeFile);

module.exports = router;
