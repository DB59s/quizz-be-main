@echo off
echo ========================================
echo Rebuilding Gateway API with fresh Swagger docs
echo ========================================

echo.
echo [1/6] Stopping containers...
docker-compose stop gateway-api

echo.
echo [2/6] Removing old container...
docker-compose rm -f gateway-api

echo.
echo [3/6] Removing old image...
docker rmi quiz_gateway_api 2>nul

echo.
echo [4/6] Building fresh image (no cache)...
docker-compose build --no-cache gateway-api

echo.
echo [5/6] Starting gateway...
docker-compose up -d gateway-api

echo.
echo [6/6] Waiting for service to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Done! Gateway API is running
echo Swagger: http://localhost:9008/api-docs
echo ========================================
echo.
echo Press Ctrl+C to stop viewing logs...
docker-compose logs -f --tail=50 gateway-api
