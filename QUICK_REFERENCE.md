# Quick Reference - Deployment Commands

Tài liệu tham khảo nhanh các lệnh thường dùng khi deploy và quản lý hệ thống.

## Deploy Commands

### Deploy Tự Động (GitHub Actions)
```bash
# Push lên branch deploy để trigger auto-deploy
git checkout deploy
git merge main
git push origin deploy
```

### Deploy Thủ Công Trên Server
```bash
# SSH vào server
ssh user@your-server

# Chạy deploy script
cd ~/projects/quizz-be-main
./deploy.sh

# Hoặc deploy thủ công
git pull origin deploy
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Docker Commands

### Quản Lý Services

```bash
# Xem tất cả services
docker compose ps

# Start tất cả services
docker compose up -d

# Stop tất cả services
docker compose down

# Restart tất cả services
docker compose restart

# Restart một service cụ thể
docker compose restart gateway-api
```

### Xem Logs

```bash
# Logs tất cả services (real-time)
docker compose logs -f

# Logs một service cụ thể
docker compose logs -f chatbot-service-api

# Logs 200 dòng cuối
docker compose logs --tail=200

# Logs với timestamp
docker compose logs -f --timestamps
```

### Build & Rebuild

```bash
# Build tất cả services
docker compose build

# Build không dùng cache
docker compose build --no-cache

# Build một service cụ thể
docker compose build gateway-api

# Pull latest images
docker compose pull
```

### Health Check

```bash
# Kiểm tra health status
docker compose ps

# Kiểm tra logs của một service cụ thể
docker compose logs gateway-api | grep -i error

# Exec vào container
docker compose exec gateway-api sh

# Xem resource usage
docker stats
```

## Git Commands

### Branch Management

```bash
# Xem tất cả branches
git branch -a

# Chuyển sang branch deploy
git checkout deploy

# Merge từ main vào deploy
git checkout deploy
git merge main

# Push lên remote
git push origin deploy

# Xem commit history
git log --oneline -n 20
```

### Rollback

```bash
# Xem lịch sử commits
git log --oneline

# Rollback về commit cụ thể (CAREFUL!)
git reset --hard <commit-hash>

# Rollback về commit trước đó
git reset --hard HEAD~1

# Sử dụng rollback script (KHUYẾN NGHỊ)
./rollback.sh
```

## Troubleshooting Commands

### Check System Resources

```bash
# Disk usage
df -h

# Docker disk usage
docker system df

# Memory usage
free -h

# CPU usage
top
htop
```

### Network Debugging

```bash
# Test port
curl http://localhost:9008/health

# Check listening ports
sudo lsof -i -P -n | grep LISTEN

# Check process on specific port
sudo lsof -i :9008

# Test DNS
nslookup api.vuquangduy.io.vn
```

### Docker Cleanup

```bash
# Xóa tất cả stopped containers
docker container prune -f

# Xóa tất cả unused images
docker image prune -a -f

# Xóa tất cả unused volumes
docker volume prune -f

# Xóa tất cả unused networks
docker network prune -f

# Xóa tất cả (CAREFUL!)
docker system prune -a --volumes -f
```

### Database Commands

```bash
# MySQL - Exec vào container
docker compose exec quiz_mysql_gateway mysql -u root -prootpassword

# PostgreSQL - Exec vào container
docker compose exec quiz_postgres_chatbot psql -U chatbot_user -d chatbot_db

# Backup MySQL database
docker exec quiz_mysql_gateway mysqldump -u root -prootpassword gateway_db > backup.sql

# Backup PostgreSQL database
docker exec quiz_postgres_chatbot pg_dump -U chatbot_user chatbot_db > backup.sql

# Restore MySQL database
docker exec -i quiz_mysql_gateway mysql -u root -prootpassword gateway_db < backup.sql

