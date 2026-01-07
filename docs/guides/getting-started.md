# Getting Started with Sunny Stack Portfolio

Welcome to the Sunny Stack Portfolio documentation! This guide will help you set up and run the project locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 22.x** (as specified in package.json engines)
- **npm 10.0+** (comes with Node.js)
- **Git** (for cloning the repository)
- **PostgreSQL 15+** (for local database, or use Raspberry Pi connection)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/lukadfagundes/sunny-stack.git
cd sunny-stack
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

- Next.js 15.5.9
- React 19.0
- TypeScript 5.5
- Prisma 6.18.0
- Discord.js 14.14.1
- And all other dependencies listed in package.json

### 3. Environment Configuration

Create your local environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/sunnystack

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google OAuth (for admin authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=your_email@gmail.com

# Discord Bot (optional for local dev)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_application_id
DISCORD_PUBLIC_KEY=your_public_key
BOT_API_URL=http://localhost:3000
```

See `.env.local.example` for a complete list of environment variables.

### 4. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb sunnystack

# Run Prisma migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

#### Option B: Connect to Raspberry Pi Database

If you're part of the development team with access to the Pi:

```bash
# Use the Pi DATABASE_URL in .env.local
DATABASE_URL=postgresql://user:password@pi.local:5432/sunnystack
```

### 5. Validate Environment

Verify your environment configuration:

```bash
npm run validate:env
```

This runs the validation script at `scripts/validate-env.ts` to ensure all required variables are set.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Sunny Stack Portfolio homepage!

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev                  # Start dev server (http://localhost:3000)
npm run build               # Build for production
npm start                   # Start production server

# Type Checking
npm run type-check          # Run TypeScript compiler check (no emit)

# Linting
npm run lint                # Run ESLint
npm run lint:fix            # Auto-fix ESLint issues

# Testing
npm test                    # Run unit tests (Jest)
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npm run test:e2e            # Run E2E tests (Playwright)
npm run test:e2e:ui         # Run E2E tests with UI
npm run test:e2e:debug      # Debug E2E tests

# Discord Bot (separate build)
npm run build:bot           # Build Discord bot (tsconfig.bot.json)
npm run build:bot:watch     # Watch mode for bot development
npm run bot:dev             # Run bot in development mode
npm run bot:deploy          # Deploy Discord slash commands

# Bundle Analysis
npm run analyze             # Analyze bundle size
npm run analyze:server      # Analyze server bundle
npm run analyze:browser     # Analyze browser bundle

# Environment Validation
npm run validate:env        # Validate all environment variables
npm run validate:env:pi     # Validate Pi-specific variables
npm run validate:env:vercel # Validate Vercel-specific variables
```

### Project Structure

```
sunny-stack/
├── app/                 # Next.js 15 App Router
│   ├── api/            # API routes (serverless functions)
│   ├── admin/          # Admin dashboard pages
│   ├── about/          # Public pages
│   ├── contact/
│   ├── portfolio/
│   ├── quote/
│   ├── resume/
│   └── layout.tsx      # Root layout
├── bot/                 # Discord bot application
│   ├── commands/       # Slash commands
│   ├── core/           # Bot client and utilities
│   └── events/         # Discord event handlers
├── components/          # React components
│   ├── admin/          # Admin components
│   ├── forms/          # Form components
│   └── ui/             # UI components
├── lib/                 # Core utilities
│   ├── admin/          # Admin utilities
│   ├── auth/           # Google OAuth
│   ├── db/             # Database (Prisma)
│   ├── errors/         # Error handling
│   └── monitoring/     # Service monitoring
├── hooks/              # Custom React hooks
├── prisma/             # Prisma schema and migrations
├── __tests__/          # Unit tests (Jest)
├── e2e/                # E2E tests (Playwright)
├── docs/               # Documentation (you are here!)
└── trinity/            # Trinity Method implementation
```

## Common Tasks

### Adding a New Page

1. Create a new directory in `app/`:

   ```bash
   mkdir app/my-page
   ```

2. Add a `page.tsx` file:

   ```tsx
   export default function MyPage() {
     return <div>My Page</div>;
   }
   ```

3. The route is automatically available at `/my-page`

### Adding an API Endpoint

1. Create a new route file in `app/api/`:

   ```bash
   mkdir app/api/my-endpoint
   ```

2. Add a `route.ts` file:

   ```typescript
   import { NextRequest, NextResponse } from "next/server";

   export async function GET(request: NextRequest) {
     return NextResponse.json({ message: "Hello World" });
   }
   ```

3. The endpoint is available at `/api/my-endpoint`

### Working with the Database

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Open Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma Client (after schema changes)
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Running the Discord Bot Locally

```bash
# Build the bot
npm run build:bot

# Run in development mode
npm run bot:dev

# Deploy slash commands to Discord
npm run bot:deploy
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### Database Connection Errors

1. Verify PostgreSQL is running:

   ```bash
   # Check PostgreSQL status
   pg_isready
   ```

2. Check your `DATABASE_URL` in `.env.local`

3. Ensure database exists:
   ```bash
   psql -l | grep sunnystack
   ```

### TypeScript Errors

The project currently has `typescript.ignoreBuildErrors: true` in `next.config.js` due to NextAuth v5 compatibility issues. This is a known technical debt item.

To check TypeScript errors:

```bash
npm run type-check
```

### Discord Bot Not Connecting

1. Verify `DISCORD_BOT_TOKEN` is set in `.env.local`
2. Check bot has correct permissions in Discord Developer Portal
3. Ensure bot is added to your test Discord server

## Next Steps

- **API Documentation**: See [docs/api/README.md](../api/README.md)
- **Architecture Overview**: See [docs/architecture/overview.md](../architecture/overview.md)
- **Deployment Guide**: See [docs/deployment/DEPLOYMENT-OVERVIEW.md](../deployment/DEPLOYMENT-OVERVIEW.md)
- **Testing Guide**: See [trinity/knowledge-base/TESTING-PRINCIPLES.md](../../trinity/knowledge-base/TESTING-PRINCIPLES.md)

## Need Help?

- Check the [Trinity Knowledge Base](../../trinity/knowledge-base/)
- Review [Known Issues](../../trinity/knowledge-base/ISSUES.md)
- See [Architecture Documentation](../../trinity/knowledge-base/ARCHITECTURE.md)

---

**Updated:** 2026-01-07
**Maintained by:** Sunny Stack Development Team
