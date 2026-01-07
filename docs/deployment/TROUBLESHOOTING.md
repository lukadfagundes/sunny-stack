# Deployment Troubleshooting Guide

Comprehensive troubleshooting guide for Sunny Stack Portfolio deployment issues across Vercel and Raspberry Pi.

---

## Quick Diagnostics

### Run Health Checks

```bash
# Vercel Frontend
curl https://sunny-stack.com/api/health

# Expected: { "status": "ok", "timestamp": "..." }

# Raspberry Pi Database
ssh pi@raspberrypi.local
docker compose exec postgres pg_isready -U sunnystack

# Expected: accepting connections

# Discord Bot
curl http://localhost:8080/health

# Expected: { "status": "healthy", ... }
```

### Check Logs

```bash
# Vercel Logs
vercel logs --follow

# Pi Container Logs
docker compose logs -f

# Bot Logs
docker compose logs -f discord-bot

# Database Logs
docker compose logs -f postgres
```

---

## Vercel Deployment Issues

### Issue: Build Fails with TypeScript Errors

**Symptoms:**

```
Type error: Cannot find module 'next-auth'
Type error: Property 'user' does not exist on type 'Session'
Build failed
```

**Cause:** TypeScript compilation errors (known issue with NextAuth v5 compatibility)

**Solution:**

```bash
# Current workaround (already in place):
# next.config.js has typescript.ignoreBuildErrors: true

# Verify configuration
cat next.config.js | grep ignoreBuildErrors

# Expected:
typescript: {
  ignoreBuildErrors: true,
},

# If build still fails, check Vercel build logs
vercel logs [deployment-url]

# Force rebuild
vercel --prod --force
```

**Prevention:**

- Wait for NextAuth v5 stable release
- Monitor TypeScript compatibility updates

---

### Issue: Build Fails with Module Not Found

**Symptoms:**

```
Error: Cannot find module '@/lib/db/prisma'
Module not found: Can't resolve 'components/AdminNav'
```

**Cause:** Import path issues, missing dependencies, or Vercel cache

**Solution:**

```bash
# 1. Verify imports use correct paths
# ✅ Good:
import { prisma } from '@/lib/db/prisma';

# ❌ Bad:
import { prisma } from '../../../lib/db/prisma';

# 2. Check tsconfig.json paths
cat tsconfig.json | grep paths

# Expected:
"paths": {
  "@/*": ["./*"]
}

# 3. Clear Vercel cache and rebuild
vercel --prod --force

# 4. Check node_modules installed
npm ci

# 5. Verify file exists
ls -la lib/db/prisma.ts
```

---

### Issue: Environment Variables Not Working

**Symptoms:**

```
Error: DATABASE_URL is not defined
Error: process.env.GOOGLE_CLIENT_ID is undefined
API returns 500 errors
```

**Cause:** Environment variables not set in Vercel or incorrect naming

**Solution:**

```bash
# 1. List current Vercel environment variables
vercel env ls

# 2. Check if variables are set for correct environment
vercel env ls production

# 3. Add missing variables
vercel env add DATABASE_URL production
# Enter value when prompted

# 4. Verify variable naming (case-sensitive)
# ✅ Correct:
DATABASE_URL

# ❌ Incorrect:
database_url
Database_Url

# 5. Check if NEXT_PUBLIC_ prefix needed for client-side
# Client-side: NEXT_PUBLIC_BASE_URL
# Server-side: DATABASE_URL

# 6. Force redeploy to pick up new variables
vercel --prod --force
```

**Debugging:**

```typescript
// Add to API route temporarily
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("First 20 chars:", process.env.DATABASE_URL?.substring(0, 20));
```

---

### Issue: Database Connection Timeout

**Symptoms:**

```
Error: connect ETIMEDOUT
Error: Connection terminated unexpectedly
API routes return 500 errors
```

**Cause:** Vercel cannot reach Raspberry Pi database

**Solution:**

```bash
# 1. Verify DATABASE_URL is correct
vercel env get DATABASE_URL production

# 2. Test connection from external IP
# Replace [PI_PUBLIC_IP] with your public IP
psql -h [PI_PUBLIC_IP] -U sunnystack -d sunnystack

# 3. Check Raspberry Pi is accessible
ping [PI_PUBLIC_IP]

# 4. Verify port forwarding on router
# Port 5432 should forward to Pi's local IP

# 5. Check Pi firewall
ssh pi@raspberrypi.local
sudo ufw status | grep 5432

# Expected:
5432/tcp    ALLOW    Anywhere

# 6. Check database is running
docker compose ps postgres

# 7. Check PostgreSQL is listening on all interfaces
docker compose exec postgres psql -U sunnystack -c "SHOW listen_addresses;"

# Expected: listen_addresses = *

# 8. Update docker-compose.yml if needed
ports:
  - "0.0.0.0:5432:5432"  # Bind to all interfaces
```

