# Raspberry Pi Deployment Procedures

Guide for deploying and managing PostgreSQL database and Discord bot on Raspberry Pi.

**Prerequisites:** Raspberry Pi must be set up following [RASPBERRY-PI-SETUP.md](RASPBERRY-PI-SETUP.md).

---

## Quick Reference

### Common Commands

```bash
# Deploy latest changes
cd ~/projects/sunny-stack && git pull && docker compose up -d

# View logs
docker compose logs -f

# Restart bot
docker compose restart discord-bot

# Restart database
docker compose restart postgres

# Check status
docker compose ps

# Apply migrations
npx prisma migrate deploy
```

---

## PostgreSQL Deployment

### Deploy Database Updates

**Scenario:** Schema changes, performance tuning, configuration updates

```bash
# 1. SSH to Raspberry Pi
ssh pi@raspberrypi.local

# 2. Navigate to project
cd ~/projects/sunny-stack

# 3. Backup database (CRITICAL before schema changes)
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-$(date +%Y%m%d-%H%M%S).sql

# 4. Pull latest code
git pull origin main

# 5. Apply migrations
npx prisma migrate deploy

# 6. Restart database (if configuration changed)
docker compose restart postgres

# 7. Verify database
docker compose exec postgres psql -U sunnystack sunnystack -c "\dt"
```

**Deployment Time:** 1-3 minutes

### Database Migration Workflow

#### Create Migration (Development)

```bash
# On local machine
npx prisma migrate dev --name add_feature_xyz

# Test migration
npm run dev

# Commit migration files
git add prisma/migrations
git commit -m "feat: add feature XYZ schema"
git push origin main
```

#### Apply Migration (Production - Pi)

```bash
# SSH to Pi
ssh pi@raspberrypi.local
cd ~/projects/sunny-stack

# Backup first
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-pre-migration-$(date +%Y%m%d).sql

# Pull migration files
git pull origin main

# Apply migration
npx prisma migrate deploy

# Verify schema
docker compose exec postgres psql -U sunnystack sunnystack

# In psql:
\dt                    # List tables
\d projects            # Describe projects table
SELECT version FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
\q                     # Quit

# Generate Prisma client
npx prisma generate
```

**⚠️ Warning:** Always backup before migrations. Failed migrations can corrupt data.

#### Rollback Migration

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back [migration-name]

# Manually reverse changes
docker compose exec postgres psql -U sunnystack sunnystack

# Example: Remove column added in migration
ALTER TABLE projects DROP COLUMN new_column;

# Exit
\q

# Restore from backup (if necessary)
cat backup-pre-migration-20260107.sql | docker compose exec -T postgres psql -U sunnystack sunnystack
```

### Database Configuration Updates

**Update connection limits, performance settings, etc.**

```bash
# Edit docker-compose.yml
nano ~/projects/sunny-stack/docker-compose.yml

# Example: Increase max connections
environment:
  POSTGRES_MAX_CONNECTIONS: 100  # Was 50

# Restart database
docker compose restart postgres

# Verify change
docker compose exec postgres psql -U sunnystack sunnystack -c "SHOW max_connections;"
```

### Database Backup & Restore

#### Manual Backup

```bash
# Full database dump
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
docker compose exec postgres pg_dump -U sunnystack sunnystack | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Verify backup
ls -lh backup-*.sql*
```

#### Restore from Backup

```bash
# Stop bot (to prevent writes during restore)
docker compose stop discord-bot

# Restore database
cat backup-20260107-143000.sql | docker compose exec -T postgres psql -U sunnystack sunnystack

# Or for compressed backup
gunzip -c backup-20260107-143000.sql.gz | docker compose exec -T postgres psql -U sunnystack sunnystack

# Restart bot
docker compose start discord-bot

# Verify data
docker compose exec postgres psql -U sunnystack sunnystack -c "SELECT COUNT(*) FROM projects;"
```

#### Automated Backup Schedule

**Verify cron job is running:**

```bash
# Check crontab
crontab -l

# Should show:
0 2 * * * /home/pi/backups/backup-postgres.sh

# Check recent backups
ls -lth ~/backups/postgres/ | head -10

