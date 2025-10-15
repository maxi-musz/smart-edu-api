#!/bin/bash

# =================================
# RESTORE LOCAL DATA TO DOCKER DBS
# =================================
# This script restores your local database backup to Docker databases
# Usage: ./scripts/restore-local-data.sh [dev|staging]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_FILE="./backup_local_db.sql"
COMPOSE_FILE=""
DB_CONTAINER=""
DB_NAME=""
ENVIRONMENT=""

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    echo "Please create a backup first:"
    echo "  pg_dump 'postgresql://macbook:mypassword@localhost:5432/latest_smart_edu' > backup_local_db.sql"
    exit 1
fi

# Determine environment
if [ "$1" = "dev" ]; then
    ENVIRONMENT="development"
    COMPOSE_FILE="docker-compose.dev.yml"
    DB_CONTAINER="smart-edu-dev-db"
    DB_NAME="smart-edu-db"
elif [ "$1" = "staging" ]; then
    ENVIRONMENT="staging"
    COMPOSE_FILE="docker-compose.staging.yml"
    DB_CONTAINER="smart-edu-staging-postgres"
    DB_NAME="smart_edu_staging"
else
    print_error "Please specify environment: dev or staging"
    echo "Usage: $0 [dev|staging]"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Restore to development database"
    echo "  $0 staging  # Restore to staging database"
    exit 1
fi

echo -e "${BLUE}🔄 Restoring Local Data to $ENVIRONMENT Environment${NC}"
echo "=============================================="

# Check if Docker containers are running
if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_warning "$ENVIRONMENT environment is not running"
    echo "Starting $ENVIRONMENT environment..."
    docker-compose -f "$COMPOSE_FILE" up -d
    sleep 10
fi

# Wait for database to be ready
print_info "Waiting for database to be ready..."
until docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""
print_status "Database is ready"

# Check if database exists
if ! docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_info "Creating database: $DB_NAME"
    docker-compose -f "$COMPOSE_FILE" exec -T postgres createdb -U postgres "$DB_NAME"
    print_status "Database created"
fi

# Drop existing data (optional - ask user)
if [ "$2" = "--force" ]; then
    print_info "Force mode enabled - skipping confirmation"
else
    print_warning "This will replace ALL existing data in the $ENVIRONMENT database!"
    echo -n "Do you want to continue? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi
fi

# Stop app container to release database connections
print_info "Stopping app container to release database connections..."
docker-compose -f "$COMPOSE_FILE" stop app

# Drop and recreate database to ensure clean restore
print_info "Dropping existing database..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres dropdb -U postgres --if-exists "$DB_NAME"
print_info "Creating fresh database..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres createdb -U postgres "$DB_NAME"

# Restore the backup
print_info "Restoring backup to $ENVIRONMENT database..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d "$DB_NAME" < "$BACKUP_FILE"

# Start app container
print_info "Starting app container..."
docker-compose -f "$COMPOSE_FILE" start app

# Run migrations to ensure schema is up to date
print_info "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T app npm run prisma:migrate

# Verify restore
print_info "Verifying restore..."
TABLE_COUNT=$(docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' \n')

echo ""
print_status "Restore completed successfully!"
echo "=============================================="
echo -e "${BLUE}📊 Database Statistics:${NC}"
echo "  • Environment: $ENVIRONMENT"
echo "  • Database: $DB_NAME"
echo "  • Tables: $TABLE_COUNT"
echo "  • Backup file: $BACKUP_FILE"
echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
if [ "$1" = "dev" ]; then
    echo "  • API: http://localhost:1000/api/v1"
    echo "  • API Docs: http://localhost:1000/api/docs"
    echo "  • Prisma Studio: http://localhost:5555"
elif [ "$1" = "staging" ]; then
    echo "  • API: http://localhost:2000/api/v1"
    echo "  • API Docs: http://localhost:2000/api/docs"
    echo "  • Prisma Studio: http://localhost:5556"
fi
echo ""
print_status "Your local testing data is now available in $ENVIRONMENT environment!"
