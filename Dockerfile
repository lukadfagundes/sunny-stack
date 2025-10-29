# =============================================================================
# Sunny Stack Discord Bot - Multi-Stage Docker Build
# =============================================================================
# This Dockerfile builds the Discord bot for deployment on Raspberry Pi 4B
# Next.js frontend remains on Vercel - bot runs independently
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Copy environment variables for build (if needed)
# Note: Build-time secrets should be passed via --build-arg
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build TypeScript (if using TypeScript for bot)
# If bot is in /bot directory, we only need to compile that
RUN npm run build:bot || echo "No build:bot script found, skipping..."

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 botuser && \
    adduser --system --uid 1001 botuser

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder --chown=botuser:botuser /app/bot ./bot
COPY --from=builder --chown=botuser:botuser /app/lib ./lib
COPY --from=builder --chown=botuser:botuser /app/package.json ./package.json

# Copy environment template (actual .env will be mounted as secret)
COPY --chown=botuser:botuser .env.example ./.env.example

# Switch to non-root user
USER botuser

# Expose health check port (optional)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Health check (optional - if bot exposes health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the bot
CMD ["node", "bot/index.js"]
