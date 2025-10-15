#!/bin/bash

echo "🔥 FORCE REBUILD Gateway API (no cache at all)"
echo "=============================================="

# Stop all services
echo "⏹️  [1/7] Stopping all services..."
docker-compose stop

# Remove gateway container
echo "🗑️  [2/7] Removing gateway container..."
docker-compose rm -f gateway-api

# Remove gateway image
echo "🗑️  [3/7] Removing gateway image..."
docker rmi quiz_gateway_api 2>/dev/null || true
docker rmi $(docker images -q quiz_gateway_api) 2>/dev/null || true

# Prune build cache
echo "🧹 [4/7] Pruning Docker build cache..."
docker builder prune -f

# Build with no cache and pull latest base image
echo "🔨 [5/7] Building fresh image (no cache, pull base image)..."
docker-compose build --no-cache --pull gateway-api

# Start gateway
echo "🚀 [6/7] Starting gateway..."
docker-compose up -d gateway-api

# Wait a bit
echo "⏳ [7/7] Waiting for service to start..."
sleep 5

# Show logs
echo ""
echo "✅ Done! Showing logs..."
echo "=============================================="
docker-compose logs --tail=100 gateway-api

echo ""
echo "🌐 Swagger UI: http://localhost:9008/api-docs"
echo "💡 Remember to HARD REFRESH browser (Ctrl+Shift+R)"
