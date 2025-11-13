# Migration: Thêm trường total_time cho Quiz

## Tổng quan
Migration này thêm trường `total_time` vào bảng `quizz` để lưu thời gian làm bài tối đa của quiz (tính bằng giây).

## Các thay đổi đã thực hiện

### 1. Database Schema
- **File SQL**: `quiz-service-api/add_total_time_column.sql`
- Thêm cột `total_time` (INTEGER, nullable) vào bảng `quizz`
- Cột này nullable để không ảnh hưởng đến dữ liệu cũ

### 2. Quiz Service
**Files đã sửa:**
- `quiz-service-api/src/entity/Quiz.js`: Thêm trường `total_time`
- `quiz-service-api/src/service/quizService.js`:
  - Cập nhật tất cả API trả về quiz để bao gồm `total_time`
  - Thêm validation khi tạo/update quiz với `total_time`

### 3. Submission Service
**Files đã sửa:**
- `submission-service-api/src/service/submissionService.js`:
  - Thêm validation khi student submit: nếu quiz có `total_time`, kiểm tra xem thời gian làm bài của student có vượt quá không

### 4. Chatbot Service
**Files đã sửa:**
- `chatbot-service-api/package.json`: Di chuyển `cross-env` từ devDependencies sang dependencies để fix lỗi khi chạy Docker

## Hướng dẫn Migration

### Bước 1: Update Database
Chạy SQL script để thêm cột mới:

```bash
# Kết nối vào PostgreSQL container
docker exec -it <postgres-container-name> psql -U <username> -d <database-name>

# Hoặc từ file
docker exec -i <postgres-container-name> psql -U <username> -d <database-name> < quiz-service-api/add_total_time_column.sql
```

**Hoặc chạy trực tiếp SQL:**
```sql
ALTER TABLE quizz
ADD COLUMN IF NOT EXISTS total_time INTEGER;

COMMENT ON COLUMN quizz.total_time IS 'Total time to complete quiz in seconds';
```

### Bước 2: Rebuild Services
```bash
# Rebuild tất cả services
docker-compose down
docker-compose build
docker-compose up -d
```

### Bước 3: (Optional) Set default cho dữ liệu cũ
Nếu muốn set thời gian mặc định cho các quiz cũ (ví dụ: 1 giờ = 3600 giây):

```sql
UPDATE quizz
SET total_time = 3600
WHERE total_time IS NULL;
```

## API Changes

### Create Quiz
**Endpoint**: `POST /api/v1/quizzes`

**Request Body** (thêm trường `total_time`):
```json
{
  "name": "Quiz về JavaScript",
  "description": "Kiểm tra kiến thức JS cơ bản",
  "teacher_id": "123",
  "question_ids": ["q1", "q2", "q3"],
  "total_time": 3600
}
```

### Quiz Response
Tất cả API trả về quiz giờ sẽ có thêm trường `total_time`:

```json
{
  "id": "quiz-id",
  "name": "Quiz về JavaScript",
  "description": "...",
  "teacher_id": "123",
  "total_time": 3600,
  "created_at": "...",
  "updated_at": "..."
}
```

### Submit Quiz
**Endpoint**: `POST /api/submissions`

**Validation mới:**
- Nếu quiz có `total_time` được set, hệ thống sẽ kiểm tra:
  - `total_time` trong request body phải được cung cấp
  - `total_time` của student không được vượt quá `total_time` của quiz

**Error message:**
```json
{
  "success": false,
  "message": "Submission time (3700s) exceeds quiz time limit (3600s)"
}
```

## Backward Compatibility

### Dữ liệu cũ
- Các quiz cũ sẽ có `total_time = NULL`
- Không có validation về thời gian cho các quiz cũ
- Hệ thống vẫn hoạt động bình thường

### Các quiz mới
- Teacher có thể chọn set hoặc không set `total_time`
- Nếu không set, hành vi giống như quiz cũ (không giới hạn thời gian)
- Nếu set, student bắt buộc phải submit trong thời gian cho phép

## Testing

### Test Case 1: Quiz không có time limit
```bash
# Tạo quiz không có total_time
POST /api/v1/quizzes
{
  "name": "Quiz 1",
  "question_ids": ["q1", "q2"]
}

# Submit với bất kỳ total_time nào - OK
POST /api/submissions
{
  "class_quiz_id": "...",
  "total_time": 999999,
  "answers": [...]
}
```

### Test Case 2: Quiz có time limit
```bash
# Tạo quiz với total_time = 1800s (30 phút)
POST /api/v1/quizzes
{
  "name": "Quiz 2",
  "question_ids": ["q1", "q2"],
  "total_time": 1800
}

# Submit vượt quá time limit - ERROR
POST /api/submissions
{
  "class_quiz_id": "...",
  "total_time": 2000,
  "answers": [...]
}

# Response:
{
  "success": false,
  "message": "Submission time (2000s) exceeds quiz time limit (1800s)"
}
```

## Rollback

Nếu cần rollback:

```sql
ALTER TABLE quizz DROP COLUMN IF EXISTS total_time;
```

Sau đó revert code về version trước.

## Notes

- Trường `total_time` lưu theo **giây** (seconds)
- Nullable để maintain backward compatibility
- Validation chỉ áp dụng khi quiz có `total_time` được set
