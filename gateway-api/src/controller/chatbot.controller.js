const axios = require('axios');
const { env } = require('../config');

const CHATBOT_SERVICE_URL = env.CHATBOT_SERVICE_BASEURL || 'http://localhost:9012/api/v1';

/**
 * Helper function to call chatbot service
 */
async function callChatbotService(method, endpoint, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${CHATBOT_SERVICE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`[Chatbot Service] Error calling ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * GET /api/v1/chatbot/conversations - Get all conversations for a user
 */
async function getConversations(req, res) {
  try {
    const account_id = req.user?.account_id;

    if (!account_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const result = await callChatbotService('GET', '/conversations', null, { account_id });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Gateway] Get conversations error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      data: null
    });
  }
}

/**
 * POST /api/v1/chatbot/conversations - Create a new conversation
 */
async function createConversation(req, res) {
  try {
    const account_id = req.user?.account_id;
    const { title } = req.body;

    if (!account_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const result = await callChatbotService('POST', '/conversations', { account_id, title });
    return res.status(201).json(result);
  } catch (error) {
    console.error('[Gateway] Create conversation error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      data: null
    });
  }
}

/**
 * GET /api/v1/chatbot/conversations/:id - Get conversation by ID
 */
async function getConversationById(req, res) {
  try {
    const { id } = req.params;
    const account_id = req.user?.account_id;

    if (!account_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const result = await callChatbotService('GET', `/conversations/${id}`, null, { account_id });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Gateway] Get conversation by ID error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      data: null
    });
  }
}

/**
 * PUT /api/v1/chatbot/conversations/:id - Update conversation
 */
async function updateConversation(req, res) {
  try {
    const { id } = req.params;
    const account_id = req.user?.account_id;
    const { title } = req.body;

    if (!account_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const result = await callChatbotService('PUT', `/conversations/${id}?account_id=${account_id}`, { title });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Gateway] Update conversation error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update conversation',
      data: null
    });
  }
}

/**
 * DELETE /api/v1/chatbot/conversations/:id - Delete conversation
 */
async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    const account_id = req.user?.account_id;

    if (!account_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const result = await callChatbotService('DELETE', `/conversations/${id}`, null, { account_id });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Gateway] Delete conversation error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      data: null
    });
  }
}

/**
 * GET /api/v1/chatbot/conversations/:id/messages - Get messages in a conversation
 */
async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const account_id = req.user?.account_id;

    if (!account_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const result = await callChatbotService('GET', `/conversations/${id}/messages`, null, { account_id });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Gateway] Get messages error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      data: null
    });
  }
}

module.exports = {
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
  getMessages
};

