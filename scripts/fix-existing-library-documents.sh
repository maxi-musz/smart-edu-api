#!/bin/bash

# Script to fix existing library documents
# This script runs the TypeScript fix script

echo "🔧 Fixing existing library documents..."
echo ""

# Check if ts-node is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install Node.js and npm."
    exit 1
fi

# Run the fix script
echo "Running fix script..."
echo ""

# Dry run first (recommended)
echo "📋 Running DRY RUN first to see what would be changed..."
npx ts-node scripts/fix-existing-library-documents.ts --dry-run

echo ""
read -p "Do you want to apply these changes? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Applying fixes..."
    npx ts-node scripts/fix-existing-library-documents.ts
    echo ""
    echo "✅ Fixes applied!"
else
    echo "❌ Cancelled. No changes made."
fi
