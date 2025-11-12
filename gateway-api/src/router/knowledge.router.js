const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const {
  getHealth,
  getStats,
  queryKnowledge,
  uploadKnowledge,
  deleteCollection,
  upload
} = require('../controller/knowledge.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Knowledge
 *   description: Knowledge base management endpoints (RAG System)
 */

/**
 * @swagger
 * /api/v1/knowledge/health:
 *   get:
 *     summary: Health check for knowledge service
 *     description: Check if knowledge service is running and healthy
 *     tags: [Knowledge]
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                   example: "Knowledge service is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     collection_name:
 *                       type: string
 *                     total_documents:
 *                       type: integer
 *                     model:
 *                       type: string
 *       503:
 *         description: Service unavailable
 */
router.get('/health', getHealth);

/**
 * @swagger
 * /api/v1/knowledge/stats:
 *   get:
 *     summary: Get knowledge base statistics
 *     description: Get statistics about the vector database
 *     tags: [Knowledge]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   example: "Statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     collection_name:
 *                       type: string
 *                     total_documents:
 *                       type: integer
 *                     metadata:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', verifyToken, getStats);

/**
 * @swagger
 * /api/v1/knowledge/query:
 *   post:
 *     summary: Query knowledge base
 *     description: Search for relevant information in the knowledge base using vector similarity
 *     tags: [Knowledge]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The question to search for
 *                 example: "Tiến trình trong hệ điều hành là gì?"
 *               top_k:
 *                 type: integer
 *                 description: Number of results to return
 *                 default: 10
 *                 minimum: 1
 *                 maximum: 50
 *               filter_chapter:
 *                 type: string
 *                 description: Filter by chapter (optional)
 *                 example: "CHƯƠNG 2: QUẢN LÝ TIẾN TRÌNH"
 *               filter_section:
 *                 type: string
 *                 description: Filter by section (optional)
 *                 example: "2.1 Khái niệm tiến trình"
 *     responses:
 *       200:
 *         description: Query successful
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
 *                   example: "Query successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     total_sources:
 *                       type: integer
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           chunk_id:
 *                             type: string
 *                           similarity_score:
 *                             type: number
 *                           chapter:
 *                             type: string
 *                           section:
 *                             type: string
 *                           content:
 *                             type: string
 *                           estimated_tokens:
 *                             type: integer
 *                           type:
 *                             type: string
 *       400:
 *         description: Bad request (missing question)
 *       401:
 *         description: Unauthorized
 */
router.post('/query', verifyToken, queryKnowledge);

/**
 * @swagger
 * /api/v1/knowledge/upload:
 *   post:
 *     summary: Upload text file to knowledge base
 *     description: Upload a .txt file to be processed and added to the knowledge base. Requires admin role.
 *     tags: [Knowledge]
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
 *                 description: Text file to upload (.txt only)
 *               recreate_collection:
 *                 type: boolean
 *                 description: Whether to recreate the collection (delete existing data)
 *                 default: false
 *     responses:
 *       200:
 *         description: File uploaded and processed successfully
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
 *                   example: "File uploaded and processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     chunks_processed:
 *                       type: integer
 *                     collection_name:
 *                       type: string
 *       400:
 *         description: Bad request (no file or invalid file type)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
router.post('/upload', verifyToken, upload.single('file'), uploadKnowledge);

/**
 * @swagger
 * /api/v1/knowledge/collection:
 *   delete:
 *     summary: Delete entire knowledge collection
 *     description: Delete all documents from the knowledge base. Requires admin role.
 *     tags: [Knowledge]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
router.delete('/collection', verifyToken, deleteCollection);

module.exports = router;

