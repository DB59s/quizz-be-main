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

module.exports = router;