**Alternative: Use Cloudflare Tunnel or Tailscale**

```bash
# More secure than port forwarding
# See: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
```

---

### Issue: Vercel Function Timeout (10s limit)

**Symptoms:**

```
Error: FUNCTION_INVOCATION_TIMEOUT
Task timed out after 10.00 seconds
```

**Cause:** API route takes longer than 10 seconds (Hobby tier limit)

**Solution:**

```typescript
// 1. Optimize slow database queries
// ❌ Bad: N+1 query
const projects = await prisma.project.findMany();
for (const project of projects) {
  const quotes = await prisma.quote.findMany({ where: { projectId: project.id } });
}

// ✅ Good: Include relation
const projects = await prisma.project.findMany({
  include: { quotes: true }
});

// 2. Add database indexes
// In schema.prisma:
@@index([createdAt])
@@index([status, createdAt])

// 3. Implement pagination
const projects = await prisma.project.findMany({
  take: 50,
  skip: page * 50,
});

// 4. Move heavy processing to Raspberry Pi
// Instead of generating large PDFs in Vercel,
// trigger job on Pi and return immediately

// 5. Upgrade to Vercel Pro (60s timeout)
// https://vercel.com/pricing
```

---

## Raspberry Pi Issues

### Issue: Cannot SSH to Raspberry Pi

**Symptoms:**

```
ssh: connect to host raspberrypi.local port 22: Connection refused
ssh: connect to host 192.168.1.100 port 22: No route to host
```

**Cause:** SSH not enabled, wrong IP, network issues, or firewall

**Solution:**

```bash
# 1. Find Pi IP address (if .local doesn't work)
# From router admin panel or:
nmap -sn 192.168.1.0/24 | grep -B2 "Raspberry Pi"

# 2. Try IP address instead of hostname
ssh pi@192.168.1.100

# 3. Check SSH is enabled (requires monitor/keyboard)
# Boot Pi, login locally
sudo raspi-config
# Interface Options → SSH → Enable

# 4. Check SSH service status (local access needed)
sudo systemctl status sshd

# 5. Check firewall rules
sudo ufw status | grep 22

# 6. Temporarily disable firewall (TESTING ONLY)
sudo ufw disable
ssh pi@192.168.1.100
sudo ufw enable

# 7. Reset SSH host keys (if prompted about key mismatch)
ssh-keygen -R raspberrypi.local
ssh-keygen -R 192.168.1.100
```

---

### Issue: Docker Container Won't Start

**Symptoms:**

```
docker compose up -d
Error: Container failed to start
```

**Cause:** Port conflict, configuration error, or resource limits

**Solution:**

```bash
# 1. Check container status
docker compose ps

# 2. View container logs
docker compose logs postgres
docker compose logs discord-bot

# 3. Check for port conflicts
netstat -tuln | grep -E "5432|8080"

# If port in use:
sudo lsof -i :5432
# Kill conflicting process or change port

# 4. Check Docker daemon
sudo systemctl status docker

# Restart Docker if needed
sudo systemctl restart docker

# 5. Remove and recreate containers
docker compose down
docker compose up -d

# 6. Check disk space
df -h

# If disk full:
docker system prune -a
docker volume prune

# 7. Check memory
free -h

# If low memory, increase swap (see RASPBERRY-PI-SETUP.md)
```

---

### Issue: PostgreSQL Container Crashes

**Symptoms:**

```
Container exits with code 1
Database connection refused
postgres container in "Restarting" state
```

**Cause:** Corrupted data, memory issues, or configuration error

**Solution:**

```bash
# 1. Check logs for specific error
docker compose logs postgres | tail -50

# Common errors:

# A. Out of Memory (OOM)
# Error: "out of shared memory"
# Solution: Reduce POSTGRES_SHARED_BUFFERS in docker-compose.yml
environment:
  POSTGRES_SHARED_BUFFERS: 128MB  # Was 256MB

# B. Data Corruption
# Error: "could not locate a valid checkpoint record"
# Solution: Restore from backup
docker compose down
docker volume rm sunny-stack_postgres-data
docker compose up -d postgres
# Then restore backup (see PI-DEPLOYMENT.md)

# C. Permission Issues
# Error: "data directory has wrong ownership"
# Solution: Fix permissions
docker compose down
sudo chown -R 999:999 /var/lib/docker/volumes/sunny-stack_postgres-data/_data
docker compose up -d postgres

# 2. Check system resources
htop

# 3. Verify container limits
docker stats sunny-stack-db
```

