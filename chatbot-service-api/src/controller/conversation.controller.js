const conversationService = require('../service/conversation.service');

/**
 * Get all conversations for a user
 */
async function getConversations(req, res, next) {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'account_id is required',
        data: null
      });
    }

    const conversations = await conversationService.getConversations(account_id);

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single conversation by ID
 */
async function getConversationById(req, res, next) {
  try {
    const { id } = req.params;
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'account_id is required',
        data: null
      });
    }

    const conversation = await conversationService.getConversationById(id, account_id);

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: conversation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages for a conversation
 */
async function getMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'account_id is required',
        data: null
      });
    }

    const messages = await conversationService.getMessages(id, account_id);

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new conversation
 */
async function createConversation(req, res, next) {
  try {
    const { account_id, title } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'account_id is required',
        data: null
      });
    }

    const conversation = await conversationService.createConversation(account_id, title);

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update conversation title
 */
async function updateConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { account_id } = req.query;
    const { title } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'account_id is required',
        data: null
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        data: null
      });
    }

    const conversation = await conversationService.updateConversation(id, account_id, title);

    res.status(200).json({
      success: true,
      message: 'Conversation updated successfully',
      data: conversation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a conversation
 */
async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'account_id is required',
        data: null
      });
    }

    await conversationService.deleteConversation(id, account_id);

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getConversations,
  getConversationById,
  getMessages,
  createConversation,
  updateConversation,
  deleteConversation
};

