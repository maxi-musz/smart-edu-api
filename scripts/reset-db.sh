#!/bin/bash

# Script to completely reset the database and migrations
# This will:
# 1. Drop all tables in the database
# 2. Delete all migration files locally
# 3. Create a fresh migration
# 4. Apply the migration
# 5. Seed the database

set -e

echo "⚠️  WARNING: This will completely reset your database and delete all migration files!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️  Dropping all tables from database..."
npx prisma migrate reset --force --skip-seed

echo "🗑️  Deleting all migration files..."
# Delete all migration directories but keep migration_lock.toml
find prisma/migrations -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +

echo "📝 Creating fresh migration..."
npx prisma migrate dev --name initial_schema --create-only

echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "1. Review the migration file in prisma/migrations/"
echo "2. Run: npm run prisma:migrate (to apply migration)"
echo "3. Run: npm run prisma:seed (to seed the database)"