# Restore PostgreSQL database
docker exec -i quiz_postgres_chatbot psql -U chatbot_user -d chatbot_db < backup.sql
```

## Service-Specific Commands

### Gateway API (Port 9008)
```bash
# Logs
docker compose logs -f gateway-api

# Restart
docker compose restart gateway-api

# Health check
curl http://localhost:9008/health
```

### User Service (Port 9004)
```bash
# Logs
docker compose logs -f user-service-api

# Restart
docker compose restart user-service-api

# Health check
curl http://localhost:9004/api/v1/health
```

### Chatbot Service (Port 9013)
```bash
# Logs
docker compose logs -f chatbot-service-api

# Restart
docker compose restart chatbot-service-api

# Health check
curl http://localhost:9013/api/health
```

### Knowledge Service (Port 9009)
```bash
# Logs
docker compose logs -f knowledge-service-api

# Restart
docker compose restart knowledge-service-api

# Health check
curl http://localhost:9009/health
```

## Environment Variables

### Xem Environment Variables của Container

```bash
# Xem tất cả env vars
docker compose exec gateway-api env

# Xem env var cụ thể
docker compose exec gateway-api env | grep DB_HOST
```

### Edit Environment Variables

```bash
# Edit .env file (sau đó restart service)
nano chatbot/.env

# Restart sau khi edit
docker compose restart chatbot-service-api
```

## Monitoring Commands

### Real-time Monitoring

```bash
# Watch service status
watch -n 2 'docker compose ps'

# Watch logs
docker compose logs -f | grep -i error

# Watch disk usage
watch -n 5 df -h

# Watch docker stats
docker stats
```

### Check Service Health

```bash
# Check all health endpoints
curl http://localhost:9008/health  # Gateway
curl http://localhost:9004/api/v1/health  # User Service
curl http://localhost:9012/api/health  # Question Service
curl http://localhost:9010/api/health  # Quiz Service
curl http://localhost:9011/api/health  # Submission Service
curl http://localhost:9013/api/health  # Chatbot Service
curl http://localhost:9009/health  # Knowledge Service
```

## Useful Aliases (Optional)

Thêm vào `~/.bashrc` hoặc `~/.zshrc`:

```bash
# Docker Compose shortcuts
alias dc='docker compose'
alias dcp='docker compose ps'
alias dcl='docker compose logs -f'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcr='docker compose restart'

# Project shortcuts
alias cdproject='cd ~/projects/quizz-be-main'
alias deploy='cd ~/projects/quizz-be-main && ./deploy.sh'
alias rollback='cd ~/projects/quizz-be-main && ./rollback.sh'

# Logs shortcuts
alias logs-gateway='docker compose logs -f gateway-api'
alias logs-chatbot='docker compose logs -f chatbot-service-api'
alias logs-all='docker compose logs -f'
```

Sau khi thêm, chạy:
```bash
source ~/.bashrc  # hoặc source ~/.zshrc
```

## Emergency Commands

### Service Not Responding

```bash
# Force restart tất cả
docker compose down --remove-orphans
docker compose up -d --force-recreate

# Kill tất cả containers và restart
docker kill $(docker ps -q)
docker compose up -d
```

### Out of Disk Space

```bash
# Clean everything
docker system prune -a --volumes -f

# Check what's using space
docker system df -v

# Remove specific volume
docker volume rm volume_name
```

### Port Conflicts

```bash
# Find what's using port
sudo lsof -i :9008

# Kill process
sudo kill -9 <PID>

# Or use fuser
sudo fuser -k 9008/tcp
```

## GitHub Actions

### Xem Workflow Logs

Truy cập: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

### Trigger Manual Deployment

```bash
# Push empty commit để trigger workflow
git commit --allow-empty -m "Trigger deployment"
git push origin deploy
```

### Check Workflow Status

```bash
# Sử dụng GitHub CLI (nếu đã cài)
gh run list --branch deploy
gh run view <run-id>
```

---

**Tip:** Bookmark trang này để tham khảo nhanh khi cần!
