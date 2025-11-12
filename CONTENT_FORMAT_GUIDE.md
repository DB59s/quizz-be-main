# 📚 HƯỚNG DẪN FORMAT CONTENT CHO KNOWLEDGE BASE

## 🎯 Vấn đề: Lỗi JSON khi upload content có ký tự LaTeX

### ❌ **Lỗi thường gặp:**

```json
{
  "detail": [
    {
      "type": "json_invalid",
      "loc": ["body", 1008],
      "msg": "JSON decode error",
      "input": {},
      "ctx": {
        "error": "Invalid \\escape"
      }
    }
  ]
}
```

### 🔍 **Nguyên nhân:**

JSON **KHÔNG** cho phép ký tự backslash `\` đơn lẻ. Tất cả backslash phải được escape thành `\\`.

**Ví dụ các ký tự LaTeX gây lỗi:**
- `\in` → Phải thành `\\in`
- `\le` → Phải thành `\\le`
- `\ge` → Phải thành `\\ge`
- `\text{ }` → Phải thành `\\text{ }`
- `\Omega` → Phải thành `\\Omega`
- `\Theta` → Phải thành `\\Theta`
- `\cdot` → Phải thành `\\cdot`

---

## ✅ **Giải pháp:**

### **Cách 1: Escape tất cả backslash (Khuyến nghị)**

**Content gốc (SAI):**
```
$$T(n) \in O(g(n)) \text{ nếu } T(n) \le c \cdot g(n)$$
```

**Content đúng trong JSON:**
```json
{
  "filename": "example.txt",
  "content": "$$T(n) \\\\in O(g(n)) \\\\text{ nếu } T(n) \\\\le c \\\\cdot g(n)$$",
  "recreate_collection": false
}
```

**Lưu ý:** Trong JSON string, mỗi `\` phải thành `\\`, nên `\in` → `\\in` (2 backslash).

---

### **Cách 2: Sử dụng công cụ escape tự động**

#### **Python Script:**

```python
import json

content = """CHƯƠNG 2: PHÂN TÍCH VÀ ĐỘ PHỨC TẠP GIẢI THUẬT

2.1 Phân tích Giải thuật

$$T(n) \in O(g(n)) \text{ nếu tồn tại } c > 0$$
"""

# Tạo JSON object
data = {
    "filename": "chuong2.txt",
    "content": content,
    "recreate_collection": False
}

