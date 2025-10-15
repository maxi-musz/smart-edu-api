#!/bin/bash

# Database backup script for Smart Edu Backend
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="smart_edu_backup_${DATE}.sql"
RETENTION_DAYS=30

# Database connection parameters
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_NAME="${POSTGRES_DB:-smart_edu_prod}"
DB_USER="${POSTGRES_USER:-postgres}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Create the backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --file="$BACKUP_DIR/$BACKUP_FILE"

# Compress the backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Verify the backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    echo "Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
else
    echo "ERROR: Backup failed!"
    exit 1
fi

# Clean up old backups (keep only last 30 days)
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "smart_edu_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully at $(date)"
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"
