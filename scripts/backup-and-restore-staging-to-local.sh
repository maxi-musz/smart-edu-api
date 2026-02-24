#!/bin/bash

##############################################################################
# Backup and Restore Script: Staging (Neon) → Local PostgreSQL
# 
# This script performs a professional database migration:
# 1. Creates a timestamped backup from Neon staging database
# 2. Clears the local database (drops and recreates)
# 3. Restores the backup to local database
# 4. Verifies the restoration
#
# Usage: ./backup-and-restore-staging-to-local.sh
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
STAGING_DB="postgresql://neondb_owner:npg_vQzxad3VX5wf@ep-soft-wind-ahtfqcwx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
LOCAL_DB="postgresql://postgres:123@localhost:5432/smeh"
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_PASSWORD="123"
LOCAL_DBNAME="smeh"

# Backup directory and filename
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/staging_to_local_${TIMESTAMP}.sql"
BACKUP_CUSTOM="${BACKUP_DIR}/staging_to_local_${TIMESTAMP}.dump"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Staging (Neon) → Local Database Migration Tool          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# Step 1: Backup from Neon Staging Database
##############################################################################
echo -e "${YELLOW}[Step 1/5] Creating backup from Neon staging database...${NC}"
echo -e "${BLUE}→ Backup location: ${BACKUP_FILE}${NC}"
echo ""

# Using pg_dump with SQL format for better compatibility
if pg_dump "${STAGING_DB}" \
  --verbose \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file="${BACKUP_FILE}"; then
  echo -e "${GREEN}✓ Backup created successfully!${NC}"
  
  # Get backup file size
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo -e "${GREEN}  File size: ${BACKUP_SIZE}${NC}"
else
  echo -e "${RED}✗ Failed to create backup from staging database${NC}"
  exit 1
fi

echo ""

##############################################################################
# Step 2: Create custom format backup (optional, for faster restore)
##############################################################################
echo -e "${YELLOW}[Step 2/5] Creating custom format backup (compressed)...${NC}"
echo -e "${BLUE}→ Backup location: ${BACKUP_CUSTOM}${NC}"
echo ""

if pg_dump "${STAGING_DB}" \
  --format=custom \
  --verbose \
  --no-owner \
  --no-privileges \
  --file="${BACKUP_CUSTOM}"; then
  echo -e "${GREEN}✓ Custom format backup created successfully!${NC}"
  
  # Get backup file size
  CUSTOM_SIZE=$(du -h "${BACKUP_CUSTOM}" | cut -f1)
  echo -e "${GREEN}  File size: ${CUSTOM_SIZE}${NC}"
else
  echo -e "${YELLOW}⚠ Custom format backup failed (optional, continuing with SQL backup)${NC}"
fi

echo ""

##############################################################################
# Step 3: Verify local PostgreSQL is running
##############################################################################
echo -e "${YELLOW}[Step 3/5] Verifying local PostgreSQL connection...${NC}"

export PGPASSWORD="${LOCAL_PASSWORD}"

if psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d postgres -c "SELECT version();" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Local PostgreSQL is accessible${NC}"
else
  echo -e "${RED}✗ Cannot connect to local PostgreSQL${NC}"
  echo -e "${RED}  Please ensure PostgreSQL is running on ${LOCAL_HOST}:${LOCAL_PORT}${NC}"
  exit 1
fi

echo ""

##############################################################################
# Step 4: Drop and recreate local database
##############################################################################
echo -e "${YELLOW}[Step 4/5] Clearing local database...${NC}"
echo -e "${RED}⚠ WARNING: This will DELETE all data in local database '${LOCAL_DBNAME}'${NC}"
echo -e "${YELLOW}Press Ctrl+C within 5 seconds to cancel...${NC}"
sleep 5

echo -e "${BLUE}→ Terminating active connections...${NC}"
psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d postgres <<EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${LOCAL_DBNAME}'
  AND pid <> pg_backend_pid();
EOF

echo -e "${BLUE}→ Dropping database '${LOCAL_DBNAME}'...${NC}"
if psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${LOCAL_DBNAME};"; then
  echo -e "${GREEN}✓ Database dropped${NC}"
else
  echo -e "${RED}✗ Failed to drop database${NC}"
  exit 1
fi

echo -e "${BLUE}→ Creating fresh database '${LOCAL_DBNAME}'...${NC}"
if psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d postgres -c "CREATE DATABASE ${LOCAL_DBNAME};"; then
  echo -e "${GREEN}✓ Database created${NC}"