# View backup log
tail -20 ~/backups/postgres/backup.log
```

### Database Monitoring

```bash
# Check database size
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT pg_size_pretty(pg_database_size('sunnystack')) AS database_size;
"

# Check table sizes
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check active connections
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
"

# Check slow queries (if logging enabled)
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

---

## Discord Bot Deployment

### Deploy Bot Updates

**Scenario:** New commands, bug fixes, logic changes

```bash
# 1. SSH to Raspberry Pi
ssh pi@raspberrypi.local

# 2. Navigate to project
cd ~/projects/sunny-stack

# 3. Pull latest code
git pull origin main

# 4. Stop bot container
docker compose stop discord-bot

# 5. Rebuild bot image
docker build -t sunny-stack-bot:latest -f Dockerfile .

# 6. Start bot container
docker compose up -d discord-bot

# 7. Monitor bot startup
docker compose logs -f discord-bot
```

**Deployment Time:** 5-10 minutes (includes Docker build)

**Expected log output:**

```
discord-bot  | [INFO] Bot starting...
discord-bot  | [INFO] Registered 21 slash commands
discord-bot  | [INFO] Connected to Discord Gateway
discord-bot  | [INFO] Bot ready as BotName#1234
discord-bot  | [INFO] Health server listening on port 8080
```

### Deploy New Slash Commands

**When adding new commands:**

```bash
# 1. Deploy code (as above)
cd ~/projects/sunny-stack
git pull origin main
docker compose stop discord-bot
docker build -t sunny-stack-bot:latest -f Dockerfile .
docker compose up -d discord-bot

# 2. Wait for bot to come online
docker compose logs -f discord-bot
# Look for "Bot ready" message

# 3. Deploy commands to Discord
docker compose exec discord-bot npm run bot:deploy

# OR if deploy script is not in Docker:
# Run from local machine:
npm run bot:deploy
```

**Expected output:**

```
Started refreshing application (/) commands.
Successfully reloaded application (/) commands.
Deployed 21 commands: /ping, /project-create, /project-list, ...
```

**Verify in Discord:**

- Type `/` in any channel
- Commands should appear in autocomplete
- Test new command

### Bot Configuration Updates

**Update environment variables:**

```bash
# Edit environment file
nano ~/projects/sunny-stack/.env.production

# Example: Add new channel ID
DISCORD_CHANNEL_NEW_FEATURE=1234567890123456

# Save and restart bot
docker compose restart discord-bot

# Verify change
docker compose logs discord-bot | grep "Config loaded"
```

### Bot Health Monitoring

```bash
# Check bot container status
docker compose ps discord-bot

# Expected:
# NAME              STATUS    PORTS
# sunny-stack-bot   Up        0.0.0.0:8080->8080/tcp

# Check bot health endpoint
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "uptime": 3600,
  "connections": {
    "discord": "connected",
    "database": "connected"
  }
}

# View recent logs
docker compose logs --tail=50 discord-bot

# Follow logs in real-time
docker compose logs -f discord-bot
```

### Bot Troubleshooting

#### Bot Won't Start

```bash
# Check logs for errors
docker compose logs discord-bot

# Common issues:
# 1. Invalid token
# 2. Missing permissions
# 3. Network connectivity
# 4. Database connection failed

# Verify environment variables
docker compose exec discord-bot env | grep DISCORD

# Test Discord API connectivity
docker compose exec discord-bot ping discord.com
```

#### Bot Crashes or Disconnects

```bash
# Check crash logs
docker compose logs --tail=100 discord-bot | grep -i error

# Check system resources
htop

# If memory issue, check Docker limits
docker stats sunny-stack-bot

# Restart bot
docker compose restart discord-bot
```

#### Commands Not Responding

```bash
# Verify bot is online in Discord
# Check command deployment
npm run bot:test  # If available

# Check interaction logs
docker compose logs discord-bot | grep -i interaction

# Redeploy commands
npm run bot:deploy

# Restart bot
docker compose restart discord-bot
```

---

## Container Management

### Start All Services

```bash
# Start all containers
docker compose up -d

# Check status
docker compose ps

# Expected:
# NAME              STATUS    PORTS
# sunny-stack-db    Up        0.0.0.0:5432->5432/tcp
# sunny-stack-bot   Up        0.0.0.0:8080->8080/tcp
```

