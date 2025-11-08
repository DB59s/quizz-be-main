const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppDataSource } = require('../config');
const axios = require('axios');
const { env } = require('../config');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const classifierModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const generatorModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Get repositories
const getConvRepo = () => AppDataSource.getRepository('Conversation');
const getMsgRepo = () => AppDataSource.getRepository('ChatMessage');

/**
 * Main function to process a message
 * @param {Object} data - { prompt, context, conversation_id }
 * @param {string} account_id - User's account ID
 * @returns {Object} - { response, conversation_id }
 */
async function processMessage(data, account_id) {
  try {
    const { prompt, context, conversation_id } = data;

    // Get conversation history
    const history = await getHistory(conversation_id);

    // Classify the query
    const classification = await classifyQuery(prompt, context, history);
    console.log('[RAG] Classification:', classification);

    // Get retrieval data based on classification
    const retrievalData = await getRetrievalData(classification, prompt);

    // Build final prompt for generator
    const finalPrompt = buildFinalPrompt(classification.type, retrievalData, prompt);

    // Call Gemini generator
    const responseText = await callGeminiGenerator(finalPrompt, history);

    // Save to history
    const newConvId = await saveToHistory(account_id, conversation_id, prompt, responseText);

    return {
      response: responseText,
      conversation_id: newConvId || conversation_id
    };
  } catch (error) {
    console.error('[RAG] Process message error:', error);
    throw error;
  }
}

/**
 * Classify the query into one of 3 types
 * @param {string} prompt - User's question
 * @param {Object} context - Context from FE { type, id }
 * @param {Array} history - Chat history
 * @returns {Object} - { type, context_id }
 */
async function classifyQuery(prompt, context, history) {
  try {
    // Type 1: FE specifies question_bank with ID
    if (context?.type === 'question' && context.id) {
      return { type: 'question_bank', context_id: context.id };
    }

    // Type 2: FE specifies knowledge_base
    if (context?.type === 'knowledge') {
      return { type: 'knowledge_base' };
    }

    // Type 3: Use Gemini to classify (knowledge_base or history)
    const historyText = history.map(h => `${h.role}: ${h.parts.join(' ')}`).join('\n');
    
    const classificationPrompt = `Phân loại câu hỏi sau của người dùng thành một trong 3 loại: "question_bank", "knowledge_base", "history". 
Chỉ trả về một JSON object có dạng {"type": "..."}.

Lịch sử chat (nếu có):
${historyText}

Câu hỏi người dùng: "${prompt}"

Quy tắc phân loại:
- "question_bank": Nếu người dùng hỏi về một câu hỏi cụ thể, bài tập, đề thi
- "knowledge_base": Nếu người dùng hỏi về kiến thức chung, khái niệm, lý thuyết
- "history": Nếu câu hỏi liên quan đến lịch sử chat trước đó

Chỉ trả về JSON, không giải thích thêm.`;

    const result = await classifierModel.generateContent(classificationPrompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const jsonResponse = JSON.parse(jsonMatch[0]);
      return jsonResponse;
    }

    // Default to history if parsing fails
    return { type: 'history' };
  } catch (error) {
    console.error('[RAG] Classification error:', error);
    // Default to history on error
    return { type: 'history' };
  }
}

/**
 * Get retrieval data based on classification
 * @param {Object} classification - { type, context_id }
 * @param {string} prompt - User's question
 * @returns {Object|Array|null} - Retrieved data
 */
async function getRetrievalData(classification, prompt) {
  try {
    const { type, context_id } = classification;

    if (type === 'question_bank' && context_id) {
      // Call Question Service to get question details
      const response = await axios.get(
        `${env.QUESTION_SERVICE_BASEURL}/questions/internal/${context_id}`
      );
      return response.data.data;
    }

    if (type === 'knowledge_base') {
      // Call Knowledge Service to search for relevant chunks
      const response = await axios.post(
        `${env.KNOWLEDGE_SERVICE_BASEURL}/internal/knowledge/search`,
        { query: prompt }
      );
      return response.data.data;
    }

    // For 'history' type, no retrieval needed
    return null;
  } catch (error) {
    console.error('[RAG] Retrieval error:', error.message);
    return null;
  }
}

