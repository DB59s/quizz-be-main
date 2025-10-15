@echo off
echo ============================================
echo FORCE REBUILD Gateway API (no cache at all)
echo ============================================

echo.
echo [1/7] Stopping all services...
docker-compose stop

echo.
echo [2/7] Removing gateway container...
docker-compose rm -f gateway-api

echo.
echo [3/7] Removing gateway image...
docker rmi quiz_gateway_api 2>nul
for /f "tokens=*" %%i in ('docker images -q quiz_gateway_api 2^>nul') do docker rmi %%i 2>nul

echo.
echo [4/7] Pruning Docker build cache...
docker builder prune -f

echo.
echo [5/7] Building fresh image (no cache, pull base image)...
docker-compose build --no-cache --pull gateway-api

echo.
echo [6/7] Starting gateway...
docker-compose up -d gateway-api

echo.
echo [7/7] Waiting for service to start...
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo Done! Showing logs...
echo ============================================
docker-compose logs --tail=100 gateway-api

echo.
echo ============================================
echo Swagger UI: http://localhost:9008/api-docs
echo Remember to HARD REFRESH browser (Ctrl+Shift+R)
echo ============================================
