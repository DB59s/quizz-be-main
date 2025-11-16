# Frontend Guide: Async Quiz Generation

## 📋 Overview

API đã được chuyển sang **Async Processing** để tránh timeout khi xử lý file PDF lớn (nhiều câu hỏi).

**Thay đổi chính:**
- Upload file → nhận `job_id` ngay lập tức (không chờ xử lý xong)
- Poll status API mỗi 2-3 giây để kiểm tra tiến độ
- Hiển thị progress bar cho user
- Khi xong → lấy kết quả từ status response

---

## 🔄 Flow Mới

### **Bước 1: Upload PDF**
```http
POST /api/v1/gemini/generate-quiz
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <PDF file>
```

**Response (202 Accepted - ngay lập tức):**
```json
{
  "success": true,
  "message": "Quiz generation started. Use the job_id to check status.",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "check_status_url": "/api/v1/gemini/quiz-status/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### **Bước 2: Poll Status (lặp lại mỗi 2-3 giây)**
```http
GET /api/v1/gemini/quiz-status/{job_id}
Authorization: Bearer <token>
```

**Response khi đang xử lý:**
```json
{
  "success": true,
  "message": "Job status retrieved successfully",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": "Processing chunk 2/3 (questions 41-80)",
    "total_questions": 97,
    "processed_questions": 40,
    "current_chunk": 2,
    "total_chunks": 3,
    "created_at": "2025-11-16T08:00:00Z",
    "started_at": "2025-11-16T08:00:01Z"
  }
}
```

**Response khi hoàn thành:**
```json
{
  "success": true,
  "message": "Job status retrieved successfully",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "progress": "Completed successfully",
    "total_questions": 97,
    "processed_questions": 97,
    "current_chunk": 3,
    "total_chunks": 3,
    "created_at": "2025-11-16T08:00:00Z",
    "started_at": "2025-11-16T08:00:01Z",
    "completed_at": "2025-11-16T08:01:15Z",
    "total": 97,
    "questions": [
      {
        "content": "Câu hỏi 1?",
        "level": 1,
        "type": "1",
        "answers": [
          { "content": "Đáp án A", "is_true": false },
          { "content": "Đáp án B", "is_true": true }
        ]
      },
      // ... 96 câu hỏi khác
    ]
  }
}
```

**Response khi thất bại:**
```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "failed",
    "progress": "Quiz generation failed",
    "error": "Failed to generate quiz from PDF. Response may not be valid JSON.",
    "completed_at": "2025-11-16T08:01:30Z"
  }
}
```

---

## 💻 Code Implementation

### **React Example (TypeScript)**

```typescript
import { useState } from 'react';
import axios from 'axios';

interface QuizJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: string;
  total_questions?: number;
  processed_questions?: number;
  current_chunk?: number;
  total_chunks?: number;
  total?: number;
  questions?: any[];
  error?: string;
}

