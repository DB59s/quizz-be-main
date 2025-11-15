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
 *     summary: Generate quiz questions from PDF file
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
 *       200:
 *         description: Quiz questions generated successfully
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
 *                   example: Quiz questions generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           content:
 *                             type: string
 *                             example: "What is the capital of France?"
 *                           level:
 *                             type: integer
 *                             enum: [1, 2, 3, 4]
 *                             example: 1
 *                           type:
 *                             type: string
 *                             enum: ["1", "2"]
 *                             example: "1"
 *                           answers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 content:
 *                                   type: string
 *                                   example: "Paris"
 *                                 is_true:
 *                                   type: boolean
 *                                   example: true
 *       400:
 *         description: Bad request - missing file or invalid file type
 *       500:
 *         description: Internal server error
 */
router.post('/generate-quiz', uploadPDF.single('file'), geminiController.generateQuiz);

/**
 * @swagger
 * /api/v1/gemini/quiz/chunked:
 *   post:
 *     summary: Start chunked quiz generation from PDF (async processing)
 *     description: |
 *       Start asynchronous quiz generation that processes large PDFs in chunks.
 *       Returns immediately with a session ID that can be used to poll for progress.
 *       Recommended for PDFs with 30+ questions.
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
 *               questionsPerChunk:
 *                 type: integer
 *                 default: 15
 *                 description: Number of questions to extract per chunk
 *                 example: 15
 *     responses:
 *       202:
 *         description: Quiz generation started successfully
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
 *                   example: Quiz generation started. Poll /api/v1/gemini/quiz/session/:sessionId to get progress.
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     status:
 *                       type: string
 *                       example: "processing"
 *                     pollUrl:
 *                       type: string
 *                       example: "/api/v1/gemini/quiz/session/550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Bad request - missing file
 *       500:
 *         description: Internal server error
 */
router.post('/quiz/chunked', uploadPDF.single('file'), geminiController.startChunkedQuizGeneration);

/**
 * @swagger
 * /api/v1/gemini/quiz/session/{sessionId}:
 *   get:
 *     summary: Get chunked quiz generation status and results
 *     description: |
 *       Poll this endpoint to get the current status of quiz generation.
 *       Status can be: 'processing', 'completed', or 'error'.
 *       Questions are accumulated as they are processed.
 *     tags: [Gemini]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID from the chunked generation start response
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
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
 *                   example: Session status retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [processing, completed, error]
 *                       example: "processing"
 *                     currentChunk:
 *                       type: integer
 *                       example: 2
 *                     totalChunks:
 *                       type: integer
 *                       nullable: true
 *                       example: 3
 *                     totalQuestions:
 *                       type: integer
 *                       example: 30
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     error:
 *                       type: string
 *                       nullable: true
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Internal server error
 */
router.get('/quiz/session/:sessionId', geminiController.getChunkedQuizStatus);

/**
 * @swagger
 * /api/v1/gemini/quiz/session/{sessionId}:
 *   delete:
 *     summary: Delete session and cleanup resources
 *     tags: [Gemini]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID to delete
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.delete('/quiz/session/:sessionId', geminiController.deleteSession);

module.exports = router;
