# Chatbot RAG System

Hệ thống chatbot với Retrieval-Augmented Generation (RAG) sử dụng vector database để truy xuất thông tin từ tài liệu.

## 🎯 Tổng quan

Dự án này bao gồm 2 service chính:

1. **Data Pipeline Service**: Xử lý file text và tạo vector database
   - Chunking: Chia document thành các chunks có semantic
   - Normalization: Chuẩn hóa text
   - Embedding: Tạo embeddings với multilingual-e5-large
   - Storage: Lưu vào ChromaDB

2. **API Service**: REST API để query và lấy thông tin
   - Endpoint `/query`: Nhận câu hỏi và trả về các nguồn thông tin liên quan
   - Endpoint `/health`: Kiểm tra trạng thái service
   - Endpoint `/stats`: Thống kê về database

## 📁 Cấu trúc dự án

```
chatbot-rag-system/
├── core/                   # Shared modules
│   ├── config.py           # Configuration settings
│   └── vector_store.py     # ChromaDB wrapper
│
├── data_pipeline/          # Service 1: Data processing
│   ├── chunker.py          # Document chunking
│   ├── normalizer.py       # Text normalization
│   └── pipeline.py         # Pipeline orchestrator
│
├── api_service/            # Service 2: REST API
│   ├── main.py             # FastAPI application
│   ├── models.py           # Pydantic models
│   └── query_engine.py     # Query logic
│
├── scripts/                # Utility scripts
│   ├── run_pipeline.py     # Chạy data pipeline
│   ├── run_api.py          # Chạy API server
│   └── test_api.py         # Test API
│
├── data/                   # Data files
│   ├── input/              # Input text files
│   └── chromadb/           # Vector database storage
│
├── requirements.txt        # Dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🚀 Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
# Tạo virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

### 2. Cấu hình environment variables (optional)

```bash
# Copy .env.example thành .env
cp .env.example .env

# Chỉnh sửa .env nếu cần thay đổi cấu hình
```

## 📝 Sử dụng

### Service 1: Data Pipeline

Xử lý file text và tạo vector database.

#### Xử lý một file:

```bash
python scripts/run_pipeline.py --file data/input/text.txt
```

#### Xử lý tất cả files trong thư mục:

```bash
python scripts/run_pipeline.py --directory data/input
```

#### Thêm vào collection hiện có (không tạo mới):

```bash
python scripts/run_pipeline.py --file data/input/text.txt --no-recreate
```

**Quy trình xử lý (Optimized Streaming):**
1. Đọc file text
2. Chunking (chia document thành chunks có semantic)
3. Normalize (chuẩn hóa text - giữ tối đa thông tin)
4. Stream processing: Embed và upload theo batch → ChromaDB

**Đặc điểm:** Không lưu file trung gian, xử lý trực tiếp, tiết kiệm RAM

### Service 2: API Server

Chạy REST API để query vector database.

#### Khởi động API server:

```bash
python scripts/run_api.py
```

API sẽ chạy tại: `http://localhost:8000`

#### Endpoints:

**1. Health Check**
```bash
GET http://localhost:8000/health
```

**2. Query (Hỏi đáp)**
```bash
POST http://localhost:8000/query
Content-Type: application/json

{
  "question": "Tiến trình trong hệ điều hành là gì?",
  "top_k": 10,
  "filter_chapter": null,
  "filter_section": null
}
```

**Response:**
```json
{
  "question": "Tiến trình trong hệ điều hành là gì?",
  "total_sources": 10,
  "sources": [
    {
      "rank": 1,
      "chunk_id": "chunk_0042",
      "similarity_score": 0.892,
      "chapter": "CHƯƠNG 2: QUẢN LÝ TIẾN TRÌNH",
      "section": "2.1 Khái niệm tiến trình",
      "content": "Tiến trình là một chương trình đang thực thi...",
      "estimated_tokens": 384,
      "type": "section_content"
    },
    ...
  ]
}
```

**3. Stats**
```bash
GET http://localhost:8000/stats
```

#### Test API:

```bash
python scripts/test_api.py
```

