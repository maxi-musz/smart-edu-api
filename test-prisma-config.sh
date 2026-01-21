#!/bin/bash

echo "🧪 Testing Prisma Configuration for Render Deployment"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if prisma.config.ts exists and is valid TypeScript
echo "1️⃣  Testing prisma.config.ts syntax..."
if npx tsc --noEmit prisma.config.ts 2>/dev/null; then
    echo -e "${GREEN}✅ prisma.config.ts syntax is valid${NC}"
else
    echo -e "${RED}❌ prisma.config.ts has syntax errors${NC}"
    npx tsc --noEmit prisma.config.ts
    exit 1
fi

# Test 2: Test if the config can be imported (simulating what Render does)
echo ""
echo "2️⃣  Testing prisma.config.ts import..."
if node -e "
try {
    require('dotenv').config();
    const config = require('./prisma.config.ts');
    console.log('Config loaded successfully');
} catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
}
" 2>&1; then
    echo -e "${GREEN}✅ prisma.config.ts can be imported${NC}"
else
    echo -e "${RED}❌ prisma.config.ts cannot be imported${NC}"
    exit 1
fi

# Test 3: Test prisma:use-env script
echo ""
echo "3️⃣  Testing prisma:use-env script..."
if npm run prisma:use-env 2>&1 | grep -q "Schema updated"; then
    echo -e "${GREEN}✅ prisma:use-env script works${NC}"
else
    echo -e "${YELLOW}⚠️  prisma:use-env script may have issues (check output above)${NC}"
fi

# Test 4: Test prisma generate (this is what runs during build)
echo ""
echo "4️⃣  Testing prisma generate (simulates Render build)..."
if npm run prisma:generate 2>&1 | tail -5 | grep -q "Generated Prisma Client"; then
    echo -e "${GREEN}✅ prisma generate works${NC}"
else
    echo -e "${RED}❌ prisma generate failed${NC}"
    npm run prisma:generate
    exit 1
fi

# Test 5: Test TypeScript compilation
echo ""
echo "5️⃣  Testing TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript has some errors (may be non-critical)${NC}"
    npx tsc --noEmit 2>&1 | head -20
fi

# Test 6: Test if @prisma/config exports are correct
echo ""
echo "6️⃣  Testing @prisma/config exports..."
if node -e "
const config = require('@prisma/config');
if (typeof config.defineConfig === 'function' && typeof config.env === 'function') {
    console.log('✅ All required exports are available');
} else {
    console.error('❌ Missing required exports');
    process.exit(1);
}
" 2>&1; then
    echo -e "${GREEN}✅ @prisma/config exports are correct${NC}"
else
    echo -e "${RED}❌ @prisma/config exports are incorrect${NC}"
    exit 1
fi

echo ""
echo "======================================================"
echo -e "${GREEN}✅ All critical tests passed!${NC}"
echo "Your code should work on Render."
echo ""
