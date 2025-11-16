const express = require('express');
const geminiController = require('../controller/gemini.controller');
const { uploadPDF } = require('../middleware/upload.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/gemini/generate:
 *   post:
 *     summary: Generate content from text prompt
 *     tags: [Gemini]
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
 *                   example: Content generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *       400:
 *         description: Bad request - missing prompt
 *       500:
 *         description: Internal server error
 */
router.post('/generate', geminiController.generateContent);

/**
 * @swagger
 * /api/v1/gemini/analyze-file:
 *   post:
 *     summary: Analyze PDF file with custom prompt
 *     tags: [Gemini]
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
 *                   example: File analyzed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *       400:
 *         description: Bad request - missing file or prompt
 *       500:
 *         description: Internal server error
 */
router.post('/analyze-file', uploadPDF.single('file'), geminiController.analyzeFile);

/**
 * @swagger
 * /api/v1/gemini/generate-quiz:
 *   post:
 *     summary: Generate quiz questions from PDF file (Async - returns job_id)
 *     tags: [Gemini]
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
 *                 description: PDF file containing exam questions
 *     responses:
 *       202:
 *         description: Quiz generation started - use job_id to check status
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
 *       500:
 *         description: Internal server error
 */
router.post('/generate-quiz', uploadPDF.single('file'), geminiController.generateQuiz);

/**
 * @swagger
 * /api/v1/gemini/quiz-status/{jobId}:
 *   get:
 *     summary: Get quiz generation job status
 *     tags: [Gemini]
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
 *                   example: Job status retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     job_id:
 *                       type: string
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                       example: "processing"
 *                     progress:
 *                       type: string
 *                       example: "Processing chunk 2/3 (questions 41-80)"
 *                     total_questions:
 *                       type: integer
 *                       example: 97
 *                     processed_questions:
 *                       type: integer
 *                       example: 40
 *                     current_chunk:
 *                       type: integer
 *                       example: 2
 *                     total_chunks:
 *                       type: integer
 *                       example: 3
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     started_at:
 *                       type: string
 *                       format: date-time
 *                     completed_at:
 *                       type: string
 *                       format: date-time
 *                     total:
 *                       type: integer
 *                       description: Only present when status is completed
 *                       example: 97
 *                     questions:
 *                       type: array
 *                       description: Only present when status is completed
 *                       items:
 *                         type: object
 *                     error:
 *                       type: string
 *                       description: Only present when status is failed
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get('/quiz-status/:jobId', geminiController.getQuizStatus);

module.exports = router;
