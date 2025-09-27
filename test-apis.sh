#!/bin/bash

echo "🧪 Testing Quiz Microservices APIs..."
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test Gateway API
echo "📡 Testing Gateway API (http://localhost:8080)..."
echo "1. Health check:"
curl -s http://localhost:8080/ | jq . || echo "❌ Gateway API not responding"
echo ""

echo "2. API Documentation:"
curl -s -I http://localhost:8080/api-docs | head -n 1
echo ""

# Test User Service API
echo "📡 Testing User Service API (http://localhost:3001)..."
echo "1. Health check:"
curl -s http://localhost:3001/ | jq . || echo "❌ User Service API not responding"
echo ""

echo "2. Users endpoint:"
curl -s http://localhost:3001/api/v1/users | jq . || echo "❌ Users endpoint not responding"
echo ""

echo "3. Students endpoint:"
curl -s http://localhost:3001/api/v1/students | jq . || echo "❌ Students endpoint not responding"
echo ""

# Test Database connections
echo "🗄️ Testing Database connections..."
echo "1. MySQL connection:"
docker-compose exec -T mysql mysql -u gateway_user -pgateway_password gateway_db -e "SELECT 'MySQL connected' as status;" || echo "❌ MySQL connection failed"
echo ""

echo "2. MongoDB connection:"
docker-compose exec -T mongodb mongosh -u admin -p adminpassword --authenticationDatabase admin --eval "db.runCommand('ping')" || echo "❌ MongoDB connection failed"
echo ""

echo "✅ API testing completed!"
echo ""
echo "🌐 Available endpoints:"
echo "   Gateway API: http://localhost:8080"
echo "   Gateway API Docs: http://localhost:8080/api-docs"
echo "   User Service: http://localhost:3001"
echo "   User Service Health: http://localhost:3001/api/v1"
