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

_(Content to be added)_

### Container Won't Start

_(Content to be added)_

### Container Crashes

_(Content to be added)_

### Image Pull Errors

_(Content to be added)_

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
