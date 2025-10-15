#!/bin/bash

# Production Deployment Script for Smart Edu Backend
# This script deploys the application to production using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "🚀 Smart Edu Backend Production Deployment"
echo "=========================================="

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    print_error ".env.prod file not found!"
    print_info "Please create .env.prod file with your production environment variables."
    print_info "You can copy from env.production.example:"
    print_info "  cp env.production.example .env.prod"
    exit 1
fi

print_status ".env.prod file found"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

print_status "docker-compose is available"

# Backup existing containers (if any)
print_info "Backing up existing containers..."
if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
    print_info "Existing containers found. Creating backup..."
    docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh 2>/dev/null || print_warning "Backup failed or backup service not running"
fi

# Build and start production environment
print_info "Building production images..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

print_info "Starting production services..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 15

# Check service health
print_info "Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
    print_warning "Some services are not healthy. Checking logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=20
fi

# Run database migrations
print_info "Running database migrations..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec app npm run prisma:migrate

# Test the application
print_info "Testing application health..."
if curl -f http://localhost:1000/api/v1/health > /dev/null 2>&1; then
    print_status "Application is healthy and responding"
else
    print_warning "Application health check failed. Check logs with:"
    print_info "  docker-compose -f docker-compose.prod.yml logs app"
fi

# Show deployment summary
echo ""
print_status "Production deployment completed!"
echo ""
print_info "Service URLs:"
echo "  API: http://localhost:1000/api/v1"
echo "  Health: http://localhost:1000/api/v1/health"
echo "  API Docs: http://localhost:1000/api/docs"
echo ""
print_info "Management commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  Restart app: docker-compose -f docker-compose.prod.yml restart app"
echo "  Create backup: docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh"
echo ""
print_info "Container status:"
docker-compose -f docker-compose.prod.yml ps
