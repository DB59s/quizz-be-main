const express = require('express');
const router = express.Router();
const conversationController = require('../controller/conversation.controller');

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: Get all conversations for a user
 *     tags: [Conversations]
 *     parameters:
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID of the user
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
router.get('/', conversationController.getConversations);

/**
 * @swagger
 * /api/v1/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *             properties:
 *               account_id:
 *                 type: string
 *                 description: Account ID of the user
 *               title:
 *                 type: string
 *                 description: Optional conversation title
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/', conversationController.createConversation);

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   get:
 *     summary: Get a conversation by ID
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID of the user
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 */
router.get('/:id', conversationController.getConversationById);

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   put:
 *     summary: Update conversation title
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation updated successfully
 */
router.put('/:id', conversationController.updateConversation);

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID of the user
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 */
router.delete('/:id', conversationController.deleteConversation);

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID of the user
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:id/messages', conversationController.getMessages);

module.exports = router;

