# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install dependencies for building native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies including dev
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/system/health || exit 1

# Start the application
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=development /app/dist ./dist

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/system/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

# Testing stage
FROM base AS testing

# Copy test files
COPY . .

# Install all dependencies
RUN npm ci

# Run tests
RUN npm test

# Build coverage report
RUN npm run test:coverage

# Security audit
RUN npm audit --audit-level moderate

# Lint code
RUN npm run lint

# Build the application
RUN npm run build

# Keep this stage for local development and testing
CMD ["npm", "test"]