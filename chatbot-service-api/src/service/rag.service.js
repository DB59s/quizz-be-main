const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppDataSource } = require('../config');
const axios = require('axios');
const { env } = require('../config');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const classifierModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const generatorModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
  console.log('\n========================================');
  console.log('[RAG] 🤖 STARTING RAG PROCESSING');
  console.log('========================================');

  try {
    const { prompt, context, conversation_id } = data;
    console.log('[RAG] Input:');
    console.log('[RAG] - Account ID:', account_id);
    console.log('[RAG] - Conversation ID:', conversation_id || 'NEW');
    console.log('[RAG] - Prompt:', prompt);
    console.log('[RAG] - Context:', JSON.stringify(context || null));

    // Get conversation history
    console.log('\n[RAG] Step 1: Getting conversation history...');
    const historyStart = Date.now();
    const history = await getHistory(conversation_id, account_id);
    console.log(`[RAG] ✓ History retrieved: ${history.length} messages (${Date.now() - historyStart}ms)`);

    // Classify the query
    console.log('\n[RAG] Step 2: Classifying query...');
    const classifyStart = Date.now();
    const classification = await classifyQuery(prompt, context, history);
    console.log(`[RAG] ✓ Classification result (${Date.now() - classifyStart}ms):`, JSON.stringify(classification));

    // Get retrieval data based on classification
    console.log('\n[RAG] Step 3: Retrieving data...');
    const retrievalStart = Date.now();
    const retrievalData = await getRetrievalData(classification, prompt);
    console.log(`[RAG] ✓ Retrieval completed (${Date.now() - retrievalStart}ms)`);
    if (retrievalData) {
      console.log('[RAG] - Retrieved data type:', Array.isArray(retrievalData) ? 'Array' : 'Object');
      console.log('[RAG] - Data size:', JSON.stringify(retrievalData).length, 'characters');
    } else {
      console.log('[RAG] - No retrieval data (using history only)');
    }

    // Build final prompt for generator
    console.log('\n[RAG] Step 4: Building final prompt...');
    const finalPrompt = buildFinalPrompt(classification.type, retrievalData, prompt);
    console.log('[RAG] ✓ Final prompt length:', finalPrompt.length, 'characters');

    // Call Gemini generator
    console.log('\n[RAG] Step 5: Calling Gemini AI...');
    const geminiStart = Date.now();
    const responseText = await callGeminiGenerator(finalPrompt, history);
    console.log(`[RAG] ✓ Gemini response received (${Date.now() - geminiStart}ms)`);
    console.log('[RAG] - Response length:', responseText.length, 'characters');

    // Save to history
    console.log('\n[RAG] Step 6: Saving to database...');
    const saveStart = Date.now();
    const newConvId = await saveToHistory(account_id, conversation_id, prompt, responseText);
    console.log(`[RAG] ✓ Saved to database (${Date.now() - saveStart}ms)`);
    console.log('[RAG] - Conversation ID:', newConvId);

    console.log('\n========================================');
    console.log('[RAG] ✅ RAG PROCESSING COMPLETED');
    console.log('========================================\n');

    return {
      response: responseText,
      conversation_id: newConvId || conversation_id
    };
  } catch (error) {
    console.error('\n========================================');
    console.error('[RAG] ❌ RAG PROCESSING ERROR');
    console.error('========================================');
    console.error('[RAG] Error:', error.message);
    console.error('[RAG] Stack:', error.stack);
    console.error('========================================\n');
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
    console.log('[RAG:Classify] Analyzing context...');
    console.log('[RAG:Classify] Context received:', JSON.stringify(context));

    // Type 1: FE specifies question_bank with question_id
    if (context?.force_type === 'question_bank' && context.question_id) {
      console.log('[RAG:Classify] ✓ Type 1: question_bank (Frontend specified)');
      console.log('[RAG:Classify] - Question ID:', context.question_id);
      return { type: 'question_bank', context_id: context.question_id };
    }

    // Backward compatibility: support old format (type: 'question', id: '...')
    if (context?.type === 'question' && context.id) {
      console.log('[RAG:Classify] ✓ Type 1: question_bank (Frontend specified - old format)');
      console.log('[RAG:Classify] - Question ID:', context.id);
      return { type: 'question_bank', context_id: context.id };
    }

    // Type 2: FE specifies knowledge_base
    if (context?.force_type === 'knowledge_base' || context?.type === 'knowledge') {
      console.log('[RAG:Classify] ✓ Type 2: knowledge_base (Frontend specified)');
      return { type: 'knowledge_base' };
    }

    // Type 3: Use Gemini to classify (knowledge_base or history)
    console.log('[RAG:Classify] No context from frontend, using Gemini to classify...');
    console.log('[RAG:Classify] History length for classification:', history.length);

    const historyText = history.length > 0
      ? history.map(h => `${h.role}: ${h.parts.join(' ')}`).join('\n')
      : '(Không có lịch sử chat)';

    const classificationPrompt = `Bạn là một AI phân loại câu hỏi. Phân loại câu hỏi của người dùng thành một trong 3 loại sau:

1. "question_bank": Câu hỏi về bài tập, đề thi, câu hỏi trắc nghiệm cụ thể
   - Ví dụ: "Giải thích câu hỏi về deadlock", "Có bao nhiêu câu hỏi về hệ điều hành?"

2. "knowledge_base": Câu hỏi về kiến thức chung, khái niệm, lý thuyết, định nghĩa
   - Ví dụ: "Tiến trình là gì?", "SQL là gì?", "Giải thích về deadlock"

3. "history": Câu hỏi liên quan đến lịch sử chat trước đó, hoặc câu hỏi chung không liên quan đến học tập
   - Ví dụ: "Kể cho tôi một câu chuyện", "Hôm nay thời tiết thế nào?", "Bạn vừa nói gì?"

---

LỊCH SỬ CHAT GÇN ĐÂY:
${historyText}

CÂU HỎI NGƯỜI DÙNG:
"${prompt}"

---

Dựa vào lịch sử chat và câu hỏi, hãy phân loại câu hỏi.
Chỉ trả về một JSON object có dạng: {"type": "question_bank"} hoặc {"type": "knowledge_base"} hoặc {"type": "history"}
Không giải thích, chỉ trả về JSON.`;

    console.log('[RAG:Classify] Calling Gemini classifier...');
    const result = await classifierModel.generateContent(classificationPrompt);
    const responseText = result.response.text().trim();
    console.log('[RAG:Classify] Gemini response:', responseText);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const jsonResponse = JSON.parse(jsonMatch[0]);
      console.log('[RAG:Classify] ✓ Parsed classification:', jsonResponse.type);
      return jsonResponse;
    }

    // Default to history if parsing fails
    console.log('[RAG:Classify] ⚠ Failed to parse, defaulting to history');
    return { type: 'history' };
  } catch (error) {
    console.error('[RAG:Classify] ❌ Classification error:', error.message);
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
    console.log('[RAG:Retrieval] Type:', type);

    if (type === 'question_bank') {
      // Case 1: Frontend provides question_id
      if (context_id) {
        console.log('[RAG:Retrieval] Fetching question by ID:', context_id);
        const url = `${env.QUESTION_SERVICE_BASEURL}/questions/internal/${context_id}`;
        console.log('[RAG:Retrieval] URL:', url);

        try {
          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${env.QUESTION_SERVICE_API_TOKEN}`
            }
          });
          
          console.log('[RAG:Retrieval] ✓ Question retrieved successfully');
          
          // Remove is_correct field from answers to hide correct answer from student
          const questionData = response.data.data;
          
          console.log('[RAG:Retrieval] - Question data (answers filtered):', JSON.stringify(questionData).substring(0, 200) + '...');
          return questionData;
        } catch (error) {
          console.error('[RAG:Retrieval] ❌ Failed to fetch question:', error.message);
          if (error.response) {
            console.error('[RAG:Retrieval] - Status:', error.response.status);
            console.error('[RAG:Retrieval] - Data:', JSON.stringify(error.response.data));
          }
          return null;
        }
      }

      // Case 2: No question_id provided - Question Service doesn't support search
      console.log('[RAG:Retrieval] ⚠ No question_id provided');
      console.log('[RAG:Retrieval] Question Service does not support text search');
      console.log('[RAG:Retrieval] Falling back to knowledge_base');
      
      // Fallback: Treat as knowledge_base if no question_id
      return null;
    }

    if (type === 'knowledge_base') {
      console.log('[RAG:Retrieval] Searching knowledge base...');
      const url = `${env.KNOWLEDGE_SERVICE_BASEURL}/api/v1/internal/knowledge/search`;
      console.log('[RAG:Retrieval] URL:', url);
      console.log('[RAG:Retrieval] Query:', prompt);

      const response = await axios.post(url, { query: prompt, top_k: 10 });
      const chunks = response.data.data;
      console.log('[RAG:Retrieval] ✓ Knowledge chunks retrieved:', chunks?.length || 0);
      return chunks;
    }

    // For 'history' type, no retrieval needed
    console.log('[RAG:Retrieval] Type is "history", no retrieval needed');
    return null;
  } catch (error) {
    console.error('[RAG:Retrieval] ❌ Retrieval error:', error.message);
    if (error.response) {
      console.error('[RAG:Retrieval] - Status:', error.response.status);
      console.error('[RAG:Retrieval] - Data:', JSON.stringify(error.response.data));
    }
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
    return `Dựa vào dữ liệu câu hỏi sau (JSON):
${JSON.stringify(retrievalData, null, 2)}

Hãy giải thích và hướng dẫn học sinh trả lời câu hỏi: "${prompt}"

Yêu cầu:
- Giải thích các khái niệm liên quan đến câu hỏi
- Phân tích từng đáp án 
- Hướng dẫn cách suy luận để tìm ra đáp án đúng
- Giúp học sinh tự rút ra kết luận
- Đưa ra đáp án ở cuối câu trả lời `;
  }

  if (type === 'knowledge_base' && retrievalData && Array.isArray(retrievalData)) {
    const knowledgeText = retrievalData.map(chunk => chunk.text || chunk.content || '').join('\n---\n');
    return `Dựa vào kiến thức sau:
${knowledgeText}

Hãy trả lời câu hỏi: "${prompt}"

Yêu cầu:
- Trả lời chính xác dựa trên kiến thức được cung cấp
- Giải thích rõ ràng, dễ hiểu
- Nếu kiến thức không đủ để trả lời, hãy trả lời theo kiến thức của bạn
- Trong câu trả lời thì trả lời luôn vào vấn đề mà học sinh hỏi, không cần phải trả lời dài dòng(ví dụ như dựa vào kiến thức bạn cung cấp ,.....)`;
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
    console.log('[RAG:Generator] Starting Gemini chat...');
    console.log('[RAG:Generator] History length:', history.length);

    // Validate and convert history format
    const validHistory = history
      .filter(h => {
        if (!h.role || !h.parts || !Array.isArray(h.parts)) {
          console.warn('[RAG:Generator] ⚠ Invalid history item:', h);
          return false;
        }
        return true;
      })
      .map(h => ({
        role: h.role,
        parts: h.parts.map(part => {
          // If part is already an object with 'text' property, use it
          if (typeof part === 'object' && part.text) {
            return part;
          }
          // If part is a string, convert to { text: "..." }
          if (typeof part === 'string') {
            return { text: part };
          }
          // Otherwise, skip this part
          console.warn('[RAG:Generator] ⚠ Invalid part format:', part);
          return null;
        }).filter(p => p !== null)
      }))
      .filter(h => h.parts.length > 0); // Remove history items with no valid parts

    console.log('[RAG:Generator] Valid history items:', validHistory.length);

    // Start chat with validated history
    const chat = generatorModel.startChat({
      history: validHistory.length > 0 ? validHistory : undefined
    });

    console.log('[RAG:Generator] Sending message to Gemini...');
    const result = await chat.sendMessage(finalPrompt);
    const responseText = result.response.text();

    console.log('[RAG:Generator] ✓ Response received');
    return responseText;
  } catch (error) {
    console.error('[RAG:Generator] ❌ Generator error:', error.message);
    console.error('[RAG:Generator] Error stack:', error.stack);
    console.error('[RAG:Generator] History that caused error:', JSON.stringify(history));
    throw new Error('Failed to generate response');
  }
}

/**
 * Get conversation history
 * @param {string} conversation_id - Conversation ID
 * @param {string} account_id - User's account ID (optional, for getting recent history)
 * @returns {Array} - History in Gemini format
 */
async function getHistory(conversation_id, account_id = null) {
  try {
    const msgRepo = getMsgRepo();
    const convRepo = getConvRepo();

    // Case 1: Has conversation_id - get history from this conversation
    if (conversation_id) {
      console.log('[RAG:History] Getting history for conversation:', conversation_id);
      const messages = await msgRepo.find({
        where: { conversation_id },
        order: { created_at: 'ASC' }
      });

      console.log('[RAG:History] ✓ Found', messages.length, 'messages in conversation');

      // Convert to Gemini history format
      return messages.map(msg => ({
        role: msg.role,
        parts: [msg.content]
      }));
    }

    // Case 2: No conversation_id but has account_id - get recent history from user's conversations
    if (account_id) {
      console.log('[RAG:History] No conversation_id, getting recent history for account:', account_id);

      // Get recent conversations of this user (last 3 conversations)
      const recentConversations = await convRepo.find({
        where: { account_id },
        order: { updated_at: 'DESC' },
        take: 3
      });

      if (recentConversations.length === 0) {
        console.log('[RAG:History] ✓ No previous conversations found');
        return [];
      }

      console.log('[RAG:History] Found', recentConversations.length, 'recent conversations');

      // Get messages from these conversations (limit to last 10 messages total)
      const conversationIds = recentConversations.map(c => c.id);
      const messages = await msgRepo
        .createQueryBuilder('message')
        .where('message.conversation_id IN (:...ids)', { ids: conversationIds })
        .orderBy('message.created_at', 'DESC')
        .take(10)
        .getMany();

      // Reverse to get chronological order
      messages.reverse();

      console.log('[RAG:History] ✓ Found', messages.length, 'recent messages');

      // Convert to Gemini history format
      return messages.map(msg => ({
        role: msg.role,
        parts: [msg.content]
      }));
    }

    // Case 3: No conversation_id and no account_id
    console.log('[RAG:History] No conversation_id or account_id, returning empty history');
    return [];
  } catch (error) {
    console.error('[RAG:History] ❌ Get history error:', error.message);
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
    console.log('[RAG:Save] Saving to database...');
    console.log('[RAG:Save] - Account ID:', account_id);
    console.log('[RAG:Save] - Conversation ID:', conversation_id || 'NEW');

    const convRepo = getConvRepo();
    const msgRepo = getMsgRepo();

    let convId = conversation_id;

    // Create new conversation if not exists
    if (!convId) {
      console.log('[RAG:Save] Creating new conversation...');
      const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
      console.log('[RAG:Save] - Title:', title);

      const newConv = convRepo.create({
        account_id,
        title
      });
      const savedConv = await convRepo.save(newConv);
      convId = savedConv.id;
      console.log('[RAG:Save] ✓ New conversation created:', convId);
    } else {
      console.log('[RAG:Save] Using existing conversation:', convId);
    }

    // Save user message
    console.log('[RAG:Save] Saving user message...');
    const userMsg = msgRepo.create({
      conversation_id: convId,
      role: 'user',
      content: userMessage
    });
    const savedUserMsg = await msgRepo.save(userMsg);
    console.log('[RAG:Save] ✓ User message saved, ID:', savedUserMsg.id);

    // Save model response
    console.log('[RAG:Save] Saving model response...');
    const modelMsg = msgRepo.create({
      conversation_id: convId,
      role: 'model',
      content: modelResponse
    });
    const savedModelMsg = await msgRepo.save(modelMsg);
    console.log('[RAG:Save] ✓ Model response saved, ID:', savedModelMsg.id);

    console.log('[RAG:Save] ✓ All data saved successfully');
    return convId;
  } catch (error) {
    console.error('[RAG:Save] ❌ Save history error:', error.message);
    console.error('[RAG:Save] Stack:', error.stack);
    throw error;
  }
}

module.exports = {
  processMessage,
  getHistory,
  saveToHistory
};
