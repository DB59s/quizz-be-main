@echo off
REM Docker start script for Quiz Microservices (Windows)
echo 🚀 Starting Quiz Microservices with Docker...

REM Create necessary directories if they don't exist
if not exist "mysql-init" mkdir mysql-init
REM mongo-init not needed since we use MongoDB Atlas

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Remove any orphaned containers
docker-compose down --remove-orphans

REM Build and start all services
echo 🔨 Building and starting all services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check service status
echo 📊 Checking service status...
docker-compose ps

REM Display logs for troubleshooting
echo 📝 Displaying recent logs...
docker-compose logs --tail=10

echo ✅ Services started successfully!
echo.
echo 🌐 Available endpoints:
echo    Gateway API: http://localhost:9008 (Production: https://api.vuquangduy.io.vn)
echo    User Service API: http://localhost:9009 (Production: https://userservice.vuquangduy.io.vn)
echo    MySQL: localhost:9000
echo    MongoDB: MongoDB Atlas (Cloud)
echo.
echo 📚 API Documentation:
echo    Gateway API Docs: http://localhost:9008/api-docs (Production: https://api.vuquangduy.io.vn/api-docs)
echo    User Service: http://localhost:9009/api/v1 (Production: https://userservice.vuquangduy.io.vn/api/v1)
echo.
echo 🔧 Useful commands:
echo    View logs: docker-compose logs -f [service-name]
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart

pause
