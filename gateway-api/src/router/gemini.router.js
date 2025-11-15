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
 *     summary: Generate quiz questions from PDF file (Teachers only)
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
 *                             description: "1=EASY, 2=MEDIUM, 3=HARD, 4=VERY_HARD"
 *                             example: 1
 *                           type:
 *                             type: string
 *                             enum: ["1", "2"]
 *                             description: "1=single answer, 2=multiple answers"
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
