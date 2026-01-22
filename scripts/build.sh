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
$NEST_CMD build
