# 🗄️ CƠ SỞ DỮ LIỆU TRI THỨC - KNOWLEDGE DATABASE

## 📍 Vị trí lưu trữ

### **1. Trong Docker Container**
```
Container: quiz_knowledge_service_api
Path: /app/data/chromadb/
```

### **2. Trên Host Machine (Docker Volume)**
```
Volume Name: knowledge_chromadb_data
Type: Docker Named Volume
Driver: local
```

### **3. Kiểm tra vị trí thực tế trên host:**
```bash
# Xem thông tin volume
docker volume inspect knowledge_chromadb_data

# Output:
[
    {
        "CreatedAt": "2024-12-01T10:30:00Z",
        "Driver": "local",
        "Labels": {
            "com.docker.compose.project": "quizz-be-main",
            "com.docker.compose.version": "2.20.2",
            "com.docker.compose.volume": "knowledge_chromadb_data"
        },
        "Mountpoint": "/var/lib/docker/volumes/quizz-be-main_knowledge_chromadb_data/_data",
        "Name": "quizz-be-main_knowledge_chromadb_data",
        "Options": null,
        "Scope": "local"
    }
]
```

**Vị trí thực tế:**
- **Linux/Mac:** `/var/lib/docker/volumes/quizz-be-main_knowledge_chromadb_data/_data`
- **Windows (WSL2):** `\\wsl$\docker-desktop-data\data\docker\volumes\quizz-be-main_knowledge_chromadb_data\_data`
- **Windows (Docker Desktop):** Trong WSL2 filesystem

## 🏗️ Cấu trúc cơ sở dữ liệu

### **ChromaDB Directory Structure:**
```
/app/data/chromadb/
├── chroma.sqlite3                    # SQLite database - Metadata storage
└── [collection_uuid]/                # Mỗi collection có 1 thư mục riêng
    ├── data_level0.bin               # Vector embeddings (HNSW index level 0)
    ├── header.bin                    # Header information
    ├── length.bin                    # Length information
    └── link_lists.bin                # HNSW graph structure
```

### **Chi tiết các file:**

#### **1. chroma.sqlite3**
- **Loại:** SQLite database
- **Chứa:**
  - Collection metadata (name, id, configuration)
  - Document metadata (chunk_id, chapter, section, type, etc.)
  - Embeddings configuration
- **Kích thước:** Nhỏ (~1-10 MB tùy số documents)

#### **2. data_level0.bin**
- **Loại:** Binary file
- **Chứa:** Vector embeddings (1024 dimensions per vector)
- **Kích thước:** Lớn nhất (~4KB per document)
- **Ví dụ:** 1000 documents ≈ 4 MB

#### **3. header.bin, length.bin, link_lists.bin**
- **Loại:** Binary files
- **Chứa:** HNSW (Hierarchical Navigable Small World) index structure
- **Mục đích:** Tăng tốc vector similarity search
- **Kích thước:** Nhỏ (~100KB - 1MB)

## 📊 Dữ liệu được lưu như thế nào?

### **1. Document Chunking:**
```
Original Text File (textbook.txt)
         ↓
    Chunking Process
         ↓
Multiple Chunks (245 chunks)
```

### **2. Mỗi Chunk chứa:**
```json
{
  "chunk_id": "chunk_0042",
  "content": "Tiến trình là một chương trình đang thực thi...",
  "chapter": "CHƯƠNG 2: QUẢN LÝ TIẾN TRÌNH",
  "section": "2.1 Khái niệm tiến trình",
  "context": "CHƯƠNG 2: QUẢN LÝ TIẾN TRÌNH\n2.1 Khái niệm tiến trình",
  "estimated_tokens": 384,
  "type": "section_content"
}
```

### **3. Embedding Process:**
```
Chunk Content
     ↓
Sentence Transformer (multilingual-e5-large)
     ↓
Vector Embedding (1024 dimensions)
     ↓
[0.123, -0.456, 0.789, ..., 0.321]  # 1024 numbers
```

### **4. Storage in ChromaDB:**
```
SQLite (chroma.sqlite3):
  - chunk_id: "chunk_0042"
  - metadata: {chapter, section, type, ...}
  - embedding_id: pointer to binary file

Binary Files (data_level0.bin):
  - embedding_id → [0.123, -0.456, ..., 0.321]
```

## 🔍 Query Process

### **Khi user query "Tiến trình là gì?":**

```
1. User Query
   ↓
2. Embed Query → Vector [0.234, -0.567, ...]
   ↓
3. ChromaDB Vector Search (HNSW index)
   ↓
4. Calculate Cosine Similarity với tất cả vectors
   ↓
5. Rank by similarity score
   ↓
6. Return Top 10 chunks với metadata
```

## 💾 Kích thước dữ liệu

### **Ước tính:**

| Số Documents | Vector Data | Metadata | HNSW Index | Total |
|--------------|-------------|----------|------------|-------|
| 100 | ~400 KB | ~1 MB | ~100 KB | ~1.5 MB |
| 1,000 | ~4 MB | ~5 MB | ~500 KB | ~10 MB |
| 10,000 | ~40 MB | ~50 MB | ~5 MB | ~95 MB |
| 100,000 | ~400 MB | ~500 MB | ~50 MB | ~950 MB |

