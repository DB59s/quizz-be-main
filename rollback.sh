#!/bin/bash

# Quiz Backend Rollback Script
# This script helps rollback to a previous deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
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

# List available backups
list_backups() {
    log_info "Available backups:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi

    backups=$(ls -1dt "$BACKUP_DIR"/backup_* 2>/dev/null | head -n 10)

    if [ -z "$backups" ]; then
        log_error "No backups found in $BACKUP_DIR"
        exit 1
    fi

    local index=1
    while IFS= read -r backup; do
        backup_name=$(basename "$backup")
        backup_date=$(echo "$backup_name" | sed 's/backup_//' | sed 's/_/ /')
        echo -e "${BLUE}[$index]${NC} $backup_name (Date: $backup_date)"
        index=$((index + 1))
    done <<< "$backups"

    echo ""
}

# Select backup
select_backup() {
    read -p "Enter backup number to rollback (or 'q' to quit): " choice

    if [ "$choice" = "q" ] || [ "$choice" = "Q" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi

    if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
        log_error "Invalid input. Please enter a number."
        exit 1
    fi

    backups=$(ls -1dt "$BACKUP_DIR"/backup_* 2>/dev/null | head -n 10)
    selected_backup=$(echo "$backups" | sed -n "${choice}p")

    if [ -z "$selected_backup" ]; then
        log_error "Invalid backup number."
        exit 1
    fi

    echo "$selected_backup"
}

# Rollback to selected backup
rollback_to_backup() {
    local backup_path=$1
    local backup_name=$(basename "$backup_path")

    log_warn "You are about to rollback to: $backup_name"
    log_warn "This will:"
    echo "  1. Stop all running services"
    echo "  2. Restore environment files from backup"
    echo "  3. Checkout to previous git commit (if available)"
    echo "  4. Restart services"
    echo ""

    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi

    log_info "Starting rollback process..."

    # Stop all services
    log_info "Stopping all services..."
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi

    # Restore environment files
    log_info "Restoring environment files..."
    if [ -d "$backup_path" ]; then
        # Find all .env files in backup
        find "$backup_path" -name ".env*" -type f | while read -r env_file; do
            filename=$(basename "$env_file")
            # Find the original location
            original_file=$(find . -maxdepth 2 -name "$filename" -type f | head -n 1)

            if [ -n "$original_file" ]; then
                log_info "Restoring $filename to $original_file"
                cp "$env_file" "$original_file"
            fi
        done
    else
        log_error "Backup directory not found: $backup_path"
        exit 1
    fi

    # Ask if user wants to rollback git commit
    read -p "Do you want to rollback to a previous git commit? (yes/no): " rollback_git

    if [ "$rollback_git" = "yes" ] || [ "$rollback_git" = "y" ]; then
        log_info "Recent commits:"
        git log --oneline -n 10

        echo ""
        read -p "Enter commit hash to rollback to: " commit_hash

        if [ -n "$commit_hash" ]; then
            log_info "Rolling back to commit: $commit_hash"
            git reset --hard "$commit_hash"
            git clean -fd
        fi
    fi

    # Restart services
    log_info "Restarting services..."
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi

    # Wait for services
    log_info "Waiting for services to start..."
    sleep 30

    # Check service status
    log_info "Checking service status..."
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi

    log_info "Rollback completed!"
}

# Show service logs
show_logs() {
    log_info "Recent logs from all services:"
    if docker compose version &> /dev/null; then
        docker compose logs --tail=50
    else
        docker-compose logs --tail=50
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "Quiz Backend Rollback Script"
    echo "=========================================="
    echo ""

    list_backups
    backup_path=$(select_backup)
    rollback_to_backup "$backup_path"
    show_logs

    echo ""
    echo "=========================================="
    log_info "Rollback process completed!"
    echo "=========================================="
}

# Run main function
main