---

### Issue: Discord Bot Not Connecting

**Symptoms:**

```
Bot shows offline in Discord
Container running but no connection
Logs show "WebSocket closed"
```

**Cause:** Invalid token, network issues, or Discord API rate limit

**Solution:**

```bash
# 1. Check bot logs
docker compose logs discord-bot | tail -100

# 2. Verify bot token is valid
docker compose exec discord-bot env | grep DISCORD_BOT_TOKEN

# Regenerate token if needed (Discord Developer Portal)
# Update .env.production
nano ~/projects/sunny-stack/.env.production
docker compose restart discord-bot

# 3. Check network connectivity
docker compose exec discord-bot ping discord.com

# 4. Check Discord API status
curl https://discordstatus.com/api/v2/status.json

# 5. Check bot intents are enabled
# Discord Developer Portal → Bot → Privileged Gateway Intents
# Enable: Server Members Intent, Message Content Intent

# 6. Verify DISCORD_APPLICATION_ID matches
# Check in Discord Developer Portal

# 7. Check rate limiting
docker compose logs discord-bot | grep -i "rate limit"

# Wait 10 minutes if rate limited, then restart
docker compose restart discord-bot
```

---

### Issue: Slash Commands Not Appearing

**Symptoms:**

```
Commands don't show up in Discord
Typing / shows no commands
Bot is online but unresponsive
```

**Cause:** Commands not deployed to Discord API

**Solution:**

```bash
# 1. Deploy commands to Discord
cd ~/projects/sunny-stack
npm run bot:deploy

# Or manually:
node bot/commands/deploy.js

# 2. Wait 5-10 minutes (Discord API cache)

# 3. Try in different server/channel

# 4. Verify bot has application.commands permission
# Discord Server Settings → Integrations → Bots → Manage
# Check "Use Application Commands" is enabled

# 5. Check bot scope during OAuth
# Bot should have been invited with:
# - applications.commands scope
# - bot scope

# Re-invite bot if needed:
# https://discord.com/oauth2/authorize?client_id=[APP_ID]&scope=bot%20applications.commands&permissions=[PERMISSIONS]

# 6. Verify commands registered
docker compose exec discord-bot node -e "
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
rest.get(Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, process.env.DISCORD_GUILD_ID))
  .then(commands => console.log('Commands:', commands.map(c => c.name)))
  .catch(console.error);
"
```

---

### Issue: Database Migration Fails

**Symptoms:**

```
npx prisma migrate deploy
Error: Migration failed
Database schema out of sync
```

**Cause:** Conflicting migrations, manual schema changes, or corrupted migration state

**Solution:**

```bash
# 1. Check migration status
npx prisma migrate status

# 2. If migration partially applied, mark as rolled back
npx prisma migrate resolve --rolled-back [migration-name]

# 3. If migration succeeded but marked as failed
npx prisma migrate resolve --applied [migration-name]

# 4. Reset migration history (CAUTION: Development only)
npx prisma migrate reset

# 5. Manually apply SQL (if migration fails)
docker compose exec postgres psql -U sunnystack sunnystack

# Copy SQL from prisma/migrations/[migration]/migration.sql
# Paste into psql
# Then mark migration as applied:
npx prisma migrate resolve --applied [migration-name]

# 6. Backup and recreate database (LAST RESORT)
# Backup
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup.sql

# Drop and recreate
docker compose exec postgres psql -U postgres -c "DROP DATABASE sunnystack;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE sunnystack;"
docker compose exec postgres psql -U postgres -c "GRANT ALL ON DATABASE sunnystack TO sunnystack;"

# Restore
cat backup.sql | docker compose exec -T postgres psql -U sunnystack sunnystack

# Apply migrations
npx prisma migrate deploy
```

---

## Discord Bot Issues

### Issue: Commands Return "Unknown Interaction"

**Symptoms:**

```
Executing command shows "This interaction failed"
Bot responds with "Unknown interaction"
```

**Cause:** Command handler timeout (3-second Discord limit) or interaction not acknowledged

**Solution:**

