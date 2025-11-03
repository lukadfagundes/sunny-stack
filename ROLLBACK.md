# Rollback Procedures

**Project:** Sunny Stack
**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

- [Introduction](#introduction)
- [When to Rollback](#when-to-rollback)
  - [Rollback Triggers](#rollback-triggers)
  - [Decision Criteria](#decision-criteria)
  - [Risk Assessment](#risk-assessment)
- [Pre-Rollback Checklist](#pre-rollback-checklist)
- [Manual Rollback Procedure](#manual-rollback-procedure)
  - [Step 1: Assess Current State](#step-1-assess-current-state)
  - [Step 2: Stop Current Deployment](#step-2-stop-current-deployment)
  - [Step 3: Rollback Docker Image](#step-3-rollback-docker-image)
  - [Step 4: Verify Rollback](#step-4-verify-rollback)
  - [Step 5: Monitor System](#step-5-monitor-system)
- [Automatic Rollback Mechanism](#automatic-rollback-mechanism)
  - [Health Check Based Rollback](#health-check-based-rollback)
  - [Timeout Based Rollback](#timeout-based-rollback)
  - [Error Rate Based Rollback](#error-rate-based-rollback)
- [Component-Specific Rollback](#component-specific-rollback)
  - [Next.js Rollback (Vercel)](#nextjs-rollback-vercel)
  - [Discord Bot Rollback (Pi)](#discord-bot-rollback-pi)
  - [Database Rollback](#database-rollback)
- [Verification Steps](#verification-steps)
  - [Functional Verification](#functional-verification)
  - [Performance Verification](#performance-verification)
  - [Data Integrity Verification](#data-integrity-verification)
- [Post-Rollback Actions](#post-rollback-actions)
  - [Incident Report](#incident-report)
  - [Root Cause Analysis](#root-cause-analysis)
  - [Prevention Measures](#prevention-measures)
- [Emergency Contacts](#emergency-contacts)
- [References](#references)

---

## Introduction

This document provides procedures for rolling back failed deployments of Sunny Stack. Rollback procedures are designed to:

- Quickly restore service when deployments fail
- Minimize downtime and user impact
- Preserve data integrity
- Enable root cause analysis

**Key Principles:**

1. **Safety First**: Rollback preserves data and system stability
2. **Speed**: Rollback should be faster than fixing forward
3. **Verification**: Always verify rollback success
4. **Documentation**: Document what happened and why

---

## When to Rollback

### Rollback Triggers

**Immediate Rollback** (do not wait):

- Service is completely down
- Data corruption detected
- Security vulnerability introduced
- Health checks failing for >5 minutes
- Error rate >50%
- Critical functionality broken

**Evaluate Rollback** (assess first):

- Partial functionality broken
- Performance degradation <20%
- Non-critical bug introduced
- Error rate 10-50%
- Health checks intermittently failing

**Do Not Rollback** (fix forward):

- Minor UI bugs
- Non-breaking changes
- Performance optimization needed
- Error rate <10%
- Known issue with workaround

### Decision Criteria

Use this flowchart to decide:

```
                   ┌─────────────────────┐
                   │  Deployment Issue   │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   Is service down?  │
                   └──────────┬──────────┘
                         Yes /│\ No
                            / │ \
                           /  │  \
                          /   │   \
                   ┌─────▼────▼────▼─────┐
                   │   ROLLBACK NOW      │
                   │  (don't wait)       │
                   └─────────────────────┘
                              │
                              │ No
                              ▼
                   ┌─────────────────────┐
                   │  Data at risk?      │
                   └──────────┬──────────┘
                         Yes /│\ No
                            / │ \
                           /  │  \
                          /   │   \
                   ┌─────▼────▼────▼─────┐
                   │   ROLLBACK NOW      │
                   │  (protect data)     │
                   └─────────────────────┘
                              │
                              │ No
                              ▼
                   ┌─────────────────────┐
                   │  Error rate >50%?   │
                   └──────────┬──────────┘
                         Yes /│\ No
                            / │ \
                           /  │  \
                          /   │   \
                   ┌─────▼────┘    └─────▼─────┐
                   │   ROLLBACK       FIX FORWARD│
                   │  (unstable)      (stable)   │
                   └───────────────────────────┘
```

### Risk Assessment

Before rolling back, assess:

| Factor                  | Low Risk  | Medium Risk | High Risk        |
| ----------------------- | --------- | ----------- | ---------------- |
| **Downtime**            | <1 minute | 1-5 minutes | >5 minutes       |
| **Users Affected**      | <10%      | 10-50%      | >50%             |
| **Data Risk**           | None      | Read-only   | Write operations |
| **Rollback Complexity** | Simple    | Moderate    | Complex          |

**Action:**

- **All Low**: Consider fix forward
- **Any High**: Rollback immediately
- **Mixed**: Rollback if downtime >2 minutes

---

## Pre-Rollback Checklist

Before starting rollback:

- [ ] Identify deployment version to rollback to
- [ ] Verify rollback target is stable
- [ ] Backup current state (if time permits)
- [ ] Notify team members
- [ ] Document current issue
- [ ] Check database compatibility
- [ ] Verify Docker image availability
- [ ] Check health check status
- [ ] Review recent logs

---

## Manual Rollback Procedure

### Step 1: Assess Current State

_(Content to be added)_

### Step 2: Stop Current Deployment

_(Content to be added)_

### Step 3: Rollback Docker Image

**On Raspberry Pi:**

```bash
# 1. Stop current container
docker stop sunny-stack-bot

# 2. Remove current container
docker rm sunny-stack-bot

# 3. List available images
docker images | grep sunny-stack

# 4. Rollback to previous image
docker run -d \
  --name sunny-stack-bot \
  --restart unless-stopped \
  --env-file .env \
  -p 8080:8080 \
  sunny-stack-bot:previous-tag

# 5. Verify container started
docker ps | grep sunny-stack-bot

# 6. Check logs
docker logs -f sunny-stack-bot
```

### Step 4: Verify Rollback

_(Content to be added)_

### Step 5: Monitor System

_(Content to be added)_

---

## Automatic Rollback Mechanism

### Health Check Based Rollback

_(Content to be added)_

### Timeout Based Rollback

_(Content to be added)_

### Error Rate Based Rollback

_(Content to be added)_

---

## Component-Specific Rollback

### Next.js Rollback (Vercel)

**Vercel has built-in rollback:**

1. Go to Vercel Dashboard
2. Select project "sunny-stack"
3. Go to "Deployments" tab
4. Find previous working deployment
5. Click three dots (•••) > "Promote to Production"
6. Confirm rollback
7. Verify at https://sunny-stack.com

**Typical rollback time: 30-60 seconds**

### Discord Bot Rollback (Pi)

See [Step 3: Rollback Docker Image](#step-3-rollback-docker-image)

**Typical rollback time: 1-2 minutes**

### Database Rollback

**⚠️ WARNING**: Database rollback is complex and risky.

**Options:**

1. **Rollback migration** (if applicable)

   ```bash
   # Undo last migration
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

2. **Restore from backup** (last resort)

   ```bash
   # Contact Neon support or use backup restore
   ```

3. **Fix forward** (preferred)
   - Write new migration to fix issue
   - Don't rollback database if possible

---

## Verification Steps

### Functional Verification

After rollback, verify:

```bash
# 1. Health check responds
curl http://localhost:8080/health

# 2. Bot is online in Discord
# Check Discord server - bot should show as "Online"

# 3. Commands work
# Try a simple command in Discord: /health

# 4. Database connectivity
# Command should respond with database status
```

### Performance Verification

_(Content to be added)_

### Data Integrity Verification

_(Content to be added)_

---

## Post-Rollback Actions

### Incident Report

Document the incident:

```markdown
# Incident Report: [Date] - [Brief Description]

## Summary

- **Date/Time**: 2024-01-02 14:30 UTC
- **Duration**: 15 minutes
- **Impact**: Discord bot offline, affecting all users
- **Resolution**: Rolled back to version 1.2.3

## Timeline

- 14:30: Deployment of v1.2.4 started
- 14:32: Health checks began failing
- 14:35: Error rate reached 100%
- 14:36: Decision made to rollback
- 14:38: Rollback initiated
- 14:45: Service restored with v1.2.3

## Root Cause

[To be determined after analysis]

## Prevention

[To be determined after analysis]
```

### Root Cause Analysis

_(Content to be added)_

### Prevention Measures

_(Content to be added)_

---

## Emergency Contacts

| Role                  | Name           | Contact            |
| --------------------- | -------------- | ------------------ |
| **Primary Developer** | [Your Name]    | [Your Email/Phone] |
| **Backup Contact**    | [Backup Name]  | [Backup Contact]   |
| **Hosting Support**   | Vercel Support | support@vercel.com |
| **Database Support**  | Neon Support   | support@neon.tech  |

---

## References

- [Deployment Guide](./DEPLOYMENT.md)
- [Raspberry Pi Setup](./RASPBERRY-PI-SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Docker Documentation](https://docs.docker.com/)
- [Vercel Deployment Rollback](https://vercel.com/docs/deployments/overview#promoting-deployments)

---

**Documentation Status:** 🚧 In Progress
**Phase:** 5.0 Pre-Implementation
**Next Steps:** Complete sections marked with _(Content to be added)_
