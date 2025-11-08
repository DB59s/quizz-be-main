const { AppDataSource } = require('../config');

const getConvRepo = () => AppDataSource.getRepository('Conversation');
const getMsgRepo = () => AppDataSource.getRepository('ChatMessage');

/**
 * Get all conversations for a user
 * @param {string} account_id - User's account ID
 * @returns {Array} - List of conversations
 */
async function getConversations(account_id) {
  try {
    const convRepo = getConvRepo();
    const conversations = await convRepo.find({
      where: { account_id },
      order: { created_at: 'DESC' }
    });
    return conversations;
  } catch (error) {
    console.error('[Conversation Service] Get conversations error:', error);
    throw error;
  }
}

/**
 * Get a single conversation by ID
 * @param {string} conversation_id - Conversation ID
 * @param {string} account_id - User's account ID
 * @returns {Object} - Conversation
 */
async function getConversationById(conversation_id, account_id) {
  try {
    const convRepo = getConvRepo();
    const conversation = await convRepo.findOne({
      where: { id: conversation_id, account_id }
    });

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    return conversation;
  } catch (error) {
    console.error('[Conversation Service] Get conversation error:', error);
    throw error;
  }
}

/**
 * Get messages for a conversation
 * @param {string} conversation_id - Conversation ID
 * @param {string} account_id - User's account ID
 * @returns {Array} - List of messages
 */
async function getMessages(conversation_id, account_id) {
  try {
    // First verify the conversation belongs to the user
    await getConversationById(conversation_id, account_id);

    const msgRepo = getMsgRepo();
    const messages = await msgRepo.find({
      where: { conversation_id },
      order: { created_at: 'ASC' }
    });

    return messages;
  } catch (error) {
    console.error('[Conversation Service] Get messages error:', error);
    throw error;
  }
}

/**
 * Create a new conversation
 * @param {string} account_id - User's account ID
 * @param {string} title - Conversation title
 * @returns {Object} - Created conversation
 */
async function createConversation(account_id, title = 'Cuộc hội thoại mới') {
  try {
    const convRepo = getConvRepo();
    const conversation = convRepo.create({
      account_id,
      title
    });
    const savedConv = await convRepo.save(conversation);
    return savedConv;
  } catch (error) {
    console.error('[Conversation Service] Create conversation error:', error);
    throw error;
  }
}

/**
 * Update conversation title
 * @param {string} conversation_id - Conversation ID
 * @param {string} account_id - User's account ID
 * @param {string} title - New title
 * @returns {Object} - Updated conversation
 */
async function updateConversation(conversation_id, account_id, title) {
  try {
    const convRepo = getConvRepo();
    const conversation = await getConversationById(conversation_id, account_id);

    conversation.title = title;
    const updated = await convRepo.save(conversation);
    return updated;
  } catch (error) {
    console.error('[Conversation Service] Update conversation error:', error);
    throw error;
  }
}

/**
 * Delete a conversation
 * @param {string} conversation_id - Conversation ID
 * @param {string} account_id - User's account ID
 */
async function deleteConversation(conversation_id, account_id) {
  try {
    const convRepo = getConvRepo();
    const conversation = await getConversationById(conversation_id, account_id);

    await convRepo.remove(conversation);
  } catch (error) {
    console.error('[Conversation Service] Delete conversation error:', error);
    throw error;
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

