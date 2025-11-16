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
        maxOutputTokens: 8192, // Tăng giới hạn token output
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
   * Get total number of questions in PDF
   */
  async getTotalQuestionsInPDF(filePath) {
    const prompt = `Đếm tổng số câu hỏi trong file PDF này.
Chỉ trả về 1 số nguyên duy nhất, không có text thêm.
Ví dụ: 97`;

    try {
      const response = await this.analyzeFile(filePath, prompt);
      const total = parseInt(response.trim());
      return isNaN(total) ? 0 : total;
    } catch (error) {
      console.error('Error counting questions:', error);
      // Nếu không đếm được, trả về 0 để fallback sang phương pháp khác
      return 0;
    }
  }

  /**
   * Generate quiz questions from PDF file with pagination
   */
  async generateQuizFromPDFChunk(filePath, startQuestion, endQuestion) {
    const prompt = `Bạn là hệ thống tạo câu hỏi trắc nghiệm từ tài liệu.

Nhiệm vụ:
- Đọc file đề kiểm tra mà tôi cung cấp.
- Trích xuất CHÍNH XÁC các câu hỏi từ câu ${startQuestion} đến câu ${endQuestion}.
- Với mỗi câu hỏi, hãy sinh ra output CHUẨN dưới dạng JSON theo mẫu tôi cung cấp.

YÊU CẦU QUAN TRỌNG:
1. CHỈ lấy các câu hỏi từ số ${startQuestion} đến số ${endQuestion}.
2. Mỗi câu hỏi phải được trả về dưới dạng 1 object JSON.
3. Tuyệt đối không trả lời ngoài JSON.
4. Không được tự tạo thêm câu hỏi nếu tài liệu không có.
5. Nếu tài liệu có câu hỏi tự luận → chuyển sang dạng trắc nghiệm hợp lý nhất.

FORMAT TRẢ RA (YÊU CẦU BẮT BUỘC):
[
  {
    "questionNumber": ${startQuestion},
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
- "questionNumber": Số thứ tự câu hỏi trong tài liệu gốc
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
  - "content": nội dung đáp án (KHÔNG CHỨA DẤU ")
  - "is_true": true/false

QUY ĐỊNH VỀ JSON:
Không được trả về bất kỳ nội dung nào ngoài JSON array.
JSON phải hợp lệ tuyệt đối.
Không được escape ký tự.
Không được tạo thêm câu hỏi không có trong tài liệu.
Câu hỏi tự luận phải chuyển thành trắc nghiệm hợp lý.
Chỉ trả về JSON array, không thêm bất kỳ text nào khác.`;

    try {
      const response = await this.analyzeFile(filePath, prompt);

      // Try to parse JSON response
      let jsonText = response.trim();

      // Remove markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Tìm vị trí bắt đầu và kết thúc của JSON array
      const startIndex = jsonText.indexOf('[');
      const endIndex = jsonText.lastIndexOf(']');

      if (startIndex === -1 || endIndex === -1) {
        console.error('No valid JSON array found in response');
        throw new Error('Response does not contain a valid JSON array');
      }

      jsonText = jsonText.substring(startIndex, endIndex + 1);

      const questions = JSON.parse(jsonText);

      if (!Array.isArray(questions)) {
        throw new Error('Response is not a valid array of questions');
      }

      return questions;
    } catch (error) {
      console.error(`Error generating questions ${startQuestion}-${endQuestion}:`, error);
      throw error;
    }
  }

  /**
   * Sleep function for rate limiting
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate quiz questions from PDF file (auto-chunking for large files)
   */
  async generateQuizFromPDF(filePath) {
    const QUESTIONS_PER_CHUNK = 40; // Số câu hỏi mỗi lần gọi API
    const DELAY_BETWEEN_REQUESTS = 15000; // 15 giây delay giữa mỗi request (4 req/minute max)

    try {
      console.log('Step 1: Counting total questions in PDF...');
      const totalQuestions = await this.getTotalQuestionsInPDF(filePath);
      console.log(`Total questions found: ${totalQuestions}`);

      // Delay sau khi count để tránh rate limit
      await this.sleep(DELAY_BETWEEN_REQUESTS);

      if (totalQuestions === 0) {
        // Fallback: Thử lấy toàn bộ nếu không đếm được
        console.log('Cannot count questions, trying to get all at once...');
        return await this.generateQuizFromPDFChunk(filePath, 1, 999);
      }

      // Tính số lần cần chia
      const numChunks = Math.ceil(totalQuestions / QUESTIONS_PER_CHUNK);
      console.log(`Will process in ${numChunks} chunks`);
      console.log(`Estimated time: ${Math.ceil((numChunks * DELAY_BETWEEN_REQUESTS) / 1000)} seconds`);

      const allQuestions = [];

      // Xử lý từng chunk
      for (let i = 0; i < numChunks; i++) {
        const startQuestion = i * QUESTIONS_PER_CHUNK + 1;
        const endQuestion = Math.min((i + 1) * QUESTIONS_PER_CHUNK, totalQuestions);

        console.log(`[${new Date().toISOString()}] Processing chunk ${i + 1}/${numChunks}: questions ${startQuestion}-${endQuestion}`);

        try {
          const chunkQuestions = await this.generateQuizFromPDFChunk(
            filePath,
            startQuestion,
            endQuestion
          );

          console.log(`Chunk ${i + 1} returned ${chunkQuestions.length} questions`);

          // Loại bỏ questionNumber trước khi thêm vào kết quả
          const cleanedQuestions = chunkQuestions.map(q => {
            const { questionNumber, ...rest } = q;
            return rest;
          });

          allQuestions.push(...cleanedQuestions);

          // Delay giữa các request để tránh rate limit (15 giây = 4 requests/minute)
          if (i < numChunks - 1) {
            console.log(`Waiting ${DELAY_BETWEEN_REQUESTS / 1000} seconds before next request...`);
            await this.sleep(DELAY_BETWEEN_REQUESTS);
          }
        } catch (error) {
          console.error(`Failed to process chunk ${i + 1}:`, error.message);

          // Nếu lỗi là rate limit, chờ lâu hơn
          if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
            console.log('Rate limit detected, waiting 60 seconds...');
            await this.sleep(60000);

            // Retry chunk này
            try {
              console.log(`Retrying chunk ${i + 1}...`);
              const chunkQuestions = await this.generateQuizFromPDFChunk(
                filePath,
                startQuestion,
                endQuestion
              );
              const cleanedQuestions = chunkQuestions.map(q => {
                const { questionNumber, ...rest } = q;
                return rest;
              });
              allQuestions.push(...cleanedQuestions);
              console.log(`Retry successful for chunk ${i + 1}`);
            } catch (retryError) {
              console.error(`Retry failed for chunk ${i + 1}:`, retryError.message);
              // Tiếp tục với chunk tiếp theo
              continue;
            }
          } else {
            // Lỗi khác, tiếp tục với chunk tiếp theo
            continue;
          }
        }
      }

      console.log(`Total questions extracted: ${allQuestions.length}/${totalQuestions}`);

      if (allQuestions.length === 0) {
        throw new Error('No questions could be extracted from the PDF');
      }

      return allQuestions;
    } catch (error) {
      console.error('Error generating quiz from PDF:', error);
      throw new Error('Failed to generate quiz from PDF. Response may not be valid JSON.');
    }
  }
}

module.exports = new GeminiService();