### Stop All Services

```bash
# Stop all containers (graceful shutdown)
docker compose stop

# Stop specific container
docker compose stop discord-bot
docker compose stop postgres

# Force stop (if containers hang)
docker compose kill
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific container
docker compose restart discord-bot
docker compose restart postgres

# Restart with rebuild
docker compose up -d --build
```

### View Logs

```bash
# All containers (real-time)
docker compose logs -f

# Specific container
docker compose logs -f discord-bot
docker compose logs -f postgres

# Last N lines
docker compose logs --tail=100 discord-bot

# Since specific time
docker compose logs --since 30m postgres

# Filter for errors
docker compose logs discord-bot | grep -i error
```

### Container Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats sunny-stack-bot sunny-stack-db

# Example output:
CONTAINER           CPU %   MEM USAGE / LIMIT   MEM %
sunny-stack-bot     2.5%    150MB / 1.5GB       10%
sunny-stack-db      5.0%    200MB / 512MB       39%
```

### Clean Up Unused Resources

```bash
# Remove stopped containers
docker compose down

# Remove old images
docker image prune -a

# Remove unused volumes (CAUTION: May delete data)
docker volume prune

# Remove all unused resources
docker system prune -a --volumes
```

---

## Environment Variables Management

### Update Environment Variables

```bash
# Edit production environment
nano ~/projects/sunny-stack/.env.production

# Make changes...

# Restart affected services
docker compose restart discord-bot

# Verify changes
docker compose exec discord-bot env | grep NEW_VARIABLE
```

### Secrets Rotation

**Example: Rotate Discord bot token**

```bash
# 1. Generate new token in Discord Developer Portal
# 2. Update .env.production
nano ~/projects/sunny-stack/.env.production
# Change DISCORD_BOT_TOKEN=new_token

# 3. Restart bot
docker compose restart discord-bot

# 4. Verify bot reconnects
docker compose logs -f discord-bot
```

**Example: Rotate database password**

```bash
# 1. Update password in database
docker compose exec postgres psql -U sunnystack sunnystack -c "
  ALTER USER sunnystack WITH PASSWORD 'new_password';
"

# 2. Update .env.production
nano ~/projects/sunny-stack/.env.production
# Update DATABASE_URL with new password

# 3. Update Vercel environment variable
vercel env add DATABASE_URL production
# Enter new DATABASE_URL

# 4. Restart services
docker compose restart
vercel --prod --force

# 5. Verify connections
docker compose logs postgres | grep -i connection
```

---

## Health Checks & Monitoring

### Container Health Checks

```bash
# Check container health status
docker compose ps

# Inspect health check details
docker inspect sunny-stack-bot --format='{{json .State.Health}}' | jq

# View health check logs
docker inspect sunny-stack-bot --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

### Database Health

```bash
# Check if database is accepting connections
docker compose exec postgres pg_isready -U sunnystack

# Expected: accepting connections

# Check database activity
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT
    datname,
    numbackends,
    xact_commit,
    xact_rollback
  FROM pg_stat_database
  WHERE datname = 'sunnystack';
"

# Check for locks
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT * FROM pg_locks WHERE NOT granted;
"
```

### Bot Health

```bash
# Check health endpoint
curl http://localhost:8080/health

# Check Discord connection status
docker compose logs discord-bot | grep -i "connected"

# Check command execution
docker compose logs discord-bot | grep -i "command executed"

# Check error rate
docker compose logs discord-bot | grep -i error | wc -l
```

### System Health

```bash
# CPU and memory usage
htop

# Disk space
df -h

# Disk I/O
iostat -x 1

# Network connections
netstat -tuln | grep -E "5432|8080"
```

---

## Performance Optimization

### Database Performance Tuning

```bash
# Analyze query performance
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT
    query,
    calls,
    total_time / calls AS avg_time,
    rows / calls AS avg_rows
  FROM pg_stat_statements
  WHERE calls > 10
  ORDER BY total_time DESC
  LIMIT 10;
"

# Vacuum database (reclaim space)
docker compose exec postgres psql -U sunnystack sunnystack -c "VACUUM ANALYZE;"

# Reindex (rebuild indexes)
docker compose exec postgres psql -U sunnystack sunnystack -c "REINDEX DATABASE sunnystack;"
```

