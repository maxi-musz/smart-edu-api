#!/bin/bash
set -e

# Find nest CLI in common locations
NEST_CMD=""

# Try different locations
if command -v nest &> /dev/null; then
  NEST_CMD="nest"
elif [ -f "./node_modules/.bin/nest" ]; then
  NEST_CMD="./node_modules/.bin/nest"
elif [ -f "node_modules/.bin/nest" ]; then
  NEST_CMD="node_modules/.bin/nest"
elif [ -f "$(npm bin)/nest" ]; then
  NEST_CMD="$(npm bin)/nest"
else
  # Last resort: try to find it via node
  NEST_PATH=$(find node_modules -name "nest.js" -path "*/@nestjs/cli/bin/*" 2>/dev/null | head -1)
  if [ -n "$NEST_PATH" ]; then
    NEST_CMD="node $NEST_PATH"
  elif [ -f "node_modules/@nestjs/cli/bin/nest.js" ]; then
    NEST_CMD="node node_modules/@nestjs/cli/bin/nest.js"
  else
    echo "Error: Could not find nest CLI. Make sure @nestjs/cli is installed in devDependencies."
    echo "Tried: nest, ./node_modules/.bin/nest, node_modules/.bin/nest, \$(npm bin)/nest"
    exit 1
  fi
fi

echo "Using nest command: $NEST_CMD"
echo "Current directory: $(pwd)"
echo "Running nest build..."
$NEST_CMD build

# Verify build output - check both standard location and src subdirectory
BUILD_SUCCESS=false
if [ -f "dist/main.js" ]; then
  echo "✅ Build successful: dist/main.js exists in $(pwd)/dist/"
  ls -la dist/ | head -10
  BUILD_SUCCESS=true
elif [ -f "dist/src/main.js" ]; then
  echo "✅ Build successful: dist/src/main.js exists (NestJS preserved src structure)"
  ls -la dist/src/ | head -10
  BUILD_SUCCESS=true
elif [ -f "../dist/main.js" ]; then
  echo "✅ Build successful: dist/main.js exists in parent directory"
  ls -la ../dist/ | head -10
  BUILD_SUCCESS=true
elif [ -f "src/dist/main.js" ]; then
  echo "✅ Build successful: dist/main.js exists in src/dist/"
  ls -la src/dist/ | head -10
  BUILD_SUCCESS=true
fi

if [ "$BUILD_SUCCESS" = false ]; then
  echo "❌ Build failed: dist/main.js or dist/src/main.js not found"
  echo "Contents of current directory:"
  ls -la
  if [ -d "dist" ]; then
    echo "dist directory exists but main.js is missing:"
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
