#!/bin/bash

# Health Check Script for Quiz Backend Services
# This script checks the health of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=5
RETRY_INTERVAL=3

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_fail() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if service is healthy
check_service() {
    local service_name=$1
    local health_url=$2
    local retry=0

    echo -n "Checking $service_name... "

    while [ $retry -lt $MAX_RETRIES ]; do
        if curl -f -s -o /dev/null "$health_url"; then
            log_success "$service_name is healthy"
            return 0
        fi

        retry=$((retry + 1))
        if [ $retry -lt $MAX_RETRIES ]; then
            sleep $RETRY_INTERVAL
        fi
    done

    log_fail "$service_name is NOT healthy"
    return 1
}

# Check Docker service status
check_docker_status() {
    local service_name=$1

    echo -n "Docker status for $service_name... "

    if docker compose ps "$service_name" 2>/dev/null | grep -q "Up"; then
        log_success "$service_name container is running"
        return 0
    else
        log_fail "$service_name container is NOT running"
        return 1
    fi
}

# Check database connectivity
check_database() {
    local db_name=$1
    local db_type=$2
    local container_name=$3

    echo -n "Checking $db_name database... "

    case $db_type in
        mysql)
            if docker exec "$container_name" mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
                log_success "$db_name is accessible"
                return 0
            fi
            ;;
        postgres)
            if docker exec "$container_name" pg_isready -q 2>/dev/null; then
                log_success "$db_name is accessible"
                return 0
            fi
            ;;
    esac

    log_fail "$db_name is NOT accessible"
    return 1
}

# Main health check
main() {
    echo "=========================================="
    echo "Quiz Backend Health Check"
    echo "=========================================="
    echo ""

    local failed_checks=0

    # Check if Docker is running
    log_info "Checking Docker..."
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running!"
        exit 1
    fi
    log_success "Docker is running"
    echo ""

    # Check if docker-compose is available
    log_info "Checking Docker Compose..."
    if docker compose version &> /dev/null; then
        log_success "Docker Compose V2 is available"
    elif docker-compose --version &> /dev/null; then
        log_success "Docker Compose V1 is available"
    else
        log_error "Docker Compose is not available!"
        exit 1
    fi
    echo ""

    # Check Docker services status
    log_info "Checking Docker services status..."
    check_docker_status "gateway-api" || ((failed_checks++))
    check_docker_status "user-service-api" || ((failed_checks++))
    check_docker_status "class-service-api" || ((failed_checks++))
    check_docker_status "question-service-api" || ((failed_checks++))
    check_docker_status "quiz-service-api" || ((failed_checks++))
    check_docker_status "submission-service-api" || ((failed_checks++))
    check_docker_status "chatbot-service-api" || ((failed_checks++))
    check_docker_status "knowledge-service-api" || ((failed_checks++))
    echo ""

    # Check databases
    log_info "Checking databases..."
    check_database "Gateway MySQL" "mysql" "quiz_mysql_gateway" || ((failed_checks++))
    check_database "Question MySQL" "mysql" "quiz_mysql_question" || ((failed_checks++))
    check_database "Quiz PostgreSQL" "postgres" "quiz_postgres_quiz" || ((failed_checks++))
    check_database "Submission PostgreSQL" "postgres" "quiz_postgres_submission" || ((failed_checks++))
    check_database "Chatbot PostgreSQL" "postgres" "quiz_postgres_chatbot" || ((failed_checks++))
    echo ""

    # Check API endpoints
    log_info "Checking API endpoints..."
    check_service "Gateway API" "http://localhost:9008/health" || ((failed_checks++))
    check_service "User Service" "http://localhost:9004/api/v1/health" || ((failed_checks++))
    check_service "Class Service" "http://localhost:9007/" || ((failed_checks++))
    check_service "Question Service" "http://localhost:9012/api/health" || ((failed_checks++))
    check_service "Quiz Service" "http://localhost:9010/api/health" || ((failed_checks++))
    check_service "Submission Service" "http://localhost:9011/api/health" || ((failed_checks++))
    check_service "Chatbot Service" "http://localhost:9013/api/health" || ((failed_checks++))
    check_service "Knowledge Service" "http://localhost:9009/health" || ((failed_checks++))
    echo ""

    # Summary
    echo "=========================================="
    if [ $failed_checks -eq 0 ]; then
        log_success "All health checks passed! ✓"
        echo "=========================================="
        exit 0
    else
        log_error "$failed_checks health check(s) failed!"
        echo "=========================================="
        echo ""
        log_info "Showing logs of failed services..."
        echo ""

        if docker compose version &> /dev/null; then
            docker compose logs --tail=50
        else
            docker-compose logs --tail=50
        fi

        exit 1
    fi
}

# Run main function
main
