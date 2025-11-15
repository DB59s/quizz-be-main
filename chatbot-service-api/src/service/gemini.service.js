const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sessionStore = require('../utils/sessionStore');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8192, // Increase output token limit
        temperature: 0.1, // Lower temperature for more consistent JSON
      }
    });
  }

  /**
   * Generate content from text prompt
   */
  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content with Gemini API:', error);
      throw new Error('Failed to generate content with Gemini API');
    }
  }

  /**
   * Analyze PDF file and generate quiz questions
   */
  async analyzeFile(filePath, prompt) {
    try {
      // Read file as base64
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Generate content with the file data inline
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        { text: prompt },
      ]);

      const response = result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error('Error analyzing file with Gemini API:', error);
      throw new Error('Failed to analyze file with Gemini API');
    }
  }

  /**
   * Clean and extract JSON from Gemini response
   */
  _cleanJsonResponse(responseText) {
    let cleaned = responseText.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Remove any leading/trailing text that's not JSON
    // Find the first '[' or '{' and last ']' or '}'
    const firstBracket = Math.max(cleaned.indexOf('['), cleaned.indexOf('{'));
    const lastOpenBracket = cleaned.lastIndexOf('[');
    const lastCloseBracket = cleaned.lastIndexOf(']');
    const lastOpenBrace = cleaned.lastIndexOf('{');
    const lastCloseBrace = cleaned.lastIndexOf('}');

    if (firstBracket === -1) {
      throw new Error('No JSON structure found in response');
    }

    // Determine if it's an array or object
    const isArray = cleaned.charAt(firstBracket) === '[';
    const lastBracket = isArray ? lastCloseBracket : lastCloseBrace;

    if (lastBracket === -1) {
      throw new Error('Incomplete JSON structure in response');
    }

    cleaned = cleaned.substring(firstBracket, lastBracket + 1);

    return cleaned;
  }

  /**
   * Try to salvage partial JSON by extracting complete objects
   * This is a fallback when JSON.parse fails due to truncation
   * Strategy: Extract only COMPLETE question objects, ignore incomplete ones
   */
  _parsePartialJson(jsonText) {
    console.log('[GeminiService] Attempting partial JSON parsing...');
    console.log(`[GeminiService] Input text length: ${jsonText.length}`);

    const questions = [];

    // Find all complete question objects using regex
    // Match objects that have closing brace for answers array AND closing brace for question object
    const objectPattern = /\{\s*"content"\s*:\s*"[^"]*"\s*,\s*"level"\s*:\s*\d+\s*,\s*"type"\s*:\s*"[^"]*"\s*,\s*"answers"\s*:\s*\[([\s\S]*?)\]\s*\}/g;

    let match;
    while ((match = objectPattern.exec(jsonText)) !== null) {
      try {
        const objText = match[0];
        const obj = JSON.parse(objText);

        // Validate structure
        if (obj.content && obj.level && obj.type && Array.isArray(obj.answers)) {
          // Validate all answers are complete
          let allAnswersValid = true;
          for (const answer of obj.answers) {
            if (!answer.content || typeof answer.is_true !== 'boolean') {
              allAnswersValid = false;
              console.warn(`[GeminiService] Incomplete answer detected in question "${obj.content.substring(0, 30)}..."`);
              break;
            }
          }

          if (allAnswersValid && obj.answers.length > 0) {
            questions.push(obj);
            console.log(`[GeminiService] ✓ Extracted complete question ${questions.length}: "${obj.content.substring(0, 50)}..."`);
          }
        }
      } catch (e) {
        console.warn(`[GeminiService] Failed to parse matched object: ${e.message}`);
      }
    }

    // If regex approach fails, try manual parsing
    if (questions.length === 0) {
      console.log('[GeminiService] Regex extraction failed, trying manual parsing...');

      let depth = 0;
      let currentObject = '';
      let inString = false;
      let escapeNext = false;

      let startIndex = jsonText.indexOf('[');
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < jsonText.length; i++) {
        const char = jsonText[i];

        if (escapeNext) {
          currentObject += char;
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          currentObject += char;
          escapeNext = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          currentObject += char;
          continue;
        }

        if (!inString) {
          if (char === '{') {
            if (depth === 0) {
              currentObject = '{';
            } else {
              currentObject += char;
            }
            depth++;
          } else if (char === '}') {
            depth--;
            currentObject += char;

            if (depth === 0 && currentObject.trim()) {
              try {
                const obj = JSON.parse(currentObject);
                if (obj.content && obj.level && obj.type && Array.isArray(obj.answers) && obj.answers.length > 0) {
                  // Check if all answers are complete
                  const allComplete = obj.answers.every(a => a.content && typeof a.is_true === 'boolean');
                  if (allComplete) {
                    questions.push(obj);
                    console.log(`[GeminiService] ✓ Manual parse extracted question ${questions.length}`);
                  }
                }
              } catch (e) {
                // Ignore incomplete objects
              }
              currentObject = '';
            }
          } else if (depth > 0) {
            currentObject += char;
          }
        } else {
          currentObject += char;
        }
      }
    }

    if (questions.length === 0) {
      console.error('[GeminiService] No valid questions extracted. First 500 chars of input:');
      console.error(jsonText.substring(0, 500));
      throw new Error('No valid questions extracted from partial JSON');
    }

    console.log(`[GeminiService] ✓ Partial parsing recovered ${questions.length} complete questions`);
    return questions;
  }

  /**
   * Generate quiz questions from PDF file with retry mechanism
   * NOTE: This API is limited to 10 questions max. For larger PDFs, use startChunkedQuizGeneration()
   */
  async generateQuizFromPDF(filePath, maxRetries = 3, maxQuestions = 10) {
    const prompt = `Bạn là hệ thống tạo câu hỏi trắc nghiệm từ tài liệu.

NHIỆM VỤ:
Trích xuất CHÍNH XÁC ${maxQuestions} câu hỏi ĐẦU TIÊN từ tài liệu PDF.

YÊU CẦU NGHIÊM NGẶT:
1. CHỈ TRẢ VỀ ĐÚNG ${maxQuestions} CÂU HỎI, KHÔNG NHIỀU HƠN, KHÔNG ÍT HƠN.
2. Nếu tài liệu có ít hơn ${maxQuestions} câu hỏi → trả về hết số câu hỏi có.
3. CHỈ TRẢ VỀ JSON ARRAY, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC.
4. Không được tự tạo thêm câu hỏi nếu tài liệu không có.
5. Nếu tài liệu có câu hỏi tự luận → chuyển sang dạng trắc nghiệm hợp lý nhất.

FORMAT TRẢ RA (BẮT BUỘC):
[
  {
    "content": "Nội dung câu hỏi?",
    "level": 1,
    "type": "1",
    "answers": [
      {
        "content": "Nội dung đáp án",
        "is_true": false
      },
      {
        "content": "Nội dung đáp án",
        "is_true": true
      }
    ]
  }
]

QUY TẮC CHI TIẾT:
- "content": Nội dung câu hỏi
- "level": chỉ nhận giá trị {1,2,3,4}:
  EASY = 1
  MEDIUM = 2
  HARD = 3
  VERY_HARD = 4
- "type":
  "1" = chỉ có 1 đáp án đúng
  "2" = có nhiều đáp án đúng
- "answers":
  - "content": nội dung đáp án
  - "is_true": true hoặc false

CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ, KHÔNG GIẢI THÍCH THÊM.
TRẢ VỀ ĐÚNG ${maxQuestions} CÂU HỎI HOÀN CHỈNH, KHÔNG CẮT DỞ GIỮA CHỪNG.`;

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[GeminiService] Generating quiz from PDF - Attempt ${attempt}/${maxRetries}`);

        const response = await this.analyzeFile(filePath, prompt);

        console.log(`[GeminiService] Raw response length: ${response.length}`);
        console.log(`[GeminiService] First 200 chars: ${response.substring(0, 200)}`);
        console.log(`[GeminiService] Last 200 chars: ${response.substring(Math.max(0, response.length - 200))}`);

        // Clean and extract JSON
        const jsonText = this._cleanJsonResponse(response);

        console.log(`[GeminiService] Cleaned JSON length: ${jsonText.length}`);
        console.log(`[GeminiService] Cleaned JSON preview: ${jsonText.substring(0, 300)}...`);

        // Try to parse JSON
        let questions;
        try {
          questions = JSON.parse(jsonText);
          console.log('[GeminiService] Standard JSON parsing successful');
        } catch (parseError) {
          console.warn(`[GeminiService] Standard JSON parsing failed: ${parseError.message}`);

          // Log context around error position if available
          const match = parseError.message.match(/position (\d+)/);
          if (match) {
            const errorPos = parseInt(match[1]);
            const start = Math.max(0, errorPos - 100);
            const end = Math.min(jsonText.length, errorPos + 100);
            console.error('[GeminiService] Context around error position:');
            console.error(`... ${jsonText.substring(start, end)} ...`);
            console.error(`${' '.repeat(errorPos - start)}^ ERROR HERE (position ${errorPos})`);
          }

          console.log('[GeminiService] Attempting fallback partial parsing...');

          // Fallback: try to extract complete objects from partial JSON
          questions = this._parsePartialJson(jsonText);
        }

        // Validate structure
        if (!Array.isArray(questions)) {
          throw new Error('Response is not a JSON array');
        }

        if (questions.length === 0) {
          throw new Error('No questions found in response');
        }

        // Validate each question
        let validQuestions = 0;
        const finalQuestions = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (q.content && q.level && q.type && Array.isArray(q.answers) && q.answers.length > 0) {
            finalQuestions.push(q);
            validQuestions++;
          } else {
            console.warn(`[GeminiService] Skipping invalid question at index ${i}`);
          }
        }

        if (finalQuestions.length === 0) {
          throw new Error('No valid questions found after validation');
        }

        console.log(`[GeminiService] Successfully parsed ${finalQuestions.length} valid questions (${validQuestions}/${questions.length})`);
        return finalQuestions;

      } catch (error) {
        lastError = error;
        console.error(`[GeminiService] Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          console.log(`[GeminiService] Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // All retries failed
    console.error('[GeminiService] All retry attempts failed');
    throw new Error(`Failed to generate quiz from PDF after ${maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Generate quiz with auto-batching for large question counts
   * This method automatically fetches multiple batches if needed
   * @param {string} filePath - Path to PDF file
   * @param {number} totalQuestions - Total questions desired
   * @param {number} batchSize - Questions per batch (default: 10)
   * @returns {Promise<Array>} All questions
   */
  async generateQuizWithAutoBatch(filePath, totalQuestions, batchSize = 10) {
    console.log(`[GeminiService] Auto-batch generation: ${totalQuestions} questions, batch size: ${batchSize}`);

    const allQuestions = [];
    const batches = Math.ceil(totalQuestions / batchSize);
    let extractedCount = 0;

    for (let batchNum = 1; batchNum <= batches && extractedCount < totalQuestions; batchNum++) {
      console.log(`[GeminiService] Fetching batch ${batchNum}/${batches}...`);

      const startQuestion = extractedCount + 1;
      const questionsNeeded = Math.min(batchSize, totalQuestions - extractedCount);

      const prompt = `Bạn là hệ thống tạo câu hỏi trắc nghiệm từ tài liệu.

NHIỆM VỤ:
Trích xuất câu hỏi từ số ${startQuestion} đến số ${startQuestion + questionsNeeded - 1} từ tài liệu PDF (tổng cộng ${questionsNeeded} câu hỏi).

YÊU CẦU NGHIÊM NGẶT:
1. BẮT ĐẦU từ câu hỏi thứ ${startQuestion} trong tài liệu.
2. KẾT THÚC ở câu hỏi thứ ${startQuestion + questionsNeeded - 1}.
3. TRẢ VỀ ĐÚNG ${questionsNeeded} CÂU HỎI.
4. CHỈ TRẢ VỀ JSON ARRAY, KHÔNG THÊM TEXT KHÁC.

FORMAT:
[
  {
    "content": "Nội dung câu hỏi?",
    "level": 1,
    "type": "1",
    "answers": [
      {"content": "Đáp án 1", "is_true": false},
      {"content": "Đáp án 2", "is_true": true}
    ]
  }
]

QUY TẮC:
- level: {1=EASY, 2=MEDIUM, 3=HARD, 4=VERY_HARD}
- type: {"1"=1 đáp án đúng, "2"=nhiều đáp án đúng}

CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CẮT DỞ GIỮA CHỪNG.`;

      try {
        const response = await this.analyzeFile(filePath, prompt);
        const jsonText = this._cleanJsonResponse(response);

        let questions;
        try {
          questions = JSON.parse(jsonText);
        } catch (parseError) {
          console.warn(`[GeminiService] Batch ${batchNum} parse failed, using fallback...`);
          questions = this._parsePartialJson(jsonText);
        }

        if (Array.isArray(questions) && questions.length > 0) {
          allQuestions.push(...questions);
          extractedCount += questions.length;
          console.log(`[GeminiService] Batch ${batchNum} extracted ${questions.length} questions (total: ${extractedCount})`);

          // If we got less than requested, PDF might have ended
          if (questions.length < questionsNeeded * 0.8) {
            console.log(`[GeminiService] Batch returned less than 80% of requested, assuming PDF end`);
            break;
          }

          // Delay between batches
          if (batchNum < batches) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          console.warn(`[GeminiService] Batch ${batchNum} returned no questions`);
          break;
        }
      } catch (error) {
        console.error(`[GeminiService] Batch ${batchNum} failed: ${error.message}`);
        // If first batch fails, throw. Otherwise, return what we have
        if (batchNum === 1) throw error;
        break;
      }
    }

    console.log(`[GeminiService] Auto-batch completed: ${allQuestions.length} total questions`);
    return allQuestions;
  }

  /**
   * Start chunked quiz generation from PDF
   * Returns session ID for polling
   * @param {string} filePath - Path to PDF file
   * @param {number} questionsPerChunk - Questions per chunk (default: 10, max: 12)
   * @returns {Promise<Object>} Session info
   */
  async startChunkedQuizGeneration(filePath, questionsPerChunk = 10) {
    // Limit to max 12 to avoid response too large
    questionsPerChunk = Math.min(questionsPerChunk, 12);
    const sessionId = uuidv4();

    console.log(`[GeminiService] Starting chunked generation, session: ${sessionId}`);

    // Create session
    const session = sessionStore.createSession(sessionId, {
      filePath,
      questionsPerChunk,
      totalQuestions: [],
      currentChunk: 0,
      totalChunks: null, // Will be determined
      status: 'processing',
      error: null
    });

    // Start processing in background (don't await)
    this._processChunkedQuiz(sessionId, filePath, questionsPerChunk).catch(error => {
      console.error(`[GeminiService] Chunked generation failed for session ${sessionId}:`, error);
      sessionStore.updateSession(sessionId, {
        status: 'error',
        error: error.message
      });
    });

    return {
      sessionId,
      status: 'processing',
      message: 'Quiz generation started. Poll /api/v1/gemini/quiz/session/:sessionId to get progress.'
    };
  }

  /**
   * Process quiz generation in chunks (background task)
   * @private
   */
  async _processChunkedQuiz(sessionId, filePath, questionsPerChunk) {
    try {
      const prompt = `Bạn là hệ thống tạo câu hỏi trắc nghiệm từ tài liệu.

NHIỆM VỤ:
Trích xuất CHÍNH XÁC ${questionsPerChunk} câu hỏi ĐẦU TIÊN từ tài liệu PDF.

YÊU CẦU NGHIÊM NGẶT:
1. CHỈ TRẢ VỀ ĐÚNG ${questionsPerChunk} CÂU HỎI, KHÔNG NHIỀU HỚN, KHÔNG ÍT HƠN.
2. BẮT ĐẦU TỪ CÂU HỎI ĐẦU TIÊN TRONG TÀI LIỆU.
3. CHỈ TRẢ VỀ JSON ARRAY, KHÔNG GIẢI THÍCH, KHÔNG THÊM TEXT.
4. Nếu tài liệu có ít hơn ${questionsPerChunk} câu, chỉ trả về số câu có sẵn.

FORMAT TRẢ RA (BẮT BUỘC):
[
  {
    "content": "Nội dung câu hỏi?",
    "level": 1,
    "type": "1",
    "answers": [
      {
        "content": "Nội dung đáp án",
        "is_true": false
      },
      {
        "content": "Nội dung đáp án",
        "is_true": true
      }
    ]
  }
]

QUY TẮC:
- "content": Nội dung câu hỏi.
- "level": chỉ nhận giá trị {1,2,3,4} tương ứng:
  EASY = 1
  MEDIUM = 2
  HARD = 3
  VERY_HARD = 4
- "type":
  "1" = chỉ có 1 đáp án đúng
  "2" = có nhiều đáp án đúng
- "answers":
  - "content": đáp án
  - "is_true": true/false

CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ, TỐI ĐA ${questionsPerChunk} CÂU HỎI.`;

      // First attempt - get initial chunk
      console.log(`[GeminiService] Processing chunk 1 for session ${sessionId}`);
      const response = await this.analyzeFile(filePath, prompt);
      const jsonText = this._cleanJsonResponse(response);

      let questions;
      try {
        questions = JSON.parse(jsonText);
      } catch (parseError) {
        questions = this._parsePartialJson(jsonText);
      }

      // Filter valid questions
      const validQuestions = questions.filter(q =>
        q.content && q.level && q.type && Array.isArray(q.answers) && q.answers.length > 0
      );

      console.log(`[GeminiService] Chunk 1 extracted ${validQuestions.length} questions`);

      // Update session with first chunk
      sessionStore.updateSession(sessionId, {
        totalQuestions: validQuestions,
        currentChunk: 1,
        status: validQuestions.length < questionsPerChunk ? 'completed' : 'processing'
      });

      // If we got full chunk (or close to it), there might be more questions
      // Generate continuation prompts
      const isFullChunk = validQuestions.length >= Math.floor(questionsPerChunk * 0.8); // 80% threshold

      if (isFullChunk) {
        let chunkNumber = 2;
        let hasMore = true;

        while (hasMore && chunkNumber <= 10) { // Max 10 chunks (10*10 = 100 questions max)
          console.log(`[GeminiService] Processing chunk ${chunkNumber} for session ${sessionId}`);

          const startQuestion = (chunkNumber - 1) * questionsPerChunk + 1;
          const endQuestion = chunkNumber * questionsPerChunk;

          const continuationPrompt = `Tiếp tục trích xuất câu hỏi từ tài liệu PDF.

YÊU CẦU CỤ THỂ:
- BẮT ĐẦU: Câu hỏi số ${startQuestion}
- KẾT THÚC: Câu hỏi số ${endQuestion}
- TỔNG CỘNG: ${questionsPerChunk} câu hỏi

QUY TẮC:
1. BỎ QUA ${(chunkNumber - 1) * questionsPerChunk} câu hỏi đầu tiên (đã xử lý).
2. Chỉ trích xuất ${questionsPerChunk} câu TIẾP THEO.
3. CHỈ TRẢ VỀ JSON ARRAY, không giải thích.
4. Nếu không còn đủ ${questionsPerChunk} câu, trả về số câu còn lại.

FORMAT: [{"content": "...", "level": 1, "type": "1", "answers": [...]}]`;

          try {
            const chunkResponse = await this.analyzeFile(filePath, continuationPrompt);
            const chunkJsonText = this._cleanJsonResponse(chunkResponse);

            let chunkQuestions;
            try {
              chunkQuestions = JSON.parse(chunkJsonText);
            } catch (e) {
              chunkQuestions = this._parsePartialJson(chunkJsonText);
            }

            const validChunkQuestions = chunkQuestions.filter(q =>
              q.content && q.level && q.type && Array.isArray(q.answers) && q.answers.length > 0
            );

            console.log(`[GeminiService] Chunk ${chunkNumber} extracted ${validChunkQuestions.length} questions`);

            // Get current session data
            const currentSession = sessionStore.getSession(sessionId);
            const allQuestions = [...currentSession.totalQuestions, ...validChunkQuestions];

            // Update session
            sessionStore.updateSession(sessionId, {
              totalQuestions: allQuestions,
              currentChunk: chunkNumber
            });

            // Check if we should continue
            // Stop if we got less than 80% of expected questions
            const isPartialChunk = validChunkQuestions.length < Math.floor(questionsPerChunk * 0.8);

            if (isPartialChunk || validChunkQuestions.length === 0) {
              console.log(`[GeminiService] Stopping: Got ${validChunkQuestions.length} questions (less than threshold)`);
              hasMore = false;
            } else {
              chunkNumber++;
              console.log(`[GeminiService] Continuing to chunk ${chunkNumber}...`);
              // Add delay between chunks to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 3000));
            }

          } catch (chunkError) {
            console.error(`[GeminiService] Error processing chunk ${chunkNumber}:`, chunkError);
            hasMore = false;
          }
        }
      }

      // Mark as completed
      const finalSession = sessionStore.getSession(sessionId);
      sessionStore.updateSession(sessionId, {
        status: 'completed',
        totalChunks: finalSession.currentChunk
      });

      console.log(`[GeminiService] Completed session ${sessionId} with ${finalSession.totalQuestions.length} total questions`);

    } catch (error) {
      console.error(`[GeminiService] Fatal error in chunked processing:`, error);
      throw error;
    }
  }

  /**
   * Get chunked quiz generation status and results
   * @param {string} sessionId - Session ID
   * @returns {Object} Session status and questions
   */
  getChunkedQuizStatus(sessionId) {
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      throw new Error('Session not found or expired');
    }

    return {
      sessionId: session.id,
      status: session.status,
      currentChunk: session.currentChunk,
      totalChunks: session.totalChunks,
      totalQuestions: session.totalQuestions.length,
      questions: session.totalQuestions,
      error: session.error
    };
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   */
  deleteSession(sessionId) {
    return sessionStore.deleteSession(sessionId);
  }
}

module.exports = new GeminiService();
