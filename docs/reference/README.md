# Reference Documentation

Quick reference guide for Sunny Stack Portfolio commands, environment variables, configuration, and conventions.

## Table of Contents

- [NPM Scripts](#npm-scripts)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Coding Conventions](#coding-conventions)
- [Project Constants](#project-constants)
- [Database Schema](#database-schema)
- [Error Codes](#error-codes)

---

## NPM Scripts

### Development

```bash
npm run dev                   # Start Next.js dev server (localhost:3000)
npm run build                 # Build Next.js for production
npm start                     # Start production Next.js server
```

### Type Checking

```bash
npm run type-check            # Run TypeScript compiler (no emit)
```

### Linting

```bash
npm run lint                  # Run ESLint
npm run lint:fix              # Auto-fix ESLint issues
```

### Testing

```bash
npm test                      # Run Jest unit tests
npm run test:ci               # Run tests in CI mode (max 2 workers)
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report

npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:ui           # Run E2E tests with Playwright UI
npm run test:e2e:debug        # Debug E2E tests
```

### Discord Bot

```bash
npm run build:bot             # Build Discord bot (tsconfig.bot.json)
npm run build:bot:check       # Type-check bot without emitting
npm run build:bot:watch       # Watch mode for bot development

npm run bot:dev               # Run bot in development mode
npm run bot:deploy            # Deploy Discord slash commands
npm run bot:test              # Test Discord bot commands
```

### Bundle Analysis

```bash
npm run analyze               # Analyze bundle size
npm run analyze:server        # Analyze server bundle
npm run analyze:browser       # Analyze browser bundle
```

### Environment Validation

```bash
npm run validate:env          # Validate all environment variables
npm run validate:env:pi       # Validate Pi-specific variables
npm run validate:env:vercel   # Validate Vercel-specific variables
npm run validate:prerequisites # Validate system prerequisites (bash)
```

### Package Management

```bash
npm install                   # Install dependencies
npm update                    # Update dependencies
npm outdated                  # Check for outdated packages
npm audit                     # Security audit
npm audit fix                 # Auto-fix security issues
```

---

## Environment Variables

### Required Variables

#### Database

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
# PostgreSQL connection string
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?connection_limit=20
```

#### Email Service

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# Resend API key for transactional emails
# Get from: https://resend.com/api-keys
```

#### Site Configuration

```bash
NEXT_PUBLIC_SITE_URL=https://sunny-stack.com
# Public site URL (used for absolute links)
# Development: http://localhost:3000
# Production: https://sunny-stack.com
```

### Authentication (Google OAuth)

```bash
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
# Google OAuth Client ID
# Get from: https://console.cloud.google.com/apis/credentials

GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
# Google OAuth Client Secret

NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Random string for session encryption
# Generate with: openssl rand -base64 32

NEXTAUTH_URL=http://localhost:3000
# NextAuth callback URL
# Must match authorized redirect URI in Google Console

ADMIN_EMAIL=admin@example.com
# Email address allowed to access admin dashboard
```

### Discord Bot (Optional)

```bash
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Discord bot token
# Get from: https://discord.com/developers/applications

DISCORD_APPLICATION_ID=1234567890123456789
# Discord application ID

DISCORD_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Discord public key for interaction verification

DISCORD_GUILD_ID=1234567890123456789
# Discord server (guild) ID for testing commands

BOT_API_URL=https://sunny-stack.com
# Base URL for bot to call Vercel API
# Development: http://localhost:3000
# Production: https://sunny-stack.com

BOT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Shared secret for bot authentication
# Generate with: openssl rand -base64 32
```

### Error Monitoring (Production)

```bash
ROLLBAR_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Rollbar access token for error tracking
# Get from: https://rollbar.com/settings/account/access-tokens

ROLLBAR_ENVIRONMENT=production
# Environment name for Rollbar
# Values: development, staging, production
```

### Service Monitoring (Optional)

```bash
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Cloudflare API token for status monitoring

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# GitHub personal access token for API monitoring

VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Vercel API token for deployment monitoring

FLY_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Fly.io API token (if using Fly.io)
```

### Node Environment

```bash
NODE_ENV=development
# Node environment
# Values: development, production, test
```

---

## Configuration Files

### `next.config.js`

Next.js configuration:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // TODO: Remove when NextAuth v5 stable
  },
  images: {
    domains: ["lh3.googleusercontent.com"], // Google profile images
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: true,
  },
};
```

### `tsconfig.json`

TypeScript configuration for Next.js:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "bot/**/*"]
}
```

### `tsconfig.bot.json`

TypeScript configuration for Discord bot:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist/bot",
    "rootDir": "./bot",
    "noEmit": false
  },
  "include": ["bot/**/*"],
  "exclude": ["node_modules", "app/**/*", "components/**/*"]
}
```

### `prisma/schema.prisma`

Database schema configuration:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### `jest.config.mjs`

Jest testing configuration:

```javascript
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
};
```

### `playwright.config.ts`

Playwright E2E testing configuration:

```typescript
const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
};
```

---

## Coding Conventions

### File Naming

- **React Components:** PascalCase (`ProfileCard.tsx`)
- **Utilities:** camelCase (`formatDate.ts`)
- **API Routes:** kebab-case (`send-quote/route.ts`)
- **Test Files:** `*.test.ts` or `*.spec.ts`
- **Type Definitions:** `*.types.ts`

### Component Structure

```typescript
// Component pattern
export default function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Event handlers
  const handleClick = () => { };

  // 3. Effects
  useEffect(() => { }, []);

  // 4. Render
  return <div>...</div>;
}
```

### API Route Structure

```typescript
// API route pattern (Next.js 15 App Router)
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getSession(request);

    // 2. Input validation
    const { searchParams } = new URL(request.url);

    // 3. Business logic
    const data = await fetchData();

    // 4. Success response
    return NextResponse.json({ data });
  } catch (error) {
    // 5. Error handling
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Database Queries

```typescript
// Always use Prisma for type safety
import { prisma } from "@/lib/db/client";

// Use soft deletes (deletedAt)
const projects = await prisma.project.findMany({
  where: { deletedAt: null },
});

// Include relations explicitly
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    quotes: true,
    timeEntries: true,
  },
});

// Use transactions for multiple operations
const result = await prisma.$transaction([
  prisma.quote.update({ where: { id }, data: { status: "CONVERTED" } }),
  prisma.project.create({ data: projectData }),
]);
```

### Error Handling

```typescript
// Use custom error classes
import { AppError, ValidationError, NotFoundError } from "@/lib/errors";

// Throw specific errors
if (!email) {
  throw new ValidationError("Email is required");
}

if (!project) {
  throw new NotFoundError("Project not found");
}

// Operational vs programming errors
throw new AppError(
  "Something went wrong",
  500,
  true, // isOperational
);
```

---

## Project Constants

### Status Values

```typescript
// Project status
enum ProjectStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  COMPLETE = "COMPLETE",
  ARCHIVED = "ARCHIVED",
}

// Quote status
enum QuoteStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DECLINED = "DECLINED",
  CONVERTED = "CONVERTED",
}

// Service health status
enum ServiceStatus {
  OPERATIONAL = "operational",
  DEGRADED = "degraded",
  DOWN = "down",
}

// Alert severity
enum Severity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}
```

### Time Tracking Sources

```typescript
enum TimeLogSource {
  DISCORD = "discord",
  ADMIN = "admin",
  MANUAL = "manual",
}
```

### Discord Command Categories

```typescript
enum CommandCategory {
  ADMIN = "admin",
  PROJECTS = "projects",
  MONITORING = "monitoring",
  GENERAL = "general",
}
```

---

## Database Schema

### Core Tables

**users**

- `id` (String, CUID)
- `email` (String, unique)
- `name` (String)
- `googleId` (String, unique, optional)
- `avatar` (String, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**projects**

- `id` (String, CUID)
- `title` (String)
- `description` (String, optional)
- `clientName` (String)
- `clientEmail` (String)
- `status` (ProjectStatus)
- `budget` (Decimal, optional)
- `deadline` (DateTime, optional)
- `googleDriveFolderId` (String, optional)
- `deletedAt` (DateTime, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**quotes**

- `id` (String, CUID)
- `name` (String)
- `email` (String)
- `phone` (String, optional)
- `company` (String, optional)
- `projectType` (String)
- `budgetRange` (String, optional)
- `timeline` (String, optional)
- `description` (String)
- `requirements` (String, optional)
- `status` (QuoteStatus)
- `projectId` (String, optional)
- `deletedAt` (DateTime, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `reviewedAt` (DateTime, optional)

**time_entries**

- `id` (String, CUID)
- `projectId` (String)
- `description` (String, optional)
- `startedAt` (DateTime)
- `endedAt` (DateTime, optional)
- `durationMinutes` (Int, optional)
- `loggedVia` (String)
- `createdAt` (DateTime)

**monitoring_events**

- `id` (String, CUID)
- `type` (EventType)
- `severity` (Severity)
- `source` (String)
- `message` (String)
- `metadata` (Json, optional)
- `timestamp` (DateTime)
- `createdAt` (DateTime)

---

## Error Codes

### HTTP Status Codes

| Code | Meaning               | Usage                           |
| ---- | --------------------- | ------------------------------- |
| 200  | OK                    | Successful GET, PATCH, DELETE   |
| 201  | Created               | Successful POST                 |
| 400  | Bad Request           | Validation error                |
| 401  | Unauthorized          | Not authenticated               |
| 403  | Forbidden             | Not authorized (admin required) |
| 404  | Not Found             | Resource doesn't exist          |
| 500  | Internal Server Error | Server error                    |

### Application Error Codes

```typescript
const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: "auth_required",
  AUTH_INVALID: "auth_invalid",
  ADMIN_REQUIRED: "admin_required",

  // Validation
  VALIDATION_FAILED: "validation_failed",
  INVALID_EMAIL: "invalid_email",
  REQUIRED_FIELD: "required_field",

  // Resources
  NOT_FOUND: "not_found",
  ALREADY_EXISTS: "already_exists",

  // Database
  DB_ERROR: "database_error",
  DB_CONNECTION: "database_connection",

  // External Services
  DISCORD_ERROR: "discord_error",
  EMAIL_ERROR: "email_error",
  GOOGLE_API_ERROR: "google_api_error",
};
```

---

## CLI Commands

### Database Management

```bash
# Prisma commands
npx prisma generate           # Generate Prisma Client
npx prisma migrate dev        # Create and apply migration
npx prisma migrate deploy     # Apply migrations (production)
npx prisma migrate reset      # Reset database (WARNING: deletes data)
npx prisma studio             # Open Prisma Studio GUI
npx prisma db push            # Push schema without migration
npx prisma db seed            # Run seed script

# Database connection test
npx prisma db execute --stdin < test-query.sql
```

### Discord Bot Commands

```bash
# Deploy slash commands
npm run bot:deploy

# Test bot locally
npm run bot:dev

# Build bot for production
npm run build:bot

# Run bot tests
npm run bot:test
```

### Deployment Commands

```bash
# Vercel CLI
vercel                        # Deploy to preview
vercel --prod                 # Deploy to production
vercel env ls                 # List environment variables
vercel logs                   # View deployment logs

# Git workflow
git checkout -b feature/xyz   # Create feature branch
git add .                     # Stage changes
git commit -m "message"       # Commit changes
git push origin feature/xyz   # Push to remote
```

---

## Project Metadata

- **Name:** sunny-stack-portfolio
- **Version:** 2.0.2
- **Node Version:** 22.x
- **Package Manager:** npm
- **License:** MIT

---

## Related Documentation

- **Getting Started:** [docs/guides/getting-started.md](../guides/getting-started.md)
- **API Reference:** [docs/api/README.md](../api/README.md)
- **Architecture:** [docs/architecture/overview.md](../architecture/overview.md)
- **Trinity Knowledge Base:** [trinity/knowledge-base/](../../trinity/knowledge-base/)

---

**Last Updated:** 2026-01-07
**Maintained by:** Sunny Stack Development Team
