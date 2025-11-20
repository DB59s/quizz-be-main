# CI/CD Setup Documentation

Hệ thống CI/CD tự động để deploy Quiz Backend lên Ubuntu server khi push code lên branch `deploy`.

## 📋 Tổng Quan

Project này đã được thiết lập với GitHub Actions để tự động deploy lên Ubuntu server. Khi bạn push code lên branch `deploy`, GitHub Actions sẽ tự động:

1. ✅ Kết nối SSH đến server
2. ✅ Pull code mới nhất
3. ✅ Backup cấu hình hiện tại
4. ✅ Stop các services cũ
5. ✅ Build và start services mới
6. ✅ Verify deployment thành công

## 📁 Các Files Đã Tạo

```
quizz-be-main/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions workflow cho CI/CD
├── deploy.sh                       # Script deploy cho server Ubuntu
├── rollback.sh                     # Script rollback về version trước
├── health-check.sh                 # Script kiểm tra health của các services
├── .gitignore                      # Bảo vệ các file nhạy cảm
├── DEPLOYMENT_GUIDE.md             # Hướng dẫn setup chi tiết
├── QUICK_REFERENCE.md              # Tham khảo nhanh các lệnh
└── CI_CD_README.md                 # File này
```

## 🚀 Quick Start

### 1. Setup Server (Chỉ làm 1 lần)

