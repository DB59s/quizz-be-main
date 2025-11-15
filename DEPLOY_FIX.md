# Deploy JSON Parsing Fix

## Vấn đề đã fix:
1. ✅ Improved `_parsePartialJson()` to extract only COMPLETE questions
2. ✅ Added regex-based extraction as primary method
3. ✅ Added detailed error context logging (shows 200 chars around error position)
4. ✅ Limited old API to max 10 questions to prevent large responses

## Để deploy lên server:

### Bước 1: Commit code (local machine)
```bash
cd /d/quizz-be-main
git add chatbot-service-api/src/service/gemini.service.js
git commit -m "Fix: Improve JSON parsing to handle truncated responses

- Enhanced _parsePartialJson with regex extraction
- Extract only complete question objects
- Add error context logging
- Limit old API to 10 questions max"
git push origin fix/fix-gen
```

### Bước 2: Pull code trên server
```bash
cd ~/quizz-be-main
git pull origin fix/fix-gen
```

### Bước 3: Rebuild Docker image
```bash
# Rebuild only chatbot service
docker-compose build chatbot-service-api

# hoặc rebuild tất cả
docker-compose build
```

### Bước 4: Restart service
```bash
docker-compose down
docker-compose up -d
```

### Bước 5: Verify service is running
```bash
docker ps | grep chatbot
docker logs quiz_chatbot_service_api --tail 50
```

### Bước 6: Test với PDF
Upload PDF và xem logs:
```bash
docker logs quiz_chatbot_service_api -f
```

## Expected logs khi thành công:

```
[GeminiService] Generating quiz from PDF - Attempt 1/3
[GeminiService] Raw response length: 4868
[GeminiService] Cleaned JSON length: 4850
[GeminiService] Standard JSON parsing failed: Unexpected token , in JSON at position 500
[GeminiService] Context around error position:
... "is_true": false }, { "content": "Kết mạc không bị hoại tử.", "is_true": fal ...
                                                                               ^ ERROR HERE
[GeminiService] Attempting partial JSON parsing...
[GeminiService] Input text length: 4850
[GeminiService] ✓ Extracted complete question 1: "Bỏng mức độ nhẹ, yếu tố nào không đúng?..."
[GeminiService] ✓ Extracted complete question 2: "Xử trí bỏng hóa chất..."
[GeminiService] ✓ Manual parse extracted question 3
[GeminiService] ✓ Partial parsing recovered 8 complete questions
[GeminiService] Successfully generated 8 questions from PDF
```

## Alternative: Nếu không muốn rebuild

Chỉ copy file mới vào container:
```bash
# Copy file from local to server
scp chatbot-service-api/src/service/gemini.service.js user@server:~/quizz-be-main/chatbot-service-api/src/service/

# On server: Copy vào container
docker cp ~/quizz-be-main/chatbot-service-api/src/service/gemini.service.js quiz_chatbot_service_api:/app/src/service/gemini.service.js

# Restart container
docker-compose restart chatbot-service-api
```

## Troubleshooting

### Vẫn thấy lỗi "No valid questions extracted"
- Check log context để xem JSON bị lỗi gì
- Có thể Gemini trả về format khác, cần adjust regex pattern

### Response vẫn quá dài
- API cũ đã limit 10 questions rồi
- Nếu vẫn lớn, dùng API chunked: `POST /api/v1/gemini/quiz/chunked`

### Container không start
```bash
docker logs quiz_chatbot_service_api
# Check for syntax errors
```
