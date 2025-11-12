# 📚 HƯỚNG DẪN UPLOAD NHIỀU KIẾN THỨC VÀO KNOWLEDGE BASE

## 🎯 **Vấn đề:**

> "Khi tao upload nhiều kiến thức vào nhiều lần nhưng nó chỉ lưu vào cơ sở dữ liệu tri thức đúng cái lần cuối cùng tao upload"

---

## 🔍 **Nguyên nhân:**

Bạn đang set `"recreate_collection": true` **mỗi lần upload**, nên:

1. **Lần 1 upload:** `recreate_collection: true` → Tạo collection mới, lưu dữ liệu lần 1 ✅
2. **Lần 2 upload:** `recreate_collection: true` → **XÓA collection cũ**, tạo mới, lưu dữ liệu lần 2 ❌ (mất dữ liệu lần 1)
3. **Lần 3 upload:** `recreate_collection: true` → **XÓA collection cũ**, tạo mới, lưu dữ liệu lần 3 ❌ (mất dữ liệu lần 1, 2)

**Kết quả:** Chỉ còn dữ liệu lần cuối cùng! 😱

---

## ✅ **Giải pháp:**

### **Quy tắc vàng:**

```
Lần 1 upload:  recreate_collection: true   (Tạo collection mới)
Lần 2+ upload: recreate_collection: false  (THÊM vào collection cũ)
```

---

## 📋 **Ví dụ chi tiết:**

### **Lần 1: Upload Chương 1**

```json
{
  "filename": "chuong1.txt",
  "content": "CHƯƠNG 1: KHÁI QUÁT VỀ CẤU TRÚC DỮ LIỆU...",
  "recreate_collection": true
}
```

**Kết quả:**
```
Collection: operating_systems_textbook
Total documents: 1
```

---

### **Lần 2: Upload Chương 2 (THÊM vào)**

```json
{
  "filename": "chuong2.txt",
  "content": "CHƯƠNG 2: PHÂN TÍCH VÀ ĐỘ PHỨC TẠP GIẢI THUẬT...",
  "recreate_collection": false
}
```

**Kết quả:**
```
Collection: operating_systems_textbook
Total documents: 2  ← Tăng từ 1 lên 2 ✅
```

---

### **Lần 3: Upload Chương 3 (THÊM vào)**

```json
{
  "filename": "chuong3.txt",
  "content": "CHƯƠNG 3: CẤU TRÚC DỮ LIỆU TUYẾN TÍNH...",
  "recreate_collection": false
}
```

**Kết quả:**
```
Collection: operating_systems_textbook
Total documents: 3  ← Tăng từ 2 lên 3 ✅
```

---

## 🚀 **Workflow khuyến nghị:**

### **Bước 1: Upload lần đầu tiên (Tạo collection)**

```bash
# File: upload-chapter1.json
{
  "filename": "chuong1.txt",
  "content": "CHƯƠNG 1: ...",
  "recreate_collection": true
}

curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d @upload-chapter1.json
```

**Response:**
```json
{
  "filename": "chuong1.txt",
  "chunks_processed": 5,
  "collection_name": "operating_systems_textbook",
  "total_documents": 1
}
```

---

### **Bước 2: Upload lần 2 (Thêm vào)**

```bash
# File: upload-chapter2.json
{
  "filename": "chuong2.txt",
  "content": "CHƯƠNG 2: ...",
  "recreate_collection": false
}

curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d @upload-chapter2.json
```

**Response:**
```json
{
  "filename": "chuong2.txt",
  "chunks_processed": 4,
  "collection_name": "operating_systems_textbook",
  "total_documents": 2
}
```

---

### **Bước 3: Upload lần 3 (Thêm vào)**

```bash
# File: upload-chapter3.json
{
  "filename": "chuong3.txt",
  "content": "CHƯƠNG 3: ...",
  "recreate_collection": false
}

curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d @upload-chapter3.json
```

**Response:**
```json
{
  "filename": "chuong3.txt",
  "chunks_processed": 6,
  "collection_name": "operating_systems_textbook",
  "total_documents": 3
}
```

---

## 📊 **Bảng so sánh:**

| Lần upload | recreate_collection | Hành động | Kết quả |
|-----------|-------------------|----------|---------|
| 1 | `true` | Tạo collection mới | ✅ 1 document |
| 2 | `true` | **XÓA** collection cũ, tạo mới | ❌ Mất dữ liệu lần 1 |
| 2 | `false` | Thêm vào collection cũ | ✅ 2 documents |
| 3 | `false` | Thêm vào collection cũ | ✅ 3 documents |

---

## 🔄 **Khi nào dùng `recreate_collection: true`?**

### **✅ Dùng `true` khi:**

