#!/bin/bash

# =================================
# STAGING DEPLOYMENT SCRIPT
# =================================
# This script deploys the Smart Edu Backend to staging environment
# Run with: ./scripts/deploy-staging.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="staging"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"
BACKUP_DIR="./backups/staging"

echo -e "${BLUE}🚀 Starting Staging Deployment${NC}"
echo "=================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env.staging exists
if [ ! -f "$ENV_FILE" ]; then
    print_error ".env.staging file not found!"
    echo "Please copy env.staging.example to .env.staging and configure it:"
    echo "  cp env.staging.example .env.staging"
    echo "  # Edit .env.staging with your staging configuration"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if staging environment is already running
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_warning "Staging environment is already running. Creating backup before deployment..."
    
    # Create backup of current staging database
    echo "Creating database backup..."
    docker-compose -f "$COMPOSE_FILE" exec -T db-backup /backup.sh staging || true
    print_status "Backup created"
fi

# Pull latest images
echo "Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build and start staging environment
echo "Building and starting staging environment..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "Checking service health..."

# Check PostgreSQL
if ! docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not ready"
    docker-compose -f "$COMPOSE_FILE" logs postgres
    exit 1
fi
print_status "PostgreSQL is ready"

# Check Redis
if ! docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_error "Redis is not ready"
    docker-compose -f "$COMPOSE_FILE" logs redis
    exit 1
fi
print_status "Redis is ready"

# Run database migrations
echo "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T app npm run prisma:migrate
print_status "Database migrations completed"

# Run database seeding (optional - uncomment if needed)
# echo "Seeding database with sample data..."
# docker-compose -f "$COMPOSE_FILE" exec -T app npm run prisma:seed
# print_status "Database seeded"

# Check application health
echo "Checking application health..."
sleep 5

if curl -f http://localhost:2000/api/v1/health > /dev/null 2>&1; then
    print_status "Application is healthy"
else
    print_error "Application health check failed"
    docker-compose -f "$COMPOSE_FILE" logs app
    exit 1
fi

# Display deployment information
echo ""
echo -e "${GREEN}🎉 Staging Deployment Successful!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo "  • API: http://localhost:2000/api/v1"
echo "  • API Docs: http://localhost:2000/api/docs"
echo "  • Prisma Studio: http://localhost:5556"
echo "  • Nginx (Load Balancer): http://localhost:8080"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "  • View logs: make staging-logs"
echo "  • Stop staging: make staging-stop"
echo "  • Restart staging: make staging-restart"
echo "  • Database shell: make db-shell-staging"
echo "  • Application shell: make shell-staging"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo "  • Container status: make status-staging"
echo "  • Health check: make health-staging"
echo "  • Database backup: make backup-staging"
echo ""

# Show running containers
echo -e "${BLUE}🐳 Running Containers:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
print_status "Staging environment is ready for testing!"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "  1. Test your API endpoints"
echo "  2. Share staging URL with your team/clients"
echo "  3. Monitor logs for any issues"
echo "  4. When ready, deploy to production with: make prod-deploy"
echo ""

# Optional: Send notification (uncomment and configure if needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"Staging deployment completed successfully!"}' \
#     YOUR_SLACK_WEBHOOK_URL

print_status "Deployment completed at $(date)"