```typescript
// ❌ Bad: Slow operation without deferring
async execute(interaction) {
  const data = await slowAPICall();  // Takes 5 seconds
  await interaction.reply({ content: data });  // Too late!
}

// ✅ Good: Defer immediately
async execute(interaction) {
  await interaction.deferReply();  // Acknowledge within 3 seconds
  const data = await slowAPICall();  // Can take longer now
  await interaction.editReply({ content: data });
}

// ✅ Good: Ephemeral for private responses
await interaction.deferReply({ ephemeral: true });
```

```bash
# Check bot response time in logs
docker compose logs discord-bot | grep "Command executed"

# If > 3 seconds, optimize command logic or defer reply
```

---

### Issue: Bot Memory Leak

**Symptoms:**

```
Bot memory usage increases over time
Container eventually crashes
docker stats shows increasing memory
```

**Cause:** Event listeners not removed, caching without limits, or memory-heavy operations

**Solution:**

```bash
# 1. Monitor memory usage
docker stats sunny-stack-bot

# 2. Check for memory leaks in code
# Review bot/commands/ for:
# - Global variables accumulating data
# - Event listeners not removed
# - Large caches without eviction

# 3. Restart bot daily (temporary fix)
# Add to crontab:
0 4 * * * docker compose restart discord-bot

# 4. Implement graceful restart
docker compose exec discord-bot kill -SIGTERM 1

# 5. Reduce memory limit to catch leaks faster
# docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 512M  # Was 1.5G

# 6. Use heap snapshot for analysis
docker compose exec discord-bot node --heap-prof index.js
```

---

## Database Issues

### Issue: Slow Query Performance

**Symptoms:**

```
API responses take > 1 second
Database CPU usage high
Queries in logs show > 100ms
```

**Cause:** Missing indexes, N+1 queries, or large table scans

**Solution:**

```bash
# 1. Enable query logging
docker compose exec postgres psql -U sunnystack sunnystack

ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();

# 2. Check slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# 3. Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM projects WHERE status = 'ACTIVE';

# Look for "Seq Scan" (bad) instead of "Index Scan" (good)

# 4. Add missing indexes
# In schema.prisma:
@@index([status])
@@index([createdAt])
@@index([status, createdAt])

# Deploy migration:
npx prisma migrate dev --name add_performance_indexes

# 5. Optimize Prisma queries
// ❌ N+1 query
const projects = await prisma.project.findMany();
for (const project of projects) {
  const quotes = await prisma.quote.findMany({
    where: { projectId: project.id }
  });
}

// ✅ Include relation
const projects = await prisma.project.findMany({
  include: { quotes: true }
});

# 6. VACUUM database
docker compose exec postgres psql -U sunnystack sunnystack -c "VACUUM ANALYZE;"
```

---

### Issue: Database Disk Space Full

**Symptoms:**

```
Error: could not extend file
Error: No space left on device
Database writes fail
```

**Cause:** Too much data, old logs, or orphaned files

**Solution:**

```bash
# 1. Check disk usage
df -h

# 2. Find large files
du -h / | sort -h | tail -20

# 3. Clean Docker resources
docker system prune -a
docker volume prune

# 4. Remove old backups
find ~/backups/postgres -mtime +30 -delete

# 5. Clear system logs
sudo journalctl --vacuum-time=7d

# 6. Remove old Docker logs
sudo find /var/lib/docker/containers/ -name "*.log" -type f -delete

# 7. Clean PostgreSQL data
docker compose exec postgres psql -U sunnystack sunnystack -c "VACUUM FULL;"

# 8. Archive old data
# Move old records to archive table
docker compose exec postgres psql -U sunnystack sunnystack
INSERT INTO projects_archive SELECT * FROM projects WHERE deleted_at < NOW() - INTERVAL '1 year';
DELETE FROM projects WHERE deleted_at < NOW() - INTERVAL '1 year';
VACUUM;
```

---

### Issue: Database Connection Pool Exhausted

**Symptoms:**

```
Error: remaining connection slots are reserved
Error: connection pool timeout
API intermittently fails
```

**Cause:** Too many concurrent connections or connections not closed

**Solution:**

```bash
# 1. Check current connections
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT count(*) as connections
  FROM pg_stat_activity
  WHERE datname = 'sunnystack';
"

# 2. Increase connection limit (if needed)
# docker-compose.yml:
environment:
  POSTGRES_MAX_CONNECTIONS: 100  # Was 50

docker compose restart postgres

# 3. Add connection pooling to DATABASE_URL
# .env.production:
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30

# 4. Close idle connections
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'sunnystack'
    AND state = 'idle'
    AND state_change < NOW() - INTERVAL '10 minutes';
"

# 5. Fix connection leaks in code
// ❌ Bad: Connection not closed
const result = await prisma.project.findMany();
// Process crashes before disconnect

// ✅ Good: Use singleton pattern
import { prisma } from '@/lib/db/prisma';
// Connections managed automatically
```