1. **Lần đầu tiên upload** - Tạo collection mới
2. **Muốn xóa tất cả dữ liệu cũ** - Reset collection
3. **Cập nhật toàn bộ kiến thức** - Thay thế hoàn toàn

**Ví dụ:**
```bash
# Reset collection và upload lại từ đầu
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "all-chapters.txt",
    "content": "CHƯƠNG 1: ...\nCHƯƠNG 2: ...\nCHƯƠNG 3: ...",
    "recreate_collection": true
  }'
```

---

### **✅ Dùng `false` khi:**

1. **Upload thêm kiến thức mới** - Giữ dữ liệu cũ
2. **Cập nhật từng phần** - Thêm từng chương
3. **Batch upload** - Upload nhiều file liên tiếp

**Ví dụ:**
```bash
# Upload thêm chương mới
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "chapter-new.txt",
    "content": "CHƯƠNG 4: ...",
    "recreate_collection": false
  }'
```

---

## 🧪 **Test thực tế:**

### **Scenario 1: Upload 3 chương liên tiếp**

```bash
# Chương 1 - Tạo collection
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "ch1.txt",
    "content": "CHƯƠNG 1: ...",
    "recreate_collection": true
  }'
# Response: total_documents: 1

# Chương 2 - Thêm vào
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "ch2.txt",
    "content": "CHƯƠNG 2: ...",
    "recreate_collection": false
  }'
# Response: total_documents: 2

# Chương 3 - Thêm vào
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "ch3.txt",
    "content": "CHƯƠNG 3: ...",
    "recreate_collection": false
  }'
# Response: total_documents: 3 ✅
```

---

### **Scenario 2: Batch upload (API nội bộ)**

```bash
curl -X POST http://localhost:9009/api/v1/internal/knowledge/batch-upload \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "filename": "ch1.txt",
        "content": "CHƯƠNG 1: ..."
      },
      {
        "filename": "ch2.txt",
        "content": "CHƯƠNG 2: ..."
      },
      {
        "filename": "ch3.txt",
        "content": "CHƯƠNG 3: ..."
      }
    ],
    "recreate_collection": true
  }'
# Response: total_documents: 3 ✅
```

**Lưu ý:** Batch upload tự động xử lý:
- Lần 1: `recreate_collection: true` (tạo collection)
- Lần 2+: `recreate_collection: false` (thêm vào)

---

## 📞 **Kiểm tra dữ liệu:**

### **Xem stats collection:**

```bash
curl http://localhost:9009/stats
```

**Response:**
```json
{
  "collection_name": "operating_systems_textbook",
  "total_documents": 3,
  "total_chunks": 15,
  "embedding_model": "intfloat/multilingual-e5-large",
  "embedding_dimension": 1024
}
```

---

### **Xem logs:**

```bash
docker logs quiz_knowledge_service_api --tail 50
```

**Kiểm tra:**
- Lần 1: `Created new collection: operating_systems_textbook`
- Lần 2: `Connected to collection: operating_systems_textbook` (không xóa)
- Lần 3: `Connected to collection: operating_systems_textbook` (không xóa)

---

## ⚠️ **Lỗi thường gặp:**

### **Lỗi 1: Mất dữ liệu sau mỗi lần upload**

**Nguyên nhân:** `recreate_collection: true` mỗi lần

**Giải pháp:** Chỉ dùng `true` lần đầu, sau đó dùng `false`

---

### **Lỗi 2: "Collection does not exist"**

**Nguyên nhân:** Chưa upload lần nào (collection chưa tồn tại)

**Giải pháp:** Upload lần đầu với `recreate_collection: true`

---

### **Lỗi 3: Duplicate documents**

**Nguyên nhân:** Upload cùng file nhiều lần

**Giải pháp:** ChromaDB tự động deduplicate, không cần lo

---

## 🎯 **Tóm tắt:**

| Tình huống | recreate_collection | Lệnh |
|-----------|-------------------|------|
| Upload lần 1 | `true` | `curl -X POST ... -d '{"recreate_collection": true}'` |
| Upload thêm | `false` | `curl -X POST ... -d '{"recreate_collection": false}'` |
| Reset collection | `true` | `curl -X POST ... -d '{"recreate_collection": true}'` |
| Batch upload | `true` | `curl -X POST .../batch-upload ... -d '{"recreate_collection": true}'` |

---

## ✅ **Kết luận:**

- **Lần 1:** `recreate_collection: true` (Tạo collection)
- **Lần 2+:** `recreate_collection: false` (Thêm vào collection)
- **Kiểm tra:** `curl http://localhost:9009/stats` (Xem total_documents tăng)

Bây giờ bạn có thể upload nhiều kiến thức mà không mất dữ liệu cũ! 🚀