Tham khảo chi tiết trong [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Tóm tắt các bước:**

```bash
# 1. Cài đặt Docker & Docker Compose trên server
sudo apt update && sudo apt upgrade -y
# ... (xem DEPLOYMENT_GUIDE.md)

# 2. Clone repository
git clone -b deploy git@github.com:YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 3. Tạo file .env cho các services
cp chatbot/.env.example chatbot/.env
# ... chỉnh sửa các file .env

# 4. Test deployment thủ công
./deploy.sh
```

### 2. Cấu Hình GitHub Secrets

Vào GitHub: **Settings > Secrets and variables > Actions**

Thêm 4 secrets sau:

| Secret Name | Mô Tả | Ví Dụ |
|------------|-------|-------|
| `SSH_PRIVATE_KEY` | Private SSH key để kết nối server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST` | IP hoặc domain của server | `192.168.1.100` hoặc `server.example.com` |
| `SERVER_USER` | Username trên server | `ubuntu` |
| `DEPLOY_PATH` | Đường dẫn tuyệt đối đến project | `/home/ubuntu/projects/quizz-be-main` |

### 3. Deploy

```bash
# Cách 1: Merge và push lên deploy branch
git checkout deploy
git merge main
git push origin deploy

# Cách 2: Tạo Pull Request vào deploy branch
# (GitHub UI) Create Pull Request: feature-branch → deploy
```

## 📖 Tài Liệu Chi Tiết

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Hướng dẫn setup đầy đủ từng bước
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Các lệnh thường dùng

## 🛠 Scripts Chính

### deploy.sh
Script tự động deploy trên server Ubuntu.

```bash
# Chạy deploy
./deploy.sh
```

**Chức năng:**
- ✓ Kiểm tra prerequisites (Docker, Git)
- ✓ Backup cấu hình hiện tại
- ✓ Pull code mới từ branch `deploy`
- ✓ Stop services cũ
- ✓ Build và start services mới
- ✓ Verify deployment

### rollback.sh
Script rollback về version trước khi có vấn đề.

```bash
# Chạy rollback
./rollback.sh
```

**Chức năng:**
- ✓ Liệt kê các backups có sẵn
- ✓ Cho phép chọn backup để restore
- ✓ Restore environment files
- ✓ Tùy chọn rollback git commit
- ✓ Restart services

### health-check.sh
Script kiểm tra health của tất cả services.

```bash
# Chạy health check
./health-check.sh
```

**Chức năng:**
- ✓ Kiểm tra Docker đang chạy
- ✓ Kiểm tra trạng thái containers
- ✓ Kiểm tra database connectivity
- ✓ Kiểm tra API endpoints
- ✓ Hiển thị logs nếu có lỗi

## 🔄 Quy Trình Deploy

### Automatic Deployment (Khuyến nghị)

```mermaid
graph LR
    A[Push to deploy branch] --> B[GitHub Actions triggered]
    B --> C[SSH to server]
    C --> D[Pull latest code]
    D --> E[Backup configs]
    E --> F[Stop services]
    F --> G[Build & Start]
    G --> H[Verify deployment]
    H --> I[Success/Failure notification]
```

**Các bước thực hiện:**

1. Phát triển feature trên branch riêng
2. Test local
3. Merge vào `main` branch
4. Merge `main` vào `deploy` branch
5. Push `deploy` branch lên GitHub
6. GitHub Actions tự động deploy
7. Kiểm tra logs trên GitHub Actions

### Manual Deployment

Nếu cần deploy thủ công:

```bash
# SSH vào server
ssh user@your-server

# Di chuyển đến thư mục project
cd ~/projects/quizz-be-main

# Chạy deploy script
./deploy.sh

# Hoặc kiểm tra health
./health-check.sh
```

## 🏗 Kiến Trúc Services

Project bao gồm các microservices sau:

| Service | Port | Database | Mô Tả |
|---------|------|----------|-------|
| Gateway API | 9008 | MySQL | API Gateway chính |
| User Service | 9004 | MongoDB Atlas | Quản lý users |
| Class Service | 9007 | MongoDB Atlas | Quản lý classes |
| Question Service | 9012 | MySQL | Quản lý questions |
| Quiz Service | 9010 | PostgreSQL | Quản lý quizzes |
| Submission Service | 9011 | PostgreSQL | Quản lý submissions |
| Chatbot Service | 9013 | PostgreSQL | Chatbot AI |
| Knowledge Service | 9009 | ChromaDB | RAG System (Python) |

## 🔍 Monitoring & Debugging

### Kiểm Tra Logs

```bash
# Xem logs tất cả services
docker compose logs -f

# Xem logs một service cụ thể
docker compose logs -f chatbot-service-api

# Xem 200 dòng logs gần nhất
docker compose logs --tail=200
```

### Kiểm Tra Service Status

```bash
# Xem trạng thái tất cả containers
docker compose ps

# Health check tất cả services
./health-check.sh

# Test một endpoint cụ thể
curl http://localhost:9008/health
```

### Kiểm Tra GitHub Actions

1. Vào repository trên GitHub
2. Click tab **Actions**
3. Chọn workflow run muốn xem
4. Xem logs chi tiết của từng step

## 🆘 Xử Lý Sự Cố

### Deployment Failed

```bash
# 1. Kiểm tra logs trên GitHub Actions
# 2. SSH vào server và kiểm tra
ssh user@your-server
cd ~/projects/quizz-be-main
docker compose logs --tail=200

# 3. Nếu cần rollback
./rollback.sh
```

### Service Not Healthy

```bash
# 1. Chạy health check
./health-check.sh

# 2. Restart service có vấn đề
docker compose restart service-name

# 3. Xem logs chi tiết
docker compose logs service-name
```

### Out of Disk Space

```bash
# Cleanup Docker resources
docker system prune -a --volumes -f

# Xem disk usage
df -h
docker system df
```

## 📝 Best Practices

### 1. Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `deploy` - Branch để trigger auto-deploy

### 2. Deployment Strategy

- **Staging:** Test trên staging environment trước
- **Production:** Merge vào `deploy` branch
- **Rollback:** Sử dụng `./rollback.sh` nếu có vấn đề

### 3. Security

- ✓ Không commit file `.env`
- ✓ Sử dụng GitHub Secrets cho sensitive data
- ✓ Thường xuyên rotate SSH keys và API keys
- ✓ Backup databases định kỳ

### 4. Monitoring

- ✓ Kiểm tra logs thường xuyên
- ✓ Setup alerts cho critical errors
- ✓ Monitor disk space và resources
- ✓ Chạy health check sau mỗi deployment

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. ✓ Kiểm tra [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Phần troubleshooting
2. ✓ Xem [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Các lệnh hữu ích
3. ✓ Kiểm tra logs của GitHub Actions
4. ✓ SSH vào server và kiểm tra logs của Docker
5. ✓ Mở issue trên GitHub repository

## 📊 Checklist Deployment

- [ ] Docker & Docker Compose đã cài đặt trên server
- [ ] SSH keys đã được setup
- [ ] Repository đã được clone
- [ ] File `.env` đã được tạo và cấu hình
- [ ] GitHub Secrets đã được thêm (4 secrets)
- [ ] Branch `deploy` đã được tạo
- [ ] Test deployment thủ công thành công (`./deploy.sh`)
- [ ] Health check pass (`./health-check.sh`)
- [ ] Test auto-deploy bằng cách push lên `deploy` branch
- [ ] Verify deployment thành công trên GitHub Actions
- [ ] Backup strategy đã được thiết lập

## 🎉 Kết Luận

Hệ thống CI/CD đã được thiết lập hoàn chỉnh! Bây giờ bạn có thể:

- ✅ Tự động deploy khi push lên branch `deploy`
- ✅ Rollback dễ dàng khi có vấn đề
- ✅ Monitor health của tất cả services
- ✅ Quản lý deployment một cách chuyên nghiệp

**Happy Deploying! 🚀**

---

*Tài liệu được tạo bởi Claude Code - [timestamp: 2025-11-19]*
