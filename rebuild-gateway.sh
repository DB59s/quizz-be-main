#!/bin/bash

echo "🔄 Rebuilding Gateway API with fresh Swagger docs..."

# Stop containers
echo "⏹️  Stopping containers..."
docker-compose stop gateway-api

# Remove gateway container
echo "🗑️  Removing old container..."
docker-compose rm -f gateway-api

# Remove gateway image
echo "🗑️  Removing old image..."
docker rmi quiz_gateway_api 2>/dev/null || true

# Build without cache
echo "🔨 Building fresh image (no cache)..."
docker-compose build --no-cache gateway-api

# Start gateway
echo "🚀 Starting gateway..."
docker-compose up -d gateway-api

# Show logs
echo "📋 Showing logs..."
docker-compose logs -f --tail=50 gateway-api
