# =============================================================================
# Sunny Stack Discord Bot - Multi-Stage Docker Build
# =============================================================================
# This Dockerfile builds the Discord bot for deployment on Raspberry Pi 4B
# Next.js frontend remains on Vercel - bot runs independently
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM --platform=linux/arm64 node:18-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy bot package files (bot has only 4 runtime dependencies)
# See ADR-001: bot/package.json approach
COPY bot/package.json bot/package-lock.json* ./

# Install bot dependencies only
RUN npm ci --only=production && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM --platform=linux/arm64 node:18-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy root package.json for ALL dependencies (including devDependencies)
COPY package.json package-lock.json* ./

# Copy Prisma schema (needed before npm ci to generate client)
COPY prisma ./prisma/

# Install ALL dependencies (needed for TypeScript compilation)
RUN npm ci

# Generate Prisma Client (required for TypeScript types)
RUN npx prisma generate

# Copy source files needed for bot build
COPY bot/ ./bot/
COPY lib/ ./lib/
COPY tsconfig.json ./
COPY tsconfig.bot.json ./

# Set build environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Clean any pre-existing compiled code to force fresh compilation
RUN rm -rf bot/dist/ bot/*.tsbuildinfo

# Compile TypeScript bot code
# Output goes to bot/dist/ per tsconfig.bot.json
RUN npx tsc --project tsconfig.bot.json

# Validate compiled code references correct environment file
RUN grep -q '\.env\.production' bot/dist/bot/index.js || \
    (echo "ERROR: Compiled code does not reference .env.production" && exit 1)

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM --platform=linux/arm64 node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 botuser && \
    adduser --system --uid 1001 botuser

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./bot/node_modules

# Copy compiled bot from builder (TypeScript output)
COPY --from=builder --chown=botuser:botuser /app/bot/dist ./bot/dist

# Copy bot package.json for runtime
COPY --chown=botuser:botuser bot/package.json ./bot/package.json

# Copy environment template (actual .env will be mounted as secret)
COPY --chown=botuser:botuser .env.example ./.env.example

# Create logs directory with proper permissions
RUN mkdir -p /app/bot/logs && chown -R botuser:botuser /app/bot

# Switch to non-root user
USER botuser

# Change working directory to bot directory for module-alias resolution
WORKDIR /app/bot

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

# Start the compiled bot from dist/bot/ (relative to /app/bot)
CMD ["node", "dist/bot/index.js"]