---

## Performance Issues

### Issue: High CPU Usage on Raspberry Pi

**Symptoms:**

```
htop shows >80% CPU
System sluggish
Containers slow to respond
```

**Cause:** Resource-intensive operations or too many concurrent processes

**Solution:**

```bash
# 1. Identify CPU-heavy process
htop
# Press F4 to filter, F5 to tree view

# 2. Check container resource usage
docker stats

# 3. Limit container CPU
# docker-compose.yml:
deploy:
  resources:
    limits:
      cpus: '1.0'  # Max 1 core

# 4. Reduce bot command concurrency
# bot/core/config.ts:
maxConcurrentCommands: 5  # Was 10

# 5. Optimize database queries (see above)

# 6. Disable unused services
docker compose stop [unused-service]
```

---

### Issue: High Memory Usage

**Symptoms:**

```
free -h shows low available memory
Swap usage high (>50%)
OOM killer terminates processes
```

**Cause:** Memory leak, large datasets, or insufficient swap

**Solution:**

```bash
# 1. Check memory usage
free -h
htop

# 2. Check which container uses most memory
docker stats

# 3. Increase swap size (see RASPBERRY-PI-SETUP.md)
# Recommended: 2GB for 4GB Pi

# 4. Reduce container memory limits
# docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 256M  # For postgres

# 5. Clear caches
sudo sync
sudo echo 3 > /proc/sys/vm/drop_caches

# 6. Restart containers
docker compose restart
```

---

## Network Issues

### Issue: Intermittent Connection Drops

**Symptoms:**

```
Bot disconnects randomly
Database connection timeouts
Network unreachable errors
```

**Cause:** Wi-Fi instability, router issues, or ISP problems

**Solution:**

```bash
# 1. Use Ethernet instead of Wi-Fi
# Much more stable for 24/7 operations

# 2. Check network stats
ping -c 100 8.8.8.8
# Look for packet loss

# 3. Check Pi network interface
ifconfig
ethtool eth0

# 4. Restart networking
sudo systemctl restart networking

# 5. Update router firmware
# Check manufacturer website

# 6. Implement reconnection logic
# Already in bot code - verify in bot/gateway/client.ts
```

---

## Emergency Procedures

### Complete System Failure

```bash
# 1. Access Pi with monitor/keyboard (if SSH fails)

# 2. Check system status
sudo systemctl status

# 3. Check Docker
sudo systemctl status docker
docker ps -a

# 4. Check logs
sudo journalctl -xe
docker compose logs

# 5. Restore from backup (see PI-DEPLOYMENT.md)

# 6. Contact support if unrecoverable
```

### Data Recovery

```bash
# If database corrupted but volume intact:

# 1. Stop all services
docker compose down

# 2. Create volume backup
docker run --rm -v sunny-stack_postgres-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data-backup.tar.gz /data

# 3. Try database recovery tools
docker run --rm -v sunny-stack_postgres-data:/data postgres:15 \
  pg_resetwal -f /data

# 4. If unsuccessful, restore from SQL backup
# See PI-DEPLOYMENT.md
```

---

## Getting Help

### Before Asking for Help

1. ✅ Check logs (Vercel, Pi, bot, database)
2. ✅ Search this troubleshooting guide
3. ✅ Check [GitHub Issues](https://github.com/[username]/sunny-stack/issues)
4. ✅ Verify environment variables
5. ✅ Try restarting services

### Information to Provide

```bash
# System info
uname -a
docker --version
node --version

# Container status
docker compose ps

# Recent logs (last 100 lines)
docker compose logs --tail=100

# Error messages (exact text)

# Steps to reproduce
```

---

## Related Documentation

- **[Deployment Overview](DEPLOYMENT-OVERVIEW.md)** - Deployment architecture
- **[Pi Setup](RASPBERRY-PI-SETUP.md)** - Pi configuration
- **[Pi Deployment](PI-DEPLOYMENT.md)** - Deployment procedures
- **[GitHub Actions](GITHUB-ACTIONS-SETUP.md)** - CI/CD troubleshooting

---

**Last Updated:** 2026-01-07
**Troubleshooting Version:** 1.0.0
**Maintained by:** Sunny Stack Development Team