### API Documentation (Swagger UI)

Truy cập: `http://localhost:8000/docs`

## 🔧 Sử dụng qua Python

### Data Pipeline

```python
from data_pipeline import DataPipeline

# Khởi tạo pipeline
pipeline = DataPipeline()

# Xử lý file
pipeline.process_file("data/input/text.txt")

# Xử lý thư mục
pipeline.process_directory("data/input")
```

### Query Engine

```python
from api_service import QueryEngine

# Khởi tạo query engine
engine = QueryEngine()

# Query
results = engine.search(
    question="Tiến trình trong hệ điều hành là gì?",
    top_k=10
)

# In kết quả
for result in results:
    print(f"Rank {result['rank']}: {result['chapter']}")
    print(f"Content: {result['content'][:200]}...")
```

## 🔌 Tích hợp với ứng dụng

### Sử dụng requests (Python)

```python
import requests

# Query API
response = requests.post(
    "http://localhost:8000/query",
    json={
        "question": "Bộ nhớ ảo là gì?",
        "top_k": 10
    }
)

data = response.json()
print(f"Tìm thấy {data['total_sources']} nguồn")

for source in data['sources']:
    print(f"Rank {source['rank']}: {source['chapter']}")
```

### Sử dụng curl

```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Bộ nhớ ảo là gì?",
    "top_k": 10
  }'
```

### Sử dụng JavaScript (fetch)

```javascript
fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: 'Bộ nhớ ảo là gì?',
    top_k: 10
  })
})
  .then(response => response.json())
  .then(data => {
    console.log(`Tìm thấy ${data.total_sources} nguồn`);
    data.sources.forEach(source => {
      console.log(`Rank ${source.rank}: ${source.chapter}`);
    });
  });
```

## ⚙️ Cấu hình

Các cấu hình có thể thay đổi trong file `.env` hoặc [core/config.py](core/config.py):

- `EMBEDDING_MODEL`: Model embedding (default: intfloat/multilingual-e5-large)
- `MAX_TOKENS`: Số tokens tối đa mỗi chunk (default: 512)
- `COLLECTION_NAME`: Tên collection trong ChromaDB
- `API_HOST`: Host cho API server (default: 0.0.0.0)
- `API_PORT`: Port cho API server (default: 8000)
- `DEFAULT_TOP_K`: Số lượng kết quả mặc định (default: 10)

## 📊 Luồng xử lý

### Data Pipeline Flow (Optimized Streaming)
```
File Text (.txt)
    ↓
[Chunking] → Chia thành chunks có semantic
    ↓
[Normalize] → Chuẩn hóa text (giữ tối đa thông tin)
    ↓
[Stream Processing]
    ↓
    Batch 1: Prepare → Embed → Upload
    Batch 2: Prepare → Embed → Upload
    Batch N: Prepare → Embed → Upload
    ↓
[ChromaDB] → Vector database

✓ Không lưu file trung gian
✓ Xử lý theo batch → Tiết kiệm RAM
✓ Text file → Vector DB trực tiếp
```

### Query Flow
```
Câu hỏi từ user
    ↓
[Embedding] → Embed câu hỏi
    ↓
[Vector Search] → Tìm kiếm trong ChromaDB
    ↓
[Ranking] → Sắp xếp theo similarity score
    ↓
[Response] → Trả về top K nguồn thông tin
```

## 🧪 Testing

Chạy test suite:

```bash
# Test API
python scripts/test_api.py
```

## 📦 Dependencies chính

- **sentence-transformers**: Embedding với multilingual-e5-large
- **chromadb**: Vector database
- **fastapi**: REST API framework
- **uvicorn**: ASGI server
- **pydantic**: Data validation

## 🔒 Security Notes

- Trong production, nên giới hạn CORS origins trong [api_service/main.py](api_service/main.py:39)
- Thêm authentication/authorization nếu cần
- Rate limiting cho API endpoints

## 📄 License

MIT License

## 👥 Contributing

Pull requests are welcome!

## 📧 Contact

Để được hỗ trợ, vui lòng mở issue trên GitHub.
