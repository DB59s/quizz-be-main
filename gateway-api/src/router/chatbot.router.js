const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const {
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
  getMessages
} = require('../controller/chatbot.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: Chatbot conversation endpoints (No authentication required)
 */

/**
 * @swagger
 * /api/v1/chatbot/conversations:
 *   get:
 *     summary: Get all conversations for current user
 *     description: Retrieve all conversations for the authenticated user
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
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
 *                   example: "Conversations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       conversation_id:
 *                         type: string
 *                         format: uuid
 *                       account_id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new conversation
 *     description: Create a new conversation for the authenticated user
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the conversation
 *                 example: "Hỏi về toán học"
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', verifyToken, getConversations);
router.post('/conversations', verifyToken, createConversation);

/**
 * @swagger
 * /api/v1/chatbot/conversations/{id}:
 *   get:
 *     summary: Get conversation by ID
 *     description: Retrieve a specific conversation by its ID
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   put:
 *     summary: Update conversation
 *     description: Update a conversation's title
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: New title for the conversation
 *     responses:
 *       200:
 *         description: Conversation updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   delete:
 *     summary: Delete conversation
 *     description: Delete a conversation and all its messages
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:id', verifyToken, getConversationById);
router.put('/conversations/:id', verifyToken, updateConversation);
router.delete('/conversations/:id', verifyToken, deleteConversation);

/**
 * @swagger
 * /api/v1/chatbot/conversations/{id}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     description: Retrieve all messages in a specific conversation
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                   example: "Messages retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message_id:
 *                         type: string
 *                         format: uuid
 *                       conversation_id:
 *                         type: string
 *                         format: uuid
 *                       role:
 *                         type: string
 *                         enum: [user, assistant]
 *                       content:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:id/messages', verifyToken, getMessages);

module.exports = router;

