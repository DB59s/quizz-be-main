# Hướng Dẫn Deploy CI/CD với GitHub Actions

Tài liệu này hướng dẫn cách thiết lập CI/CD tự động deploy lên Ubuntu server khi push code lên branch `deploy`.

## Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Chuẩn Bị Server Ubuntu](#chuẩn-bị-server-ubuntu)
3. [Cấu Hình GitHub Repository](#cấu-hình-github-repository)
4. [Thiết Lập GitHub Actions](#thiết-lập-github-actions)
5. [Quy Trình Deploy](#quy-trình-deploy)
6. [Xử Lý Sự Cố](#xử-lý-sự-cố)

---

## Yêu Cầu Hệ Thống

### Server Ubuntu
- Ubuntu 20.04 LTS hoặc mới hơn
- RAM: Tối thiểu 8GB (khuyến nghị 16GB+)
- Disk: Tối thiểu 50GB
- Docker Engine 24.0+
- Docker Compose V2
- Git

### GitHub
- Repository với quyền admin
- GitHub Actions enabled

---

## Chuẩn Bị Server Ubuntu

### Bước 1: Cài Đặt Docker

```bash
# Cập nhật packages
sudo apt update && sudo apt upgrade -y

# Cài đặt dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Thêm Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Thêm Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Kiểm tra cài đặt
docker --version
docker compose version

# Thêm user vào docker group (thay 'your-username' bằng username của bạn)
sudo usermod -aG docker $USER

# Logout và login lại để áp dụng thay đổi
```

### Bước 2: Cài Đặt Git

```bash
sudo apt install -y git
git --version
```

### Bước 3: Tạo SSH Key cho GitHub

```bash
# Tạo SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/github_deploy

# Hiển thị public key
cat ~/.ssh/github_deploy.pub
```

**Lưu ý:** Copy public key này và thêm vào GitHub repository với quyền đọc (Settings > Deploy keys).

### Bước 4: Clone Repository

```bash
# Tạo thư mục cho project
mkdir -p ~/projects
cd ~/projects

# Clone repository (thay YOUR_USERNAME và YOUR_REPO)
git clone -b deploy git@github.com:YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Cấu hình Git để sử dụng SSH key
git config core.sshCommand "ssh -i ~/.ssh/github_deploy"
```

### Bước 5: Tạo Environment Files

Tạo các file `.env` cần thiết cho từng service. Ví dụ:

```bash
# Copy từ file .env.example nếu có
cp chatbot/.env.example chatbot/.env

# Hoặc tạo file .env mới và điền thông tin
nano chatbot/.env
```

**Lưu ý quan trọng:**
- Các file `.env` chứa thông tin nhạy cảm, không push lên GitHub
- Backup các file `.env` thường xuyên
- Sử dụng các giá trị production cho môi trường deploy

### Bước 6: Tạo Thư Mục Backup

```bash
mkdir -p ~/backups
```

### Bước 7: Cấp Quyền Cho Deploy Script

```bash
chmod +x deploy.sh
```

### Bước 8: Test Deployment Thủ Công

```bash
# Test script deploy
./deploy.sh

# Hoặc dùng docker-compose trực tiếp
docker compose up -d

# Kiểm tra logs
docker compose logs -f

# Kiểm tra trạng thái services
docker compose ps
```

---

## Cấu Hình GitHub Repository

### Bước 1: Tạo Deploy Key (trên server)

```bash
# Tạo SSH key mới cho GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Hiển thị private key (để thêm vào GitHub Secrets)
cat ~/.ssh/github_actions_deploy

# Hiển thị public key (để thêm vào ~/.ssh/authorized_keys)
cat ~/.ssh/github_actions_deploy.pub
```

### Bước 2: Thêm Public Key vào Server

```bash
# Thêm public key vào authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Đảm bảo quyền đúng
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Bước 3: Test SSH Connection

```bash
# Test từ máy khác (hoặc từ GitHub Actions)
ssh -i github_actions_deploy user@your-server-ip "echo 'SSH connection successful!'"
```

---

## Thiết Lập GitHub Actions

### Bước 1: Thêm GitHub Secrets

Vào repository trên GitHub: **Settings > Secrets and variables > Actions**

Thêm các secrets sau:

1. **SSH_PRIVATE_KEY**
   - Value: Nội dung của private key (`~/.ssh/github_actions_deploy`)
   - Paste toàn bộ nội dung bao gồm cả:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     ...
     -----END OPENSSH PRIVATE KEY-----
     ```

2. **SERVER_HOST**
   - Value: IP hoặc domain của server Ubuntu
   - Ví dụ: `192.168.1.100` hoặc `server.example.com`

3. **SERVER_USER**
   - Value: Username trên server Ubuntu
   - Ví dụ: `ubuntu` hoặc `your-username`

4. **DEPLOY_PATH**
   - Value: Đường dẫn tuyệt đối đến thư mục project trên server
   - Ví dụ: `/home/ubuntu/projects/quizz-be-main`

### Bước 2: Tạo Branch Deploy

```bash
# Từ branch main
git checkout main

# Tạo branch deploy
git checkout -b deploy

# Push branch deploy lên GitHub
git push origin deploy
```

### Bước 3: Protect Branch Deploy (Optional)

Vào **Settings > Branches > Add rule**:
- Branch name pattern: `deploy`
- ✓ Require pull request reviews before merging
- ✓ Require status checks to pass before merging

---

## Quy Trình Deploy

### Deploy Tự Động

Khi bạn push code lên branch `deploy`, GitHub Actions sẽ tự động:

1. **Checkout code** từ branch `deploy`
2. **Setup SSH** connection đến server
3. **Deploy** bằng cách:
   - Pull code mới nhất
   - Tạo backup
   - Stop các services cũ
   - Build và start services mới
   - Verify deployment

```bash
# Cách 1: Push trực tiếp lên deploy branch
git checkout deploy
git merge main
git push origin deploy

# Cách 2: Tạo Pull Request vào deploy branch
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature
# Tạo PR từ feature/new-feature vào deploy
```

### Deploy Thủ Công (trên server)

Nếu cần deploy thủ công:

```bash
# SSH vào server
ssh user@your-server

# Di chuyển đến thư mục project
cd ~/projects/quizz-be-main

# Chạy deploy script
./deploy.sh
```

### Kiểm Tra Deployment

```bash
# Kiểm tra logs của workflow trên GitHub
# Actions > Deploy to Ubuntu Server > Click vào workflow run

# Kiểm tra services trên server
ssh user@your-server "cd ~/projects/quizz-be-main && docker compose ps"

# Xem logs
ssh user@your-server "cd ~/projects/quizz-be-main && docker compose logs --tail=100"
```

---

## Xử Lý Sự Cố

### 1. SSH Connection Failed

**Lỗi:** `Permission denied (publickey)`

**Giải pháp:**
```bash
# Kiểm tra SSH key trên server
cat ~/.ssh/authorized_keys

# Kiểm tra quyền
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test SSH connection
ssh -i ~/.ssh/github_actions_deploy user@server-ip
```

### 2. Docker Build Failed

**Lỗi:** `Error response from daemon: ... no space left on device`

**Giải pháp:**
```bash
# Dọn dẹp Docker resources
docker system prune -a --volumes

# Xem disk usage
df -h

# Xem Docker disk usage
docker system df
```

### 3. Services Failed to Start

**Lỗi:** Container exits immediately

**Giải pháp:**
```bash
# Xem logs chi tiết
docker compose logs service-name

# Kiểm tra environment variables
docker compose config

# Rebuild without cache
docker compose build --no-cache service-name
docker compose up -d service-name
```

### 4. Port Already in Use

**Lỗi:** `Bind for 0.0.0.0:9008 failed: port is already allocated`

**Giải pháp:**
```bash
# Tìm process đang sử dụng port
sudo lsof -i :9008

# Kill process (thay PID)
sudo kill -9 PID

# Hoặc stop tất cả Docker containers
docker compose down
```

### 5. Database Connection Failed

**Giải pháp:**
```bash
# Kiểm tra database containers
docker compose ps | grep mysql
docker compose ps | grep postgres

# Kiểm tra logs
docker compose logs quiz_mysql_gateway
docker compose logs quiz_postgres_chatbot

# Restart database services
docker compose restart quiz_mysql_gateway
```

### 6. GitHub Actions Workflow Failed

**Giải pháp:**

1. Kiểm tra logs trên GitHub Actions tab
2. Verify GitHub Secrets đã được cấu hình đúng
3. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/test_key user@server-ip
   ```
4. Kiểm tra xem server có đủ resources (RAM, disk) không

### 7. Environment Variables Missing

**Giải pháp:**
```bash
# Kiểm tra file .env có tồn tại không
ls -la chatbot/.env
ls -la */\.env

# Restore từ backup nếu cần
cp ~/backups/backup_YYYYMMDD_HHMMSS/.env chatbot/.env
```

---

## Monitoring & Maintenance

### Xem Logs Real-time

```bash
# Tất cả services
docker compose logs -f

# Một service cụ thể
docker compose logs -f gateway-api

# Số dòng logs cụ thể
docker compose logs --tail=200 chatbot-service-api
```

### Restart Services

```bash
# Restart một service
docker compose restart gateway-api

# Restart tất cả services
docker compose restart
```

### Update Code Không Dùng CI/CD

```bash
cd ~/projects/quizz-be-main
git pull origin deploy
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Backup Database

```bash
# MySQL backup
docker exec quiz_mysql_gateway mysqldump -u root -prootpassword gateway_db > backup_gateway_$(date +%Y%m%d).sql

# PostgreSQL backup
docker exec quiz_postgres_chatbot pg_dump -U chatbot_user chatbot_db > backup_chatbot_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# MySQL restore
docker exec -i quiz_mysql_gateway mysql -u root -prootpassword gateway_db < backup_gateway_20240101.sql

# PostgreSQL restore
docker exec -i quiz_postgres_chatbot psql -U chatbot_user -d chatbot_db < backup_chatbot_20240101.sql
```

---

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   # Chỉ mở các port cần thiết
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Update Docker images
   docker compose pull
   ```

3. **Secure Secrets**
   - Không hardcode secrets trong code
   - Sử dụng GitHub Secrets cho sensitive data
   - Thường xuyên rotate API keys và passwords

4. **Backup Strategy**
   - Backup databases hàng ngày
   - Lưu trữ backups ở nơi an toàn
   - Test restore process định kỳ

---

## Checklist Setup

- [ ] Docker đã được cài đặt và chạy
- [ ] Docker Compose V2 đã được cài đặt
- [ ] Git đã được cài đặt
- [ ] SSH keys đã được tạo và cấu hình
- [ ] Repository đã được clone
- [ ] Các file `.env` đã được tạo và cấu hình
- [ ] GitHub Secrets đã được thêm (SSH_PRIVATE_KEY, SERVER_HOST, SERVER_USER, DEPLOY_PATH)
- [ ] Branch `deploy` đã được tạo
- [ ] Test deployment thủ công thành công
- [ ] GitHub Actions workflow hoạt động
- [ ] Firewall đã được cấu hình
- [ ] Backup strategy đã được thiết lập

---

## Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs của GitHub Actions
2. Kiểm tra logs của Docker containers
3. Tham khảo phần [Xử Lý Sự Cố](#xử-lý-sự-cố)
4. Mở issue trên GitHub repository

---

**Chúc bạn deploy thành công! 🚀**