# Lưu ra file JSON (tự động escape)
with open('upload.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ File JSON đã được tạo với escape tự động!")
```

**Chạy script:**
```bash
python create_upload_json.py
curl -X POST http://localhost:9009/upload -H "Content-Type: application/json" -d @upload.json
```

---

### **Cách 3: Sử dụng Node.js**

```javascript
const fs = require('fs');

const content = `CHƯƠNG 2: PHÂN TÍCH VÀ ĐỘ PHỨC TẠP GIẢI THUẬT

2.1 Phân tích Giải thuật

$$T(n) \\in O(g(n)) \\text{ nếu tồn tại } c > 0$$
`;

const data = {
  filename: "chuong2.txt",
  content: content,
  recreate_collection: false
};

// Lưu ra file JSON (tự động escape)
fs.writeFileSync('upload.json', JSON.stringify(data, null, 2), 'utf-8');

console.log('✓ File JSON đã được tạo!');
```

---

## 📋 **Ví dụ đầy đủ:**

### **File: test-upload-chapter2.json**

```json
{
  "filename": "cau-truc-du-lieu-chuong2.txt",
  "content": "CHƯƠNG 2: PHÂN TÍCH VÀ ĐỘ PHỨC TẠP GIẢI THUẬT\n\n2.1 Phân tích Giải thuật (Algorithm Analysis)\n\nPhân tích giải thuật là quá trình xác định tài nguyên (thời gian và bộ nhớ) cần thiết để thực thi một giải thuật. Việc phân tích được thực hiện độc lập với bất kỳ phần cứng hoặc ngôn ngữ lập trình cụ thể nào, mà dựa trên việc đếm số lượng các thao tác cơ bản.\n\nPhân tích giải thuật giúp:\n- Dự đoán hiệu suất của giải thuật khi kích thước dữ liệu đầu vào tăng lên.\n- So sánh hai hoặc nhiều giải thuật khác nhau để chọn ra giải thuật tối ưu.\n- Đánh giá khả năng mở rộng (scalability) của giải thuật.\n\n2.2 Ký hiệu Độ phức tạp (Asymptotic Notations)\n\nCác ký hiệu tiệm cận được sử dụng để mô tả hành vi giới hạn của hàm độ phức tạp thời gian hoặc không gian khi kích thước đầu vào ($n$) tiến tới vô cùng.\n\nCác ký hiệu chính:\n\nKý hiệu O lớn (Big O Notation - $O$): Mô tả giới hạn trên (Worst Case) của hàm độ phức tạp. Nó cho biết thời gian thực thi tối đa mà giải thuật có thể mất.\n\n$$T(n) \\\\in O(g(n)) \\\\text{ nếu tồn tại } c > 0, n_0 \\\\text{ sao cho } T(n) \\\\le c \\\\cdot g(n) \\\\text{ với mọi } n \\\\ge n_0$$\n\nKý hiệu Omega lớn (Big $\\\\Omega$ Notation - $\\\\Omega$): Mô tả giới hạn dưới (Best Case). Nó cho biết thời gian thực thi tối thiểu mà giải thuật cần.\n\nKý hiệu Theta lớn (Big $\\\\Theta$ Notation - $\\\\Theta$): Mô tả giới hạn chặt (Tight Bound), khi giới hạn trên và giới hạn dưới của giải thuật là như nhau.",
  "recreate_collection": false
}
```

### **Test upload:**

```bash
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d @test-upload-chapter2.json
```

### **Kết quả thành công:**

```json
{
  "filename": "cau-truc-du-lieu-chuong2.txt",
  "chunks_processed": 2,
  "collection_name": "operating_systems_textbook",
  "total_documents": 2
}
```

---

## 🔧 **Quy tắc Escape trong JSON:**

| Ký tự | Escape thành | Ví dụ |
|-------|--------------|-------|
| `\` | `\\` | `\in` → `\\in` |
| `"` | `\"` | `He said "Hi"` → `He said \"Hi\"` |
| Newline | `\n` | Xuống dòng |
| Tab | `\t` | Tab |
| Backspace | `\b` | Backspace |
| Form feed | `\f` | Form feed |
| Carriage return | `\r` | Carriage return |

---

## 📊 **Bảng tra cứu nhanh LaTeX:**

| LaTeX gốc | Trong JSON | Mô tả |
|-----------|------------|-------|
| `\in` | `\\in` | Thuộc |
| `\le` | `\\le` | Nhỏ hơn hoặc bằng |
| `\ge` | `\\ge` | Lớn hơn hoặc bằng |
| `\text{...}` | `\\text{...}` | Text trong công thức |
| `\cdot` | `\\cdot` | Dấu nhân |
| `\Omega` | `\\Omega` | Omega lớn |
| `\Theta` | `\\Theta` | Theta lớn |
| `\alpha` | `\\alpha` | Alpha |
| `\beta` | `\\beta` | Beta |
| `\sum` | `\\sum` | Tổng |
| `\int` | `\\int` | Tích phân |
| `\frac{a}{b}` | `\\frac{a}{b}` | Phân số |

---

## 🚀 **Workflow khuyến nghị:**

### **Bước 1: Viết content trong file .txt**

```
CHƯƠNG 2: PHÂN TÍCH GIẢI THUẬT

2.1 Độ phức tạp

$$T(n) \in O(g(n))$$
```

### **Bước 2: Sử dụng script Python để tạo JSON**

```python
import json

with open('content.txt', 'r', encoding='utf-8') as f:
    content = f.read()

data = {
    "filename": "content.txt",
    "content": content,
    "recreate_collection": False
}

with open('upload.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

### **Bước 3: Upload**

```bash
curl -X POST http://localhost:9009/upload \
  -H "Content-Type: application/json" \
  -d @upload.json
```

---

## ✅ **Tổng kết:**

1. **Lỗi "Invalid \\escape"** xảy ra khi JSON có backslash `\` đơn lẻ
2. **Giải pháp:** Escape tất cả `\` thành `\\`
3. **Khuyến nghị:** Sử dụng Python/Node.js để tự động escape thay vì viết tay
4. **Đã test thành công** với content có công thức LaTeX

---

## 📞 **Liên hệ:**

Nếu gặp vấn đề, kiểm tra:
1. File JSON có valid không: https://jsonlint.com/
2. Logs của Knowledge Service: `docker logs quiz_knowledge_service_api --tail 50`
3. Test với curl: `curl -X POST http://localhost:9009/upload -H "Content-Type: application/json" -d @file.json`

