#!/bin/bash

# Quiz Backend Deployment Script for Ubuntu Server
# This script should be run on the Ubuntu server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR=$(pwd)
BACKUP_DIR="../backups"

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

# Create backup
create_backup() {
    log_info "Creating backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_path="$BACKUP_DIR/backup_$timestamp"
    mkdir -p "$backup_path"

    # Backup environment files
    if [ -f ".env" ]; then
        cp .env "$backup_path/"
    fi

    # Backup other important configs
    find . -maxdepth 2 -name ".env*" -exec cp {} "$backup_path/" \;

    log_info "Backup created at: $backup_path"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed!"
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        log_error "Git is not installed!"
        exit 1
    fi

    log_info "All prerequisites are met!"
}

# Pull latest code
pull_latest_code() {
    log_info "Pulling latest code from deploy branch..."

    git fetch origin

    # Check if there are local changes
    if ! git diff-index --quiet HEAD --; then
        log_warn "Local changes detected. Stashing them..."
        git stash
    fi

    git reset --hard origin/deploy
    git clean -fd

    log_info "Code updated successfully!"
}

# Stop services
stop_services() {
    log_info "Stopping all services..."

    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi

    log_info "Services stopped!"
}

# Clean up Docker resources
cleanup_docker() {
    log_info "Cleaning up Docker resources..."

    # Remove unused images older than 24 hours
    docker image prune -af --filter "until=24h" || true

    # Remove unused volumes (be careful with this)
    # docker volume prune -f || true

    log_info "Docker cleanup completed!"
}

# Build and start services
start_services() {
    log_info "Building and starting services..."

    if docker compose version &> /dev/null; then
        # Using Docker Compose V2
        docker compose pull
        docker compose build --no-cache
        docker compose up -d
    else
        # Using Docker Compose V1
        docker-compose pull
        docker-compose build --no-cache
        docker-compose up -d
    fi

    log_info "Services started!"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."

    sleep 30

    log_info "Services should be ready now!"
}

# Check service status
check_services() {
    log_info "Checking service status..."

    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi

    # Check if any service failed
    if docker ps -a | grep -E "Exit|Restarting"; then
        log_error "Some services failed to start properly!"
        log_info "Recent logs:"
        if docker compose version &> /dev/null; then
            docker compose logs --tail=100
        else
            docker-compose logs --tail=100
        fi
        exit 1
    fi

    log_info "All services are running successfully!"
}

# Show logs
show_logs() {
    log_info "Recent logs from all services:"

    if docker compose version &> /dev/null; then
        docker compose logs --tail=50
    else
        docker-compose logs --tail=50
    fi
}

# Main deployment process
main() {
    echo "=========================================="
    echo "Quiz Backend Deployment Script"
    echo "=========================================="

    cd "$PROJECT_DIR"

    check_prerequisites
    create_backup
    pull_latest_code
    stop_services
    cleanup_docker
    start_services
    wait_for_services
    check_services
    show_logs

    echo "=========================================="
    log_info "Deployment completed successfully!"
    echo "=========================================="
}

# Run main function
main