/**
 * Build final prompt for generator
 * @param {string} type - Classification type
 * @param {Object|Array|null} retrievalData - Retrieved data
 * @param {string} prompt - User's question
 * @returns {string} - Final prompt
 */
function buildFinalPrompt(type, retrievalData, prompt) {
  if (type === 'question_bank' && retrievalData) {
    return `Dựa vào dữ liệu câu hỏi và đáp án sau (JSON):
${JSON.stringify(retrievalData, null, 2)}

Hãy giải thích chi tiết cho câu hỏi của học sinh: "${prompt}"

Yêu cầu:
- Giải thích rõ ràng, dễ hiểu
- Nếu có đáp án đúng, hãy giải thích tại sao đó là đáp án đúng
- Nếu có các đáp án sai, hãy giải thích tại sao chúng sai`;
  }

  if (type === 'knowledge_base' && retrievalData && Array.isArray(retrievalData)) {
    const knowledgeText = retrievalData.map(chunk => chunk.text || chunk.content || '').join('\n---\n');
    return `Dựa vào kiến thức sau:
${knowledgeText}

Hãy trả lời câu hỏi: "${prompt}"

Yêu cầu:
- Trả lời chính xác dựa trên kiến thức được cung cấp
- Giải thích rõ ràng, dễ hiểu
- Nếu kiến thức không đủ để trả lời, hãy nói rõ`;
  }

  // For 'history' type, just return the prompt
  return prompt;
}

/**
 * Call Gemini generator with history
 * @param {string} finalPrompt - Final prompt
 * @param {Array} history - Chat history
 * @returns {string} - Generated response
 */
async function callGeminiGenerator(finalPrompt, history) {
  try {
    const chat = generatorModel.startChat({ history });
    const result = await chat.sendMessage(finalPrompt);
    return result.response.text();
  } catch (error) {
    console.error('[RAG] Generator error:', error);
    throw new Error('Failed to generate response');
  }
}

/**
 * Get conversation history
 * @param {string} conversation_id - Conversation ID
 * @returns {Array} - History in Gemini format
 */
async function getHistory(conversation_id) {
  try {
    if (!conversation_id) {
      return [];
    }

    const msgRepo = getMsgRepo();
    const messages = await msgRepo.find({
      where: { conversation_id },
      order: { created_at: 'ASC' }
    });

    // Convert to Gemini history format
    return messages.map(msg => ({
      role: msg.role,
      parts: [msg.content]
    }));
  } catch (error) {
    console.error('[RAG] Get history error:', error);
    return [];
  }
}

/**
 * Save conversation and messages to history
 * @param {string} account_id - User's account ID
 * @param {string} conversation_id - Conversation ID (optional)
 * @param {string} userMessage - User's message
 * @param {string} modelResponse - Model's response
 * @returns {string} - Conversation ID
 */
async function saveToHistory(account_id, conversation_id, userMessage, modelResponse) {
  try {
    const convRepo = getConvRepo();
    const msgRepo = getMsgRepo();

    let convId = conversation_id;

    // Create new conversation if not exists
    if (!convId) {
      const newConv = convRepo.create({
        account_id,
        title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
      });
      const savedConv = await convRepo.save(newConv);
      convId = savedConv.id;
    }

    // Save user message
    const userMsg = msgRepo.create({
      conversation_id: convId,
      role: 'user',
      content: userMessage
    });
    await msgRepo.save(userMsg);

    // Save model response
    const modelMsg = msgRepo.create({
      conversation_id: convId,
      role: 'model',
      content: modelResponse
    });
    await msgRepo.save(modelMsg);

    return convId;
  } catch (error) {
    console.error('[RAG] Save history error:', error);
    throw error;
  }
}

module.exports = {
  processMessage,
  getHistory,
  saveToHistory
};