export function QuizUploader() {
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<QuizJob | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // Step 1: Upload PDF
  const uploadPDF = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        '/api/v1/gemini/generate-quiz',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const { job_id } = response.data.data;
      setJobId(job_id);

      // Start polling
      pollJobStatus(job_id);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  // Step 2: Poll job status
  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `/api/v1/gemini/quiz-status/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const jobData: QuizJob = response.data.data;
        setStatus(jobData);

        if (jobData.status === 'completed') {
          // Success!
          clearInterval(interval);
          setQuestions(jobData.questions || []);
          setUploading(false);
          console.log('Quiz generated successfully!', jobData.questions);
        } else if (jobData.status === 'failed') {
          // Failed
          clearInterval(interval);
          setUploading(false);
          console.error('Quiz generation failed:', jobData.error);
        }
        // If status is 'processing', continue polling
      } catch (error) {
        clearInterval(interval);
        setUploading(false);
        console.error('Status check failed:', error);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (!status) return 0;
    if (status.total_questions && status.processed_questions) {
      return Math.round((status.processed_questions / status.total_questions) * 100);
    }
    return 0;
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadPDF(file);
        }}
        disabled={uploading}
      />

      {uploading && status && (
        <div className="progress-container">
          <p>{status.progress}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <p>
            {status.processed_questions || 0} / {status.total_questions || 0} câu hỏi
          </p>
          <p>
            Chunk {status.current_chunk || 0} / {status.total_chunks || 0}
          </p>
        </div>
      )}

      {questions.length > 0 && (
        <div className="questions-list">
          <h3>Đã tạo {questions.length} câu hỏi!</h3>
          {/* Render questions here */}
        </div>
      )}
    </div>
  );
}
```

### **Vue 3 Example (Composition API)**

```vue
<template>
  <div>
    <input
      type="file"
      accept=".pdf"
      @change="handleFileChange"
      :disabled="uploading"
    />

    <div v-if="uploading && status" class="progress-container">
      <p>{{ status.progress }}</p>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: getProgress() + '%' }"
        ></div>
      </div>
      <p>{{ status.processed_questions || 0 }} / {{ status.total_questions || 0 }} câu hỏi</p>
      <p>Chunk {{ status.current_chunk || 0 }} / {{ status.total_chunks || 0 }}</p>
    </div>

    <div v-if="questions.length > 0" class="questions-list">
      <h3>Đã tạo {{ questions.length }} câu hỏi!</h3>
      <!-- Render questions -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

interface QuizJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: string;
  total_questions?: number;
  processed_questions?: number;
  current_chunk?: number;
  total_chunks?: number;
  questions?: any[];
  error?: string;
}

const uploading = ref(false);
const jobId = ref<string | null>(null);
const status = ref<QuizJob | null>(null);
const questions = ref<any[]>([]);

const uploadPDF = async (file: File) => {
  uploading.value = true;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('/api/v1/gemini/generate-quiz', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    jobId.value = response.data.data.job_id;
    pollJobStatus(jobId.value);
  } catch (error) {
    console.error('Upload failed:', error);
    uploading.value = false;
  }
};

const pollJobStatus = async (id: string) => {
  const interval = setInterval(async () => {
    try {
      const response = await axios.get(`/api/v1/gemini/quiz-status/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      status.value = response.data.data;

      if (status.value?.status === 'completed') {
        clearInterval(interval);
        questions.value = status.value.questions || [];
        uploading.value = false;
      } else if (status.value?.status === 'failed') {
        clearInterval(interval);
        uploading.value = false;
        console.error('Failed:', status.value.error);
      }
    } catch (error) {
      clearInterval(interval);
      uploading.value = false;
      console.error('Status check failed:', error);
    }
  }, 3000);
};

const getProgress = () => {
  if (!status.value) return 0;
  if (status.value.total_questions && status.value.processed_questions) {
    return Math.round(
      (status.value.processed_questions / status.value.total_questions) * 100
    );
  }
  return 0;
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) uploadPDF(file);
};
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 20px;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}
</style>
```

---

## 🎯 Key Points

1. **Upload ngay lập tức nhận job_id** (không timeout)
2. **Poll status mỗi 3 giây** để cập nhật progress
3. **Hiển thị progress bar** với thông tin:
   - `progress`: Message hiện tại
   - `processed_questions / total_questions`: Số câu đã xử lý
   - `current_chunk / total_chunks`: Chunk hiện tại
4. **Khi `status === 'completed'`**:
   - Dừng polling
   - Lấy `data.questions` để hiển thị
5. **Khi `status === 'failed'`**:
   - Dừng polling
   - Hiển thị lỗi từ `data.error`

---

## ⏱️ Timing

- **Upload**: < 1 giây (chỉ tạo job)
- **Processing**: 60-75 giây cho 97 câu (3 chunks × 5s delay)
- **Polling interval**: 3 giây
- **Total time**: ~60-75 giây, không timeout!

---

## 🔧 Cleanup

Nếu user reload trang giữa chừng:
- Lưu `job_id` vào localStorage/sessionStorage
- Khi load lại, check job_id có tồn tại không
- Nếu có → tiếp tục poll status

```typescript
useEffect(() => {
  const savedJobId = localStorage.getItem('quiz_job_id');
  if (savedJobId) {
    pollJobStatus(savedJobId);
  }
}, []);

// Khi upload
const uploadPDF = async (file: File) => {
  // ...
  localStorage.setItem('quiz_job_id', job_id);
  // ...
};

// Khi hoàn thành
if (status === 'completed') {
  localStorage.removeItem('quiz_job_id');
}
```