### Container Resource Limits

**Edit docker-compose.yml:**

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M

  discord-bot:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1.5G
        reservations:
          cpus: "0.5"
          memory: 512M
```

**Apply changes:**

```bash
docker compose up -d
```

### Log Rotation

**Verify log rotation is configured:**

```bash
# Check Docker daemon config
cat /etc/docker/daemon.json

# Should contain:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Check container log sizes
docker ps -a --format "table {{.Names}}\t{{.Size}}"
```

---

## Disaster Recovery

### Complete System Restore

**Scenario:** Raspberry Pi failure, SD card corruption

```bash
# 1. Setup new Raspberry Pi (follow RASPBERRY-PI-SETUP.md)

# 2. Clone repository
git clone https://github.com/[your-username]/sunny-stack.git
cd sunny-stack

# 3. Copy production environment
# (from backup or secrets manager)
nano .env.production

# 4. Start database
docker compose up -d postgres

# 5. Restore latest backup
gunzip -c ~/backups/postgres/latest.sql.gz | \
  docker compose exec -T postgres psql -U sunnystack sunnystack

# 6. Start bot
docker compose up -d discord-bot

# 7. Verify all services
docker compose ps
curl http://localhost:8080/health
```

**Recovery Time:** 30-60 minutes

### Database Corruption Recovery

```bash
# 1. Stop all services
docker compose stop

# 2. Backup current state (even if corrupted)
docker compose exec postgres pg_dump -U sunnystack sunnystack > corrupt-backup.sql

# 3. Remove corrupted volume
docker volume rm sunny-stack_postgres-data

# 4. Recreate database
docker compose up -d postgres

# 5. Restore from latest good backup
cat ~/backups/postgres/backup-20260106-020000.sql.gz | \
  gunzip | docker compose exec -T postgres psql -U sunnystack sunnystack

# 6. Restart services
docker compose up -d

# 7. Verify data integrity
docker compose exec postgres psql -U sunnystack sunnystack -c "SELECT COUNT(*) FROM projects;"
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Backup database
- [ ] Test changes locally
- [ ] Review code changes (git diff)
- [ ] Verify environment variables
- [ ] Check disk space (> 5GB free)
- [ ] Check system resources (htop)

### Deployment

- [ ] SSH to Raspberry Pi
- [ ] Pull latest code
- [ ] Apply migrations (if any)
- [ ] Rebuild bot image (if bot changes)
- [ ] Restart containers
- [ ] Deploy slash commands (if new commands)

### Post-Deployment

- [ ] Verify containers running
- [ ] Check logs for errors
- [ ] Test database connection
- [ ] Test Discord bot commands
- [ ] Monitor for 15 minutes
- [ ] Update deployment log

---

## Troubleshooting Common Issues

### "Connection refused" when accessing database

```bash
# Check if database is running
docker compose ps postgres

# Check if port is open
netstat -tuln | grep 5432

# Check firewall
sudo ufw status

# Check database logs
docker compose logs postgres
```

### "Out of memory" errors

```bash
# Check memory usage
free -h

# Check swap usage
swapon --show

# Check container limits
docker stats

# Increase swap if needed (see RASPBERRY-PI-SETUP.md)
```

### "No space left on device"

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a

# Remove old backups
find ~/backups/postgres -mtime +30 -delete

# Remove old logs
sudo journalctl --vacuum-time=7d
```

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Related Documentation

- **[Deployment Overview](DEPLOYMENT-OVERVIEW.md)** - Deployment architecture
- **[Raspberry Pi Setup](RASPBERRY-PI-SETUP.md)** - Initial Pi setup
- **[GitHub Actions Setup](GITHUB-ACTIONS-SETUP.md)** - CI/CD automation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Detailed troubleshooting

---

**Last Updated:** 2026-01-07
**Docker Version:** 24.0+
**Docker Compose Version:** 2.0+
**Maintained by:** Sunny Stack Development Team
