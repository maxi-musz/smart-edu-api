#!/bin/bash

# =================================
# BACKUP LOCAL DATABASE
# =================================
# This script backs up your local PostgreSQL database
# Usage: ./scripts/backup-local-db.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_URL="postgresql://macbook:mypassword@localhost:5432/latest_smart_edu"
BACKUP_DIR="./backups/local"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/local_db_backup_$TIMESTAMP.sql"

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

echo -e "${BLUE}💾 Backing Up Local Database${NC}"
echo "=================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_error "PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql"
    echo "  # or"
    echo "  pg_ctl -D /usr/local/var/postgres start"
    exit 1
fi

# Test database connection
print_info "Testing database connection..."
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_error "Cannot connect to database: $DB_URL"
    echo "Please check your database credentials and ensure the database exists."
    exit 1
fi
print_status "Database connection successful"

# Create backup
print_info "Creating backup..."
pg_dump "$DB_URL" > "$BACKUP_FILE"

# Check backup file
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_status "Backup created successfully!"
    echo ""
    echo -e "${BLUE}📊 Backup Details:${NC}"
    echo "  • File: $BACKUP_FILE"
    echo "  • Size: $BACKUP_SIZE"
    echo "  • Database: latest_smart_edu"
    echo "  • Timestamp: $(date)"
    echo ""
    echo -e "${BLUE}🔄 Next Steps:${NC}"
    echo "  • Copy to Docker: cp $BACKUP_FILE backup_local_db.sql"
    echo "  • Restore to dev: make restore-dev"
    echo "  • Restore to staging: make restore-staging"
else
    print_error "Backup failed - file is empty or doesn't exist"
    exit 1
fi

# Keep only last 5 backups
print_info "Cleaning up old backups (keeping last 5)..."
cd "$BACKUP_DIR"
ls -t local_db_backup_*.sql | tail -n +6 | xargs -r rm
cd - > /dev/null

print_status "Backup completed at $(date)"
