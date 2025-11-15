# Gemini Service Error Handling

## Vấn đề
Khi generate quiz từ PDF, Gemini API đôi khi trả về response không đúng format JSON, gây ra lỗi:
```
SyntaxError: Unexpected end of JSON input
```

## Nguyên nhân
1. **Gemini API không ổn định**: Response có thể bị cắt giữa chừng
2. **Response có markdown**: Gemini thêm ```json hoặc ``` vào response
3. **Response có text thừa**: Ngoài JSON còn có giải thích
4. **JSON không hợp lệ**: Thiếu dấu `]` hoặc `}` ở cuối

## Giải pháp đã implement

### 1. **Smart JSON Cleaning** (`_cleanJsonResponse`)
```javascript
_cleanJsonResponse(responseText) {
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Extract only JSON part (từ '[' đầu tiên đến ']' cuối cùng)
  const firstBracket = Math.max(cleaned.indexOf('['), cleaned.indexOf('{'));
  const lastBracket = isArray ? lastCloseBracket : lastCloseBrace;
  cleaned = cleaned.substring(firstBracket, lastBracket + 1);

  return cleaned;
}
```

**Xử lý:**
- Loại bỏ markdown code blocks (```json, ```)
- Tìm và extract chỉ phần JSON
- Loại bỏ text thừa trước/sau JSON

### 2. **Retry Mechanism**
```javascript
async generateQuizFromPDF(filePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Attempt to generate
      const response = await this.analyzeFile(filePath, prompt);
      const questions = JSON.parse(jsonText);
      return questions;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}
```

**Features:**
- Retry tối đa 3 lần
- Delay 2 giây giữa các retry
- Log chi tiết mỗi attempt

### 3. **Validation**
```javascript
// Validate structure
if (!Array.isArray(questions)) {
  throw new Error('Response is not a JSON array');
}

if (questions.length === 0) {
  throw new Error('No questions found in response');
}

// Validate each question
for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  if (!q.content || !q.level || !q.type || !Array.isArray(q.answers)) {
    throw new Error(`Invalid question structure at index ${i}`);
  }
}
```

**Kiểm tra:**
- Response phải là array
- Array không được rỗng
- Mỗi question phải có đầy đủ fields: content, level, type, answers

### 4. **Enhanced Logging**
```javascript
console.log(`[GeminiService] Raw response length: ${response.length}`);
console.log(`[GeminiService] First 200 chars: ${response.substring(0, 200)}`);
console.log(`[GeminiService] Last 200 chars: ${response.substring(Math.max(0, response.length - 200))}`);
console.log(`[GeminiService] Cleaned JSON length: ${jsonText.length}`);
console.log(`[GeminiService] Successfully parsed ${questions.length} questions`);
```

**Giúp debug:**
- Xem raw response từ Gemini
- Xem kết quả sau khi clean
- Track progress của retry

### 5. **Improved Prompt**
```
CHỈ TRẢ VỀ JSON ARRAY, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC.
...
CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ, KHÔNG GIẢI THÍCH THÊM.
```

**Nhấn mạnh:**
- Chỉ trả về JSON
- Không giải thích
- Format chuẩn

### 6. **Controller Error Handling**
```javascript
catch (error) {
  // Cleanup file
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // User-friendly error
  return res.status(500).json({
    success: false,
    message: 'Failed to generate quiz from PDF. Please ensure the PDF contains valid quiz questions and try again.',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

**Features:**
- Cleanup file tự động
- Error message thân thiện với user
- Chi tiết error chỉ show ở development

## Test Cases

### Test 1: Response có markdown
```javascript
// Input
`\`\`\`json
[{"content": "Question?", "level": 1}]
\`\`\``

// Output sau clean
`[{"content": "Question?", "level": 1}]`
```

### Test 2: Response có text thừa
```javascript
// Input
`Đây là kết quả:
[{"content": "Question?", "level": 1}]
Tổng cộng 1 câu hỏi.`

// Output sau clean
`[{"content": "Question?", "level": 1}]`
```

### Test 3: Response bị cắt
```javascript
// Attempt 1: Fail (incomplete JSON)
// Attempt 2: Success
// → Retry mechanism works
```

## Monitoring

Để debug lỗi, check logs:

```bash
docker logs quiz_chatbot_service_api -f | grep GeminiService
```

**Key logs:**
```
[GeminiService] Generating quiz from PDF - Attempt 1/3
[GeminiService] Raw response length: 5432
[GeminiService] First 200 chars: ...
[GeminiService] Last 200 chars: ...
[GeminiService] Cleaned JSON length: 5234
[GeminiService] Successfully parsed 10 questions
```

## Error Messages

### User sees:
```json
{
  "success": false,
  "message": "Failed to generate quiz from PDF. Please ensure the PDF contains valid quiz questions and try again."
}
```

### Dev sees (NODE_ENV=development):
```json
{
  "success": false,
  "message": "...",
  "error": "Failed to generate quiz from PDF after 3 attempts. Last error: Unexpected end of JSON input"
}
```

## Best Practices

### For Users:
1. Đảm bảo PDF có nội dung rõ ràng
2. PDF nên có câu hỏi và đáp án
3. Nếu fail, thử lại (retry tự động)

### For Developers:
1. Check logs để debug
2. Nếu vẫn fail sau 3 retries, có thể:
   - Tăng `maxRetries` (hiện tại: 3)
   - Tăng delay giữa retries (hiện tại: 2s)
   - Cải thiện prompt
   - Thử Gemini model khác

## Configuration

### Change max retries:
```javascript
// In controller
const questions = await geminiService.generateQuizFromPDF(filePath, 5); // 5 retries
```

### Change Gemini model:
```javascript
// In gemini.service.js constructor
this.model = this.genAI.getGenerativeModel({
  model: 'gemini-1.5-pro' // or other model
});
```

## Future Improvements

1. **Streaming response**: Xử lý response theo chunks
2. **Fallback mechanism**: Nếu Gemini fail, dùng backup service
3. **Caching**: Cache kết quả cho cùng PDF
4. **Rate limiting**: Tránh spam Gemini API
5. **Better validation**: Validate nội dung câu hỏi có hợp lý không
