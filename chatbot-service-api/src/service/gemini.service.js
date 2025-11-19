const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
   * Generate quiz questions from PDF file
   */
  async generateQuizFromPDF(filePath) {
    const prompt = `Bạn là hệ thống tạo câu hỏi trắc nghiệm từ tài liệu.

Nhiệm vụ:
- Đọc file đề kiểm tra mà tôi cung cấp.
- Tự động trích xuất TẤT CẢ các câu hỏi có trong tài liệu.
- Với mỗi câu hỏi, hãy sinh ra output CHUẨN dưới dạng JSON theo mẫu tôi cung cấp.

YÊU CẦU QUAN TRỌNG:
1. Mỗi câu hỏi phải được trả về dưới dạng 1 object JSON.
2. Tuyệt đối không trả lời ngoài JSON.
3. Không được tự tạo thêm câu hỏi nếu tài liệu không có.
4. Nếu tài liệu có câu hỏi tự luận → chuyển sang dạng trắc nghiệm hợp lý nhất.

FORMAT TRẢ RA (YÊU CẦU BẮT BUỘC):
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
  - "content": "content": nội dung đáp án (KHÔNG CHỨA DẤU ")
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
      // Remove markdown code blocks if present
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const questions = JSON.parse(jsonText);
      return questions;
    } catch (error) {
      console.error('Error generating quiz from PDF:', error);
      throw new Error('Failed to generate quiz from PDF. Response may not be valid JSON.');
    }
  }
}

module.exports = new GeminiService();
