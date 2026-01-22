#!/bin/bash
# Verify that dist/main.js or dist/src/main.js exists before starting
if [ -f "dist/main.js" ]; then
  echo "✅ dist/main.js found, starting application..."
elif [ -f "dist/src/main.js" ]; then
  echo "✅ dist/src/main.js found (NestJS preserved src structure), starting application..."
else
  echo "❌ Error: dist/main.js or dist/src/main.js not found!"
  echo "Current directory: $(pwd)"
  echo "Contents:"
  ls -la
  if [ -d "dist" ]; then
    echo "dist directory contents:"
    ls -la dist/
    if [ -d "dist/src" ]; then
      echo "dist/src directory contents:"
      ls -la dist/src/
    fi
  fi
  echo "Searching for main.js..."
  find . -name "main.js" -type f 2>/dev/null | head -10
  exit 1
fi
