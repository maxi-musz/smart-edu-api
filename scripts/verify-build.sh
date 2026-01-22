#!/bin/bash
# Verify that dist/main.js exists before starting
if [ ! -f "dist/main.js" ]; then
  echo "❌ Error: dist/main.js not found!"
  echo "Current directory: $(pwd)"
  echo "Contents:"
  ls -la
  if [ -d "dist" ]; then
    echo "dist directory contents:"
    ls -la dist/
  fi
  echo "Searching for main.js..."
  find . -name "main.js" -type f 2>/dev/null | head -10
  exit 1
fi
echo "✅ dist/main.js found, starting application..."
