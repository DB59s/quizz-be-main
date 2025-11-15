const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

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
   * This is a fallback when JSON.parse fails
   */
  _parsePartialJson(jsonText) {
    console.log('[GeminiService] Attempting partial JSON parsing...');

    const questions = [];
    let depth = 0;
    let currentObject = '';
    let inString = false;
    let escapeNext = false;

    // Skip the opening '['
    let startIndex = jsonText.indexOf('[');
    if (startIndex === -1) {
      throw new Error('No array start found');
    }

    for (let i = startIndex + 1; i < jsonText.length; i++) {
      const char = jsonText[i];

      // Handle string escaping
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

      // Track if we're inside a string
      if (char === '"') {
        inString = !inString;
        currentObject += char;
        continue;
      }

      // Only track depth when not in string
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

          // Complete object found
          if (depth === 0 && currentObject.trim()) {
            try {
              const obj = JSON.parse(currentObject);
              // Validate structure
              if (obj.content && obj.level && obj.type && Array.isArray(obj.answers)) {
                questions.push(obj);
                console.log(`[GeminiService] Extracted question ${questions.length}`);
              }
            } catch (e) {
              console.warn(`[GeminiService] Failed to parse object: ${e.message}`);
            }
            currentObject = '';
          }
        } else {
          if (depth > 0) {
            currentObject += char;
          }
        }
      } else {
        currentObject += char;
      }
    }

    if (questions.length === 0) {
      throw new Error('No valid questions extracted from partial JSON');
    }

    console.log(`[GeminiService] Partial parsing recovered ${questions.length} questions`);
    return questions;
  }

  /**
   * Generate quiz questions from PDF file with retry mechanism
   */
  async generateQuizFromPDF(filePath, maxRetries = 3) {
    const prompt = `Bạn là hệ thống tạo câu hỏi trắc nghiệm từ tài liệu.

Nhiệm vụ:
- Đọc file đề kiểm tra mà tôi cung cấp.
- Tự động trích xuất TẤT CẢ các câu hỏi có trong tài liệu.
- Với mỗi câu hỏi, hãy sinh ra output CHUẨN dưới dạng JSON theo mẫu tôi cung cấp.

YÊU CẦU QUAN TRỌNG:
1. Mỗi câu hỏi phải được trả về dưới dạng 1 object JSON.
2. CHỈ TRẢ VỀ JSON ARRAY, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC.
3. Không được tự tạo thêm câu hỏi nếu tài liệu không có.
4. Nếu tài liệu có câu hỏi tự luận → chuyển sang dạng trắc nghiệm hợp lý nhất.

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

CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ, KHÔNG GIẢI THÍCH THÊM.`;

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
}

module.exports = new GeminiService();
