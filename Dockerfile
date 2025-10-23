# Multi-stage Dockerfile for Smart Edu Backend
# Stage 1: Base image with Node.js and dependencies
# Pin to specific version to avoid CVEs
FROM node:20.18.1-alpine3.20 AS base

# Install system dependencies and update packages
RUN apk -U upgrade --no-cache && apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Stage 2: Dependencies installation
FROM base AS dependencies

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Build stage
FROM base AS build

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build the application (without running migrations)
RUN npm run build

# Stage 4: Production image
FROM node:20.18.1-alpine3.20 AS production

# Install system dependencies and update packages
RUN apk -U upgrade --no-cache && apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy Prisma schema and generated client
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application
COPY --from=build /app/dist ./dist

# Copy any additional required files
COPY --from=build /app/start-db.sh ./start-db.sh

# Set proper permissions and remove unnecessary files
RUN chown -R nestjs:nodejs /app && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application as non-root user
USER nestjs
CMD ["npm", "run", "start:prod"]
