@echo off
echo 🧪 Testing Quiz Microservices APIs...
echo.

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 5 /nobreak > nul

REM Test Gateway API
echo 📡 Testing Gateway API (http://localhost:8080)...
echo 1. Health check:
curl -s http://localhost:8080/
echo.

echo 2. API Documentation status:
curl -s -I http://localhost:8080/api-docs
echo.

REM Test User Service API
echo 📡 Testing User Service API (http://localhost:3001)...
echo 1. Health check:
curl -s http://localhost:3001/
echo.

echo 2. Users endpoint:
curl -s http://localhost:3001/api/v1/users
echo.

echo 3. Students endpoint:
curl -s http://localhost:3001/api/v1/students
echo.

REM Test Database connections
echo 🗄️ Testing Database connections...
echo 1. MySQL connection:
docker-compose exec -T mysql mysql -u gateway_user -pgateway_password gateway_db -e "SELECT 'MySQL connected' as status;"
echo.

echo 2. MongoDB connection:
docker-compose exec -T mongodb mongosh -u admin -p adminpassword --authenticationDatabase admin --eval "db.runCommand('ping')"
echo.

echo ✅ API testing completed!
echo.
echo 🌐 Available endpoints:
echo    Gateway API: http://localhost:8080
echo    Gateway API Docs: http://localhost:8080/api-docs
echo    User Service: http://localhost:3001
echo    User Service Health: http://localhost:3001/api/v1

pause
