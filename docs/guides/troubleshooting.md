# Troubleshooting Guide

This guide covers common development and runtime issues in sunny-stack, with step-by-step solutions and debugging procedures.

> **Note:** For deployment-specific troubleshooting (Vercel, Raspberry Pi, Docker), see [docs/deployment/TROUBLESHOOTING.md](../deployment/TROUBLESHOOTING.md).

## Table of Contents

- [Common Development Issues](#common-development-issues)
- [Common Runtime Issues](#common-runtime-issues)
- [Debugging Procedures](#debugging-procedures)
- [Emergency Procedures](#emergency-procedures)

---

## Common Development Issues

### 1. Port Already in Use

**Symptom:**

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Another process is using port 3000 (or 5432 for PostgreSQL).

**Solution:**

**Find and kill process using port:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**Or use a different port:**

```bash
# .env.local
PORT=3001

# Run dev server
npm run dev -- -p 3001
```

---

### 2. Database Connection Failures

**Symptom:**

```bash
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
```

**Cause:** PostgreSQL not running or incorrect connection string.

**Solutions:**

**Check database is running:**

```bash
# If using Docker (Raspberry Pi setup)
docker ps | grep postgres

# If not running, start it
cd ~/sunny-stack-deployment
docker-compose up -d postgres
```

**Verify connection string:**

```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/sunny_stack?schema=public"

# Test connection
npx prisma db pull
```

**Check PostgreSQL logs:**

```bash
# Docker logs
docker logs sunny-stack-postgres

# Raspberry Pi logs
sudo journalctl -u postgresql -f
```

**Common fixes:**

- Ensure PostgreSQL is running
- Verify username/password in DATABASE_URL
- Check port (default 5432)
- Ensure database exists (`createdb sunny_stack`)
- Check firewall rules (allow port 5432)

---

### 3. TypeScript Compilation Errors

**Symptom:**

```bash
Type error: Property 'X' does not exist on type 'Y'
```

**Cause:** Type mismatch or missing type definitions.

**Solutions:**

**Regenerate Prisma types:**

```bash
npx prisma generate
```

**Clear Next.js cache:**

```bash
rm -rf .next
npm run dev
```

**Check tsconfig.json:**

```json
{
  "compilerOptions": {
    "strict": false, // Note: Currently disabled for NextAuth v5 compatibility
    "skipLibCheck": true
  }
}
```

**Known issue:** TypeScript build errors are currently suppressed (`ignoreBuildErrors: true` in `next.config.js`) due to NextAuth v5 + Next.js 15 compatibility. This is tracked in [trinity/knowledge-base/ISSUES.md#SS-C001](../../trinity/knowledge-base/ISSUES.md).

---

### 4. ESLint Errors

**Symptom:**

```bash
Error: 'useState' is defined but never used
```

**Solutions:**

**Auto-fix linting issues:**

```bash
npm run lint:fix
```

**Disable specific rules (if necessary):**

```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unused = 'value';

// Or in .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

**Skip linting for build (not recommended):**

```json
// next.config.js
{
  "eslint": {
    "ignoreDuringBuilds": true
  }
}
```

---

### 5. Module Not Found Errors

**Symptom:**

```bash
Module not found: Can't resolve '@/components/Button'
```

**Cause:** Incorrect import path or missing dependency.

**Solutions:**

**Check path alias configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Verify file exists:**

```bash
ls components/Button.tsx
# or
ls components/Button/index.tsx
```

**Install missing dependency:**

```bash
npm install <package-name>
```

**Clear node_modules and reinstall:**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Restart dev server:**

```bash
# Sometimes needed after adding new files
npm run dev
```

---

### 6. Environment Variable Issues

**Symptom:**

```bash
Error: DATABASE_URL environment variable is not defined
```

**Cause:** Missing or incorrectly named environment variables.

**Solutions:**

**Check .env.local exists:**

```bash
ls -la .env.local
```

**Verify required variables:**

```bash
# .env.local
DATABASE_URL="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

**Validate environment:**

```bash
npm run validate:env
```

**Check variable naming:**

- Client-side variables must start with `NEXT_PUBLIC_`
- Server-side variables should NOT start with `NEXT_PUBLIC_`

**Restart dev server after changes:**

```bash
# Environment variables are loaded on server start
npm run dev
```

---

### 7. npm/Package Errors

**Symptom:**

```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

**Use legacy peer deps:**

```bash
npm install --legacy-peer-deps
```

**Clear npm cache:**

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Update npm:**

```bash
npm install -g npm@latest
```

**Check Node.js version:**

```bash
node -v  # Should be 18.x or higher

# Use nvm to switch versions
nvm use 18
```

---

### 8. Hot Reload Not Working

**Symptom:** Changes not reflecting in browser after saving files.

**Solutions:**

**Hard refresh browser:**

```bash
# Chrome/Firefox
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (macOS)
```

**Check file watcher limits (Linux):**

```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Restart dev server:**

```bash
npm run dev
```

**Clear .next directory:**

```bash
rm -rf .next
npm run dev
```

---

### 9. Prisma Migration Errors

**Symptom:**

```bash
Error: Migration `20240101000000_init` failed
```

**Solutions:**

**Reset database (CAUTION: Deletes all data):**

```bash
npx prisma migrate reset
```

**Create new migration:**

```bash
npx prisma migrate dev --name fix_migration
```

**Force migration (skip validation):**

```bash
npx prisma migrate deploy --skip-seed
```

**Manual migration rollback:**

```bash
# Drop last migration from _prisma_migrations table
psql -d sunny_stack -c "DELETE FROM _prisma_migrations WHERE migration_name = '20240101000000_init';"

# Manually revert schema changes
# Then create new migration
npx prisma migrate dev
```

---

### 10. Build Errors

**Symptom:**

```bash
Error: Build failed
```

**Solutions:**

**Check for TypeScript errors:**

```bash
npm run type-check
```

**Clear build cache:**

```bash
rm -rf .next
npm run build
```

**Check for circular dependencies:**

```bash
# Install madge
npm install -g madge

# Check for circular dependencies
madge --circular lib/
```

**Verify all imports are correct:**

```bash
# Search for broken imports
grep -r "from '@/" app/ lib/ components/
```

---

## Common Runtime Issues

### 1. Authentication Errors (OAuth Failures)

**Symptom:** Google OAuth redirect fails or "Invalid credentials" error.

**Debugging:**

**Check OAuth credentials:**

```bash
# .env.local
GOOGLE_CLIENT_ID="..."  # Should be from Google Cloud Console
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"  # Must match authorized redirect URI
```

**Verify Google Cloud Console settings:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Check authorized redirect URIs include:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://sunny-stack.com/api/auth/callback/google` (prod)

**Check NEXTAUTH_SECRET:**

```bash
# Generate new secret if needed
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="<generated-secret>"
```

**Check admin email allowlist:**

```bash
# .env.local
ADMIN_EMAIL="your-email@gmail.com"  # Must match your Google account email
```

**Clear cookies and try again:**

- Browser Dev Tools > Application > Cookies > Delete all for localhost:3000

**Check NextAuth logs:**

```bash
# Enable debug logging
# .env.local
NEXTAUTH_DEBUG=true

# Restart server and check console for detailed logs
npm run dev
```

---

### 2. Database Query Timeouts

**Symptom:**

```bash
PrismaClientKnownRequestError: Timed out fetching from database
```

**Causes:**

- Slow query
- Too many connections
- Database under heavy load

**Solutions:**

**Check slow queries:**

```sql
-- Enable slow query logging in PostgreSQL
ALTER DATABASE sunny_stack SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

**Optimize query:**

```ts
// Add indexes to frequently queried fields
// prisma/schema.prisma
model Project {
  @@index([status])
  @@index([clientEmail])
}

// Run migration
npx prisma migrate dev
```

**Increase connection pool:**

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=30"
```

**Check active connections:**

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'sunny_stack';
```

---

### 3. Discord API Rate Limits

**Symptom:**

```bash
DiscordAPIError: You are being rate limited
```

**Cause:** Too many API requests in short time period.

**Solutions:**

**Implement rate limiting in bot:**

```ts
// bot/utils/rate-limiter.ts (already implemented in codebase)
import { checkRateLimit } from "../utils/rate-limiter";

const result = checkRateLimit(userId);
if (!result.allowed) {
  throw new RateLimitError("Rate limited", result.retryAfter);
}
```

**Add delays between requests:**

```ts
// Wait between bulk operations
for (const item of items) {
  await processItem(item);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
}
```

**Use bulk operations when possible:**

```ts
// ❌ BAD: Multiple API calls
for (const role of roles) {
  await member.roles.add(role);
}

// ✅ GOOD: Single bulk operation
await member.roles.add(roles);
```

**Check Discord API status:**

- Visit [Discord Status](https://discordstatus.com/)

---

### 4. Memory Leaks

**Symptom:** Application memory usage grows over time, eventually crashes.

**Debugging:**

**Monitor memory usage:**

```bash
# Node.js built-in
node --expose-gc --inspect app.js

# Chrome DevTools
# Navigate to chrome://inspect
# Click "inspect" on your Node.js process
# Go to Memory tab > Take heap snapshot
```

**Check for event listener leaks:**

```ts
// ❌ BAD: Event listener not removed
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);

// ✅ GOOD: Cleanup event listener
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

**Check for interval/timeout leaks:**

```ts
// ❌ BAD: Interval not cleared
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
}, []);

// ✅ GOOD: Clear interval on unmount
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**Check for Prisma connection leaks:**

```ts
// Use singleton pattern (already implemented)
import { prisma } from "@/lib/db/prisma";

// Always disconnect in serverless functions
await prisma.$disconnect();
```

---

### 5. Performance Degradation

**Symptom:** Application becomes slow over time.

**Debugging:**

**Check database query performance:**

```sql
-- PostgreSQL slow query log
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

**Profile API routes:**

```ts
// Add timing to API routes
export async function GET(request: NextRequest) {
  const start = Date.now();

  const data = await fetchData();

  console.log(`API call took ${Date.now() - start}ms`);

  return NextResponse.json(data);
}
```

**Check bundle size:**

```bash
# Analyze bundle
ANALYZE=true npm run build

# Opens webpack-bundle-analyzer
```

**Use React DevTools Profiler:**

1. Install React DevTools browser extension
2. Open DevTools > Profiler tab
3. Record interaction
4. Identify slow components

**Check for N+1 queries:**

```ts
// ❌ BAD: N+1 query
const projects = await prisma.project.findMany();
for (const project of projects) {
  const timeEntries = await prisma.timeEntry.findMany({
    where: { projectId: project.id },
  });
}

// ✅ GOOD: Single query with include
const projects = await prisma.project.findMany({
  include: { timeEntries: true },
});
```

---

## Debugging Procedures

### 1. Debugging Next.js Application

**Using VS Code Debugger:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Using console.log:**

```ts
// Server Component (logs to terminal)
export default async function Page() {
  console.log('Server: Fetching data...');
  const data = await fetchData();
  console.log('Server: Data fetched', data);
  return <div>{data}</div>;
}

// Client Component (logs to browser console)
'use client';
export function Component() {
  console.log('Client: Rendering component');
  return <div>Hello</div>;
}
```

**Using debugger statement:**

```ts
export default async function Page() {
  const data = await fetchData();
  debugger; // Execution pauses here
  return <div>{data}</div>;
}
```

---

### 2. Debugging Discord Bot

**Enable debug logging:**

```ts
// bot/core/logger.ts
export const botLogger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  // ...
});
```

**Test commands locally:**

```bash
# Run bot in development mode
npm run bot:dev

# Use Discord to trigger commands
# Or use bot test script
npm run bot:test
```

**Check Discord Gateway events:**

```ts
// bot/index.ts
client.on("debug", (info) => {
  console.log("Debug:", info);
});

client.on("error", (error) => {
  console.error("Client error:", error);
});

client.on("warn", (warning) => {
  console.warn("Client warning:", warning);
});
```

**Test slash commands:**

```bash
# Deploy commands to Discord
npm run bot:deploy

# Check registered commands
# Discord Developer Portal > Applications > Your App > Bot > Slash Commands
```

---

### 3. Debugging Database Queries

**Enable Prisma query logging:**

```ts
// lib/db/prisma.ts
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});
```

**Use Prisma Studio:**

```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

**Raw SQL debugging:**

```ts
// Execute raw query
const result = await prisma.$queryRaw`
  SELECT * FROM "Project" WHERE status = 'ACTIVE'
`;
console.log("Raw query result:", result);
```

**Check query execution plan:**

```sql
EXPLAIN ANALYZE
SELECT * FROM "Project"
WHERE status = 'ACTIVE'
ORDER BY "createdAt" DESC;
```

---

### 4. Debugging API Requests

**Using Browser DevTools:**

1. Open DevTools (F12)
2. Network tab
3. Filter by XHR/Fetch
4. Click request > Preview/Response to see data

**Using curl:**

```bash
# GET request
curl http://localhost:3000/api/projects

# POST request with JSON
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test project"}'

# With authentication (copy cookie from browser)
curl http://localhost:3000/api/admin/projects \
  -H "Cookie: next-auth.session-token=..."
```

**Using Postman/Insomnia:**

1. Create new request
2. Set method (GET, POST, etc.)
3. Set URL (http://localhost:3000/api/...)
4. Add headers (Content-Type: application/json)
5. Add body (for POST/PATCH)
6. Send request

**Using Next.js API route logging:**

```ts
export async function POST(request: NextRequest) {
  console.log("Headers:", Object.fromEntries(request.headers));
  const body = await request.json();
  console.log("Body:", body);

  // Process request...

  const response = NextResponse.json({ success: true });
  console.log("Response:", response);
  return response;
}
```

---

### 5. Debugging Production Issues

**Check Vercel logs:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs sunny-stack --follow
```

**Check Rollbar errors:**

1. Login to [Rollbar](https://rollbar.com/)
2. Select sunny-stack project
3. View recent errors
4. Check stack traces and occurrence patterns

**Check Raspberry Pi logs:**

```bash
# SSH into Pi
ssh pi@raspberrypi.local

# Check bot logs
pm2 logs bot

# Check PostgreSQL logs
docker logs sunny-stack-postgres

# Check system logs
sudo journalctl -f
```

**Enable production debug logging:**

```bash
# Vercel environment variables
# Add NEXT_PUBLIC_DEBUG=true
# Redeploy
```

**Create production replica locally:**

```bash
# Use production database URL (read-only recommended)
DATABASE_URL="postgresql://..." npm run dev

# Or pull production database to local
pg_dump -h pi@raspberrypi.local sunny_stack > backup.sql
psql sunny_stack_local < backup.sql
```

---

## Emergency Procedures

### 1. Rolling Back Deployments

**Vercel Rollback:**

```bash
# Via Vercel Dashboard
# 1. Go to https://vercel.com/sunny-stack
# 2. Click "Deployments"
# 3. Find previous working deployment
# 4. Click "..." > "Promote to Production"

# Via CLI
vercel rollback
```

**Raspberry Pi Rollback:**

```bash
# SSH into Pi
ssh pi@raspberrypi.local

# Pull previous version from git
cd ~/sunny-stack-deployment
git log --oneline  # Find commit hash
git checkout <previous-commit-hash>

# Rebuild and restart
npm run build:bot
pm2 restart bot
```

---

### 2. Database Recovery

**Restore from backup:**

```bash
# SSH into Pi
ssh pi@raspberrypi.local

# Stop database
cd ~/sunny-stack-deployment
docker-compose stop postgres

# Restore backup
docker-compose exec postgres psql -U postgres -d sunny_stack < /backups/backup-2024-01-01.sql

# Restart database
docker-compose up -d postgres
```

**Point-in-time recovery:**

```bash
# If WAL archiving is enabled
pg_restore -d sunny_stack --target-time='2024-01-07 10:00:00' /backups/base.backup
```

---

### 3. Service Outage Response

**Check service status:**

```bash
# Vercel status
curl https://www.vercel-status.com/api/v2/status.json

# Discord status
curl https://discordstatus.com/api/v2/status.json

# GitHub status
curl https://www.githubstatus.com/api/v2/status.json
```

**Fallback procedures:**

**Database outage:**

1. Enable read-only mode (return cached data)
2. Queue write operations for later
3. Display maintenance message to users

**Discord bot offline:**

1. Check process: `pm2 status bot`
2. Restart: `pm2 restart bot`
3. Check logs: `pm2 logs bot`
4. Verify Discord token is valid

**Vercel outage:**

1. Check [Vercel Status](https://www.vercel-status.com/)
2. No action needed - automatically resolves
3. Consider alternative hosting for critical features

---

### 4. Data Corruption Recovery

**Identify corrupted data:**

```sql
-- Check for NULL values in required fields
SELECT * FROM "Project" WHERE title IS NULL OR "clientEmail" IS NULL;

-- Check for invalid statuses
SELECT * FROM "Project" WHERE status NOT IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
```

**Fix corrupted data:**

```sql
-- Set default values for NULL fields
UPDATE "Project" SET title = 'Untitled' WHERE title IS NULL;

-- Fix invalid statuses
UPDATE "Project" SET status = 'PLANNING' WHERE status NOT IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
```

**Restore from backup (last resort):**

```bash
# Restore only specific table
pg_restore -t Project /backups/backup.sql | psql -d sunny_stack
```

---

### 5. Security Incident Response

**Suspected data breach:**

1. **Immediate actions:**
   - Rotate all API keys and secrets
   - Reset database passwords
   - Revoke OAuth tokens
   - Review access logs

2. **Investigate:**

   ```sql
   -- Check for suspicious queries
   SELECT * FROM "AuditLog" WHERE "createdAt" > NOW() - INTERVAL '24 hours';

   -- Check for unauthorized access
   SELECT * FROM "User" WHERE "createdAt" > NOW() - INTERVAL '24 hours';
   ```

3. **Remediate:**
   - Patch vulnerability
   - Update dependencies
   - Deploy fix immediately
   - Monitor for further activity

4. **Notify:**
   - Inform affected users
   - Document incident
   - Report to authorities if required

**Rotate secrets:**

```bash
# Generate new secrets
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # DATABASE_PASSWORD

# Update in environment
# Vercel: vercel env add NEXTAUTH_SECRET
# Pi: Update .env file

# Redeploy
vercel --prod
pm2 restart bot
```

---

## Related Documentation

- [Deployment Troubleshooting](../deployment/TROUBLESHOOTING.md) - Vercel, Pi, Docker issues
- [Monitoring Guide](./monitoring.md) - Proactive monitoring to prevent issues
- [Testing Principles](../../trinity/knowledge-base/TESTING-PRINCIPLES.md) - Prevent bugs with testing
- [Known Issues](../../trinity/knowledge-base/ISSUES.md) - Current known issues and workarounds

---

## Getting Help

If you encounter an issue not covered here:

1. **Check existing documentation:**
   - [docs/README.md](../README.md) - Documentation overview
   - [trinity/knowledge-base/ISSUES.md](../../trinity/knowledge-base/ISSUES.md) - Known issues

2. **Search GitHub Issues:**
   - Check if issue already reported
   - Create new issue with details

3. **Check logs:**
   - Terminal output (development)
   - Vercel logs (production)
   - Rollbar errors (runtime)
   - PM2 logs (Discord bot)

4. **Create minimal reproduction:**
   - Isolate the issue
   - Provide steps to reproduce
   - Include error messages and stack traces

**Last Updated:** 2026-01-07