### **Công thức tính:**
```
Vector Size per Document = 1024 dimensions × 4 bytes (float32) = 4 KB
Metadata per Document ≈ 5 KB (text + metadata)
HNSW Index ≈ 5% of total vector size
```

## 🔄 Persistence (Lưu trữ lâu dài)

### **Docker Volume Benefits:**

1. **Persistent:** Dữ liệu không mất khi container restart
2. **Isolated:** Mỗi project có volume riêng
3. **Portable:** Có thể backup/restore dễ dàng
4. **Performance:** Tối ưu hơn bind mount

### **Khi nào dữ liệu bị mất?**

❌ **BỊ MẤT:**
- Xóa volume: `docker volume rm knowledge_chromadb_data`
- Xóa container với `-v` flag: `docker rm -v quiz_knowledge_service_api`
- `docker-compose down -v` (xóa tất cả volumes)

✅ **KHÔNG MẤT:**
- `docker-compose down` (không có -v)
- `docker-compose restart`
- `docker-compose up -d` (rebuild)
- Container crash/stop

## 🔐 Backup và Restore

### **1. Backup Volume:**
```bash
# Tạo backup file
docker run --rm \
  -v quizz-be-main_knowledge_chromadb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/knowledge_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Output: knowledge_backup_20241201_103000.tar.gz
```

### **2. Restore Volume:**
```bash
# Stop service trước
docker-compose stop knowledge-service-api

# Restore từ backup
docker run --rm \
  -v quizz-be-main_knowledge_chromadb_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && rm -rf * && tar xzf /backup/knowledge_backup_20241201_103000.tar.gz"

# Start service lại
docker-compose start knowledge-service-api
```

### **3. Copy Volume sang server khác:**
```bash
# Server A: Export
docker run --rm \
  -v quizz-be-main_knowledge_chromadb_data:/data \
  alpine tar czf - -C /data . > knowledge_data.tar.gz

# Transfer file
scp knowledge_data.tar.gz user@server-b:/path/

# Server B: Import
docker run --rm \
  -v quizz-be-main_knowledge_chromadb_data:/data \
  -v /path:/backup \
  alpine sh -c "cd /data && tar xzf /backup/knowledge_data.tar.gz"
```

## 🔍 Kiểm tra dữ liệu

### **1. Xem kích thước volume:**
```bash
docker system df -v | grep knowledge_chromadb_data
```

### **2. List files trong volume:**
```bash
docker run --rm \
  -v quizz-be-main_knowledge_chromadb_data:/data \
  alpine ls -lah /data
```

### **3. Xem stats qua API:**
```bash
curl http://localhost:9013/stats
```

Output:
```json
{
  "collection_name": "operating_systems_textbook",
  "total_documents": 245,
  "metadata": {
    "hnsw:space": "cosine",
    "hnsw:construction_ef": 100,
    "hnsw:M": 16
  }
}
```

### **4. Exec vào container:**
```bash
docker exec -it quiz_knowledge_service_api bash

# Inside container
cd /app/data/chromadb
ls -lah
du -sh *
```

## 🗑️ Xóa dữ liệu

### **1. Xóa collection (qua API):**
```bash
curl -X DELETE http://localhost:9008/api/v1/knowledge/collection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
→ Xóa tất cả documents, giữ lại collection rỗng

### **2. Xóa toàn bộ volume:**
```bash
# Stop và remove container
docker-compose down

# Xóa volume
docker volume rm quizz-be-main_knowledge_chromadb_data

# Start lại (volume mới sẽ được tạo)
docker-compose up -d
```

## 📈 Monitoring

### **1. Disk Usage:**
```bash
# Check volume size
docker system df -v | grep knowledge

# Check container disk usage
docker exec quiz_knowledge_service_api du -sh /app/data/chromadb
```

### **2. Database Stats:**
```bash
# Via API
curl http://localhost:9013/stats

# Via Python script
docker exec -it quiz_knowledge_service_api python -c "
from core.vector_store import VectorStore
vs = VectorStore()
stats = vs.get_stats()
print(f'Total documents: {stats[\"total_documents\"]}')
"
```

## 🎯 Best Practices

1. **Backup định kỳ:** Backup volume trước khi upload file mới với `recreate_collection=true`
2. **Monitor disk space:** Đảm bảo đủ dung lượng (ít nhất 2x kích thước dữ liệu)
3. **Test restore:** Thử restore backup định kỳ để đảm bảo backup hoạt động
4. **Version control:** Đặt tên backup với timestamp để dễ quản lý
5. **Separate volumes:** Mỗi environment (dev/staging/prod) nên có volume riêng

## 🔧 Troubleshooting

### **Volume không mount được:**
```bash
# Check volume exists
docker volume ls | grep knowledge

# Recreate volume
docker volume create quizz-be-main_knowledge_chromadb_data
```

### **Dữ liệu bị corrupt:**
```bash
# Restore từ backup
# Hoặc xóa và tạo lại
docker volume rm quizz-be-main_knowledge_chromadb_data
docker-compose up -d knowledge-service-api
```

### **Out of disk space:**
```bash
# Clean up unused volumes
docker volume prune

# Check disk usage
df -h
```

