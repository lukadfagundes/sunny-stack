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

# Copy bot package files (bot has only 4 runtime dependencies)
# See ADR-001: bot/package.json approach
COPY bot/package.json bot/package-lock.json* ./

# Install bot dependencies only
RUN npm ci --only=production && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Install TypeScript and build tools for compilation
RUN npm install -g typescript@5.5.0

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./bot/node_modules

# Copy source files needed for bot build
COPY bot/ ./bot/
COPY lib/ ./lib/
COPY tsconfig.bot.json ./
COPY package.json ./

# Set build environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Compile TypeScript bot code
# Output goes to bot/dist/ per tsconfig.bot.json
RUN tsc --project tsconfig.bot.json

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

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./bot/node_modules

# Copy compiled bot from builder (TypeScript output)
COPY --from=builder --chown=botuser:botuser /app/bot/dist ./bot/dist

# Copy bot package.json for runtime
COPY --chown=botuser:botuser bot/package.json ./bot/package.json

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

# Start the compiled bot from dist/
CMD ["node", "bot/dist/index.js"]