else
  echo -e "${RED}✗ Failed to create database${NC}"
  exit 1
fi

echo ""

##############################################################################
# Step 5: Restore backup to local database
##############################################################################
echo -e "${YELLOW}[Step 5/5] Restoring backup to local database...${NC}"
echo -e "${BLUE}→ Using backup file: ${BACKUP_FILE}${NC}"
echo ""

# Try custom format first (faster), fall back to SQL if it doesn't exist
if [ -f "${BACKUP_CUSTOM}" ]; then
  echo -e "${BLUE}→ Attempting restore with custom format (faster)...${NC}"
  if pg_restore \
    --host="${LOCAL_HOST}" \
    --port="${LOCAL_PORT}" \
    --username="${LOCAL_USER}" \
    --dbname="${LOCAL_DBNAME}" \
    --verbose \
    --no-owner \
    --no-privileges \
    "${BACKUP_CUSTOM}" 2>&1 | tee restore.log; then
    echo -e "${GREEN}✓ Custom format restore completed${NC}"
  else
    echo -e "${YELLOW}⚠ Custom format restore had warnings, checking SQL backup...${NC}"
    
    # Fall back to SQL format
    echo -e "${BLUE}→ Restoring from SQL format...${NC}"
    if psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d "${LOCAL_DBNAME}" -f "${BACKUP_FILE}" > restore.log 2>&1; then
      echo -e "${GREEN}✓ SQL format restore completed${NC}"
    else
      echo -e "${RED}✗ Restore failed${NC}"
      echo -e "${RED}  Check restore.log for details${NC}"
      exit 1
    fi
  fi
else
  # Use SQL format
  echo -e "${BLUE}→ Restoring from SQL format...${NC}"
  if psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d "${LOCAL_DBNAME}" -f "${BACKUP_FILE}" > restore.log 2>&1; then
    echo -e "${GREEN}✓ Restore completed${NC}"
  else
    echo -e "${RED}✗ Restore failed${NC}"
    echo -e "${RED}  Check restore.log for details${NC}"
    exit 1
  fi
fi

echo ""

##############################################################################
# Verification
##############################################################################
echo -e "${YELLOW}[Verification] Checking restored database...${NC}"

# Count tables
TABLE_COUNT=$(psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d "${LOCAL_DBNAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo -e "${GREEN}✓ Tables found: ${TABLE_COUNT}${NC}"

# Sample some key tables
echo -e "${BLUE}→ Checking key tables:${NC}"

# Check School table
SCHOOL_COUNT=$(psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d "${LOCAL_DBNAME}" -t -c "SELECT COUNT(*) FROM \"School\";" 2>/dev/null || echo "0")
echo -e "  Schools: ${SCHOOL_COUNT}"

# Check User table
USER_COUNT=$(psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d "${LOCAL_DBNAME}" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null || echo "0")
echo -e "  Users: ${USER_COUNT}"

# Check Assessment table
ASSESSMENT_COUNT=$(psql -h "${LOCAL_HOST}" -p "${LOCAL_PORT}" -U "${LOCAL_USER}" -d "${LOCAL_DBNAME}" -t -c "SELECT COUNT(*) FROM \"Assessment\";" 2>/dev/null || echo "0")
echo -e "  Assessments: ${ASSESSMENT_COUNT}"

echo ""

##############################################################################
# Summary
##############################################################################
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Migration Completed Successfully!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Backup created: ${BACKUP_FILE}"
echo -e "  ${GREEN}✓${NC} Backup size: ${BACKUP_SIZE:-N/A}"
echo -e "  ${GREEN}✓${NC} Local database cleared and restored"
echo -e "  ${GREEN}✓${NC} Tables restored: ${TABLE_COUNT}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Update your .env file to use local database"
echo -e "  2. Run: ${BLUE}npm run start:dev${NC}"
echo -e "  3. Test your application with the restored data"
echo ""
echo -e "${BLUE}Backup files saved in:${NC} ${BACKUP_DIR}"
echo -e "  - SQL format: ${BACKUP_FILE}"
[ -f "${BACKUP_CUSTOM}" ] && echo -e "  - Custom format: ${BACKUP_CUSTOM}"
echo ""

# Clean up
unset PGPASSWORD
rm -f restore.log

echo -e "${GREEN}✓ Migration complete!${NC}"
