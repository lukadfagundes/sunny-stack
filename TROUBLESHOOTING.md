# Troubleshooting Guide

**Project:** Sunny Stack
**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

- [Introduction](#introduction)
- [Quick Diagnostics](#quick-diagnostics)
- [Docker Issues](#docker-issues)
  - [Build Failures](#build-failures)
  - [Container Won't Start](#container-wont-start)
  - [Container Crashes](#container-crashes)
  - [Image Pull Errors](#image-pull-errors)
- [Health Check Failures](#health-check-failures)
  - [Health Endpoint Not Responding](#health-endpoint-not-responding)
  - [Health Check Timeout](#health-check-timeout)
  - [Health Server Port Issues](#health-server-port-issues)
- [Environment Variable Errors](#environment-variable-errors)
  - [Missing Required Variables](#missing-required-variables)
  - [Invalid Variable Format](#invalid-variable-format)
  - [Variable Not Loading](#variable-not-loading)
  - [Mode Mismatch](#mode-mismatch)
- [Network Connectivity Issues](#network-connectivity-issues)
  - [Bot Can't Reach Discord](#bot-cant-reach-discord)
  - [Bot Can't Reach API](#bot-cant-reach-api)
  - [Database Connection Failures](#database-connection-failures)
  - [Firewall Blocking](#firewall-blocking)
- [Resource Constraints](#resource-constraints)
  - [Out of Memory](#out-of-memory)
  - [Disk Space Full](#disk-space-full)
  - [CPU Throttling](#cpu-throttling)
  - [Network Bandwidth](#network-bandwidth)
- [Discord Bot Issues](#discord-bot-issues)
  - [Commands Not Responding](#commands-not-responding)
  - [Gateway Connection Issues](#gateway-connection-issues)
  - [Permission Errors](#permission-errors)
  - [Rate Limiting](#rate-limiting)
- [Database Issues](#database-issues)
  - [Connection Pool Exhausted](#connection-pool-exhausted)
  - [Query Timeouts](#query-timeouts)
  - [Migration Failures](#migration-failures)
- [Build and Compilation Errors](#build-and-compilation-errors)
  - [TypeScript Errors](#typescript-errors)
  - [Dependency Conflicts](#dependency-conflicts)
  - [Missing Dependencies](#missing-dependencies)
- [Deployment Failures](#deployment-failures)
  - [Pre-Flight Check Failures](#pre-flight-check-failures)
  - [Docker Build Failures](#docker-build-failures)
  - [Deployment Timeout](#deployment-timeout)
- [Log Analysis](#log-analysis)
  - [Accessing Logs](#accessing-logs)
  - [Common Log Patterns](#common-log-patterns)
  - [Log Levels](#log-levels)
- [Getting Help](#getting-help)

---

## Introduction

This guide provides solutions to common issues encountered when deploying and running Sunny Stack. Each section includes:

- **Problem description**: What's happening
- **Symptoms**: How to identify the issue
- **Diagnosis**: Steps to confirm the problem
- **Solution**: How to fix it
- **Prevention**: How to avoid it in the future

---

## Quick Diagnostics

**Run these commands first when encountering issues:**

```bash
# 1. Check system health
npm run validate:prerequisites

# 2. Validate environment variables
npm run validate:env:pi

# 3. Run tests
npm test

# 4. Check Docker status
docker ps -a
docker logs sunny-stack-bot

# 5. Check bot build
npm run build:bot
```

---

## Docker Issues

### Build Failures

**Symptoms:**

- Docker build command fails
- Error messages during `docker build`
- Build hangs or times out

**Common Causes:**

1. **Insufficient disk space**

   ```bash
   # Check disk space
   df -h
   ```

2. **Network issues during dependency install**

   ```bash
   # Test network connectivity
   ping registry.npmjs.org
   ```

3. **Invalid Dockerfile syntax**
   ```bash
   # Validate Dockerfile
   docker build --no-cache -t test .
   ```

**Solutions:**

**1. Docker build fails for ARM64**

**Problem:** Building for ARM64 on AMD64 machine fails

**Diagnosis:**

```bash
# Check buildx status
docker buildx ls

# If no builder:
# buildx not configured
```

**Solution:**

```bash
# Create and use buildx builder
docker buildx create --name mybuilder --use

# Verify
docker buildx inspect --bootstrap

# Build for ARM64
docker buildx build --platform linux/arm64 -t sunny-stack-bot:arm64 .
```

**2. TypeScript compilation errors during build**

**Problem:** "tsc: command not found" or TypeScript errors

**Diagnosis:**

```bash
# Check Dockerfile builder stage
# Should install typescript globally
```

**Solution:**

Ensure Dockerfile has:

```dockerfile
FROM node:18-alpine AS builder
RUN npm install -g typescript
COPY bot/ ./bot/
RUN npm run build:bot
```

**3. npm ci fails - dependency resolution errors**

**Problem:** "npm ERR! code ERESOLVE" or "Unable to resolve dependency tree"

**Diagnosis:**

```bash
# Check bot/package.json for conflicts
cat bot/package.json
```

**Solution:**

```bash
# Clean build (no cache)
docker build --no-cache -t sunny-stack-bot .

# Or fix package.json dependency versions
# Use exact versions instead of ranges
```

**4. Image exceeds 500MB target**

**Problem:** Final image too large

**Diagnosis:**

```bash
# Check image size
docker images sunny-stack-bot
# Should be ~380MB

# Check layer sizes
docker history sunny-stack-bot:latest
```

**Solution:**

```bash
# Ensure multi-stage build is used
# Verify .dockerignore excludes unnecessary files
# Check that dev dependencies aren't in final image

# Validate:
docker run --rm sunny-stack-bot:latest du -sh /app
```

**5. Disk space errors during build**

**Problem:** "no space left on device"

**Diagnosis:**

```bash
# Check disk space
df -h

# Check Docker disk usage
docker system df
```

**Solution:**

```bash
# Clean up Docker
docker system prune -af

# Remove old images
docker image prune -af --filter "until=168h"

# Clean build cache
docker builder prune -af
```

### Container Won't Start

**Symptoms:**

- Container immediately exits after starting
- `docker ps` shows no running container
- `docker ps -a` shows container with "Exited (1)" status

**Diagnosis:**

```bash
# Check exit code
docker ps -a | grep sunny-stack-bot
# Look for: Exited (1) or Exited (137)

# Check logs
docker logs sunny-stack-bot
```

**Common Exit Codes:**

| Exit Code | Meaning | Common Cause                                  |
| --------- | ------- | --------------------------------------------- |
| 0         | Success | Container completed normally (shouldn't exit) |
| 1         | Error   | Application error, check logs                 |
| 137       | SIGKILL | OOMKilled (out of memory)                     |
| 139       | SIGSEGV | Segmentation fault                            |
| 143       | SIGTERM | Gracefully stopped                            |

**Solutions:**

**Exit Code 1: Application Error**

```bash
# Check logs for error
docker logs sunny-stack-bot 2>&1 | grep -i error

# Common errors:
# - Missing environment variables
# - Invalid Discord token
# - Database connection failed
# - Port already in use
```

**Exit Code 137: Out of Memory**

```bash
# Check memory limit
docker inspect sunny-stack-bot | jq '.[0].HostConfig.Memory'

# Increase memory limit in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2.0G  # Was 1.5G
```

**Missing environment variables:**

```bash
# Verify .env file exists
ls -la ~/.env.production

# Check variables are loaded
docker exec sunny-stack-bot env | grep DISCORD
```

**Port conflict:**

```bash
# Check if port 8080 is in use
sudo netstat -tuln | grep 8080

# Kill conflicting process
sudo lsof -ti:8080 | xargs kill -9
```

### Container Crashes

**Symptoms:**

- Container starts but crashes after running
- Restart count increases
- Container in "Restarting" state

**Diagnosis:**

```bash
# Check restart count
docker inspect sunny-stack-bot | jq '.[0].RestartCount'

# Monitor logs in real-time
docker logs sunny-stack-bot -f

# Check for crash pattern
docker logs sunny-stack-bot 2>&1 | tail -50
```

**Common Causes:**

**1. Uncaught Exception**

```bash
# Look for "Uncaught Exception" in logs
docker logs sunny-stack-bot 2>&1 | grep "Uncaught"

# Solution: Fix code to handle errors
# Ensure all async operations use try-catch
```

**2. Memory Leak**

```bash
# Monitor memory over time
watch -n 5 'docker stats sunny-stack-bot --no-stream'

# If memory constantly increases:
# - Review code for memory leaks
# - Check for unclosed connections
# - Monitor heap snapshots
```

**3. Database Connection Issues**

```bash
# Check database connectivity
docker exec sunny-stack-bot node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(e => console.error(e));"

# If fails: Verify DATABASE_URL is correct
```

**4. Discord Gateway Errors**

```bash
# Look for Discord errors
docker logs sunny-stack-bot 2>&1 | grep -i "discord"

# Common: Invalid token, rate limiting, missing intents
```

**Solution:**

```bash
# Set restart policy to "on-failure" temporarily (for debugging)
docker update --restart=on-failure:5 sunny-stack-bot

# Fix underlying issue
# Then restore restart policy
docker update --restart=unless-stopped sunny-stack-bot
```

### Image Pull Errors

**Symptoms:**

- `docker pull` fails
- Error: "manifest unknown" or "unauthorized"
- Cannot deploy to Pi

**Diagnosis:**

```bash
# Test pull manually
docker pull ghcr.io/USERNAME/sunny-stack/discord-bot:latest

# Check authentication
docker login ghcr.io
```

**Solutions:**

**1. Authentication failure**

```bash
# Create GitHub Personal Access Token (PAT)
# Settings > Developer settings > Personal access tokens

# Login to ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or on Pi:
docker login ghcr.io -u USERNAME
# Enter PAT when prompted
```

**2. Image doesn't exist**

```bash
# Check if image was built
# Go to: GitHub > Packages

# Verify image name matches
docker pull ghcr.io/lukadfagundes/sunny-stack/discord-bot:latest
#         ^--- Ensure correct username/repo
```

**3. Wrong architecture**

```bash
# Verify image is ARM64
docker manifest inspect ghcr.io/USERNAME/sunny-stack/discord-bot:latest | jq '.manifests[].platform'

# Should show: "architecture": "arm64"
```

**4. Network connectivity**

```bash
# Test connection to ghcr.io
ping ghcr.io

# Test HTTPS
curl -I https://ghcr.io

# If fails: Check firewall, DNS, network
```

---

## Health Check Failures

### Health Endpoint Not Responding

**Symptoms:**

- Docker health check fails
- `http://localhost:8080/health` returns error
- Container marked as "unhealthy"

**Diagnosis:**

```bash
# Check if health server is running
docker exec sunny-stack-bot curl http://localhost:8080/health

# Check health server logs
docker logs sunny-stack-bot | grep "health"
```

**Common Causes:**

1. **PORT environment variable not set**
   - Solution: Ensure PORT=8080 in .env

2. **Health server not starting**
   - Solution: Check bot/health-server.ts logs

3. **Firewall blocking port 8080**
   - Solution: Allow port 8080 in firewall

**Solutions:**

_(Content to be added)_

### Health Check Timeout

_(Content to be added)_

### Health Server Port Issues

_(Content to be added)_

---

## Environment Variable Errors

### Missing Required Variables

**Symptoms:**

- Validation script reports errors
- Bot fails to start
- "Environment variable not set" errors

**Diagnosis:**

```bash
# Validate environment variables
npm run validate:env:pi

# Check if .env file exists
ls -la .env .env.local

# Check variable is loaded
echo $DISCORD_BOT_TOKEN
```

**Solution:**

1. Copy .env.example to .env.local:

   ```bash
   cp .env.example .env.local
   ```

2. Set all required variables (see [DEPLOYMENT.md](./DEPLOYMENT.md#environment-variables))

3. Validate again:
   ```bash
   npm run validate:env:pi
   ```

### Invalid Variable Format

**Symptoms:**

- Validation script reports "invalid format"
- Variables present but incorrectly formatted

**Common Format Errors:**

| Variable                 | Expected Format        | Example                          |
| ------------------------ | ---------------------- | -------------------------------- |
| `DISCORD_APPLICATION_ID` | 17-19 digits           | `1234567890123456789`            |
| `DATABASE_URL`           | `postgresql://` prefix | `postgresql://user:pass@host/db` |
| `BOT_API_URL`            | `https://` prefix      | `https://sunny-stack.com/api`    |
| `ADMIN_ROUTE_HASH`       | 64-char hex            | `6bde736bb52aa194f1d...`         |

**Solution:**

Check .env.example for correct format and examples.

### Variable Not Loading

_(Content to be added)_

### Mode Mismatch

_(Content to be added)_

---

## Network Connectivity Issues

### Bot Can't Reach Discord

_(Content to be added)_

### Bot Can't Reach API

_(Content to be added)_

### Database Connection Failures

_(Content to be added)_

### Firewall Blocking

_(Content to be added)_

---

## Resource Constraints

### Out of Memory

_(Content to be added)_

### Disk Space Full

**Symptoms:**

- "No space left on device" errors
- Docker build fails
- Container crashes

**Diagnosis:**

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Check large files
du -h --max-depth=1 / | sort -hr | head -20
```

**Solution:**

```bash
# Clean Docker system
docker system prune -af

# Remove unused images
docker image prune -af

# Remove unused volumes
docker volume prune -f

# Clear npm cache
npm cache clean --force
```

**Prevention:**

- Monitor disk usage regularly
- Schedule automatic cleanup
- Use Docker image cleanup automation

### CPU Throttling

_(Content to be added)_

### Network Bandwidth

_(Content to be added)_

---

## Discord Bot Issues

### Commands Not Responding

_(Content to be added)_

### Gateway Connection Issues

_(Content to be added)_

### Permission Errors

_(Content to be added)_

### Rate Limiting

_(Content to be added)_

---

## Database Issues

### Connection Pool Exhausted

_(Content to be added)_

### Query Timeouts

_(Content to be added)_

### Migration Failures

_(Content to be added)_

---

## Build and Compilation Errors

### TypeScript Errors

**Symptoms:**

- `npm run build:bot` fails
- TypeScript compilation errors
- Type checking errors

**Diagnosis:**

```bash
# Check TypeScript errors
npm run build:bot:check

# View full error output
npm run build:bot 2>&1 | less
```

**Common Errors:**

1. **Missing type definitions**

   ```bash
   # Install missing types
   npm install --save-dev @types/package-name
   ```

2. **Type mismatch errors**
   - Solution: Fix type annotations in code

3. **Cannot find module**
   - Solution: Check import paths

**Solutions:**

_(Content to be added)_

### Dependency Conflicts

_(Content to be added)_

### Missing Dependencies

_(Content to be added)_

---

## Deployment Failures

### Pre-Flight Check Failures

**Symptoms:**

- `npm run validate:prerequisites` fails
- Deployment blocked

**Solution:**

Address each failed check:

- Docker not running → Start Docker
- Node version too old → Update Node.js
- Tests failing → Fix failing tests
- Environment invalid → Fix .env variables

### Docker Build Failures

_(Content to be added)_

### Deployment Timeout

_(Content to be added)_

---

## Log Analysis

### Accessing Logs

```bash
# Docker container logs
docker logs sunny-stack-bot

# Follow logs in real-time
docker logs -f sunny-stack-bot

# Last 100 lines
docker logs --tail 100 sunny-stack-bot

# Logs since timestamp
docker logs --since 2024-01-01T00:00:00 sunny-stack-bot
```

### Common Log Patterns

**Error Patterns to Look For:**

| Pattern        | Meaning                            |
| -------------- | ---------------------------------- |
| `ECONNREFUSED` | Connection refused (service down)  |
| `ETIMEDOUT`    | Connection timeout (network issue) |
| `ENOTFOUND`    | DNS resolution failed              |
| `EACCES`       | Permission denied                  |
| `EADDRINUSE`   | Port already in use                |

### Log Levels

_(Content to be added)_

---

## Getting Help

If you can't resolve the issue:

1. **Check documentation**
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
   - [RASPBERRY-PI-SETUP.md](./RASPBERRY-PI-SETUP.md)
   - [ROLLBACK.md](./ROLLBACK.md)

2. **Collect diagnostics**

   ```bash
   # Run full diagnostic
   npm run validate:prerequisites > diagnostics.txt
   npm run validate:env:pi >> diagnostics.txt
   docker ps -a >> diagnostics.txt
   docker logs sunny-stack-bot >> diagnostics.txt
   ```

3. **Create GitHub issue**
   - Include diagnostics.txt
   - Describe what you were trying to do
   - Include error messages
   - List steps to reproduce

---

**Documentation Status:** 🚧 In Progress
**Phase:** 5.0 Pre-Implementation
**Next Steps:** Complete sections marked with _(Content to be added)_
