# ADR-001: Hybrid Cloud Architecture (Vercel + Raspberry Pi)

**Status:** Accepted
**Date:** 2025-11-02
**Deciders:** Luka Fagundes (Lead Developer)
**Technical Story:** Initial architecture design

---

## Context and Problem Statement

The sunny-stack portfolio platform requires a hosting solution that balances cost-effectiveness with scalability and reliability. The application has distinct requirements:

- **Frontend/API**: Needs to scale elastically for traffic spikes (portfolio visitors)
- **Database**: Requires persistent storage with 24/7 availability but predictable load
- **Discord Bot**: Requires persistent WebSocket connection (incompatible with serverless)

Traditional approaches would either use:

- Full cloud hosting (high monthly costs for small portfolio site)
- Full self-hosting (manual scaling, limited global CDN, single point of failure)

The key question: **How can we achieve serverless scalability for the web application while maintaining zero operating costs for infrastructure?**

---

## Decision Drivers

- **Cost Optimization**: Operating budget target of $0/month after initial hardware investment
- **Scalability**: Frontend must handle traffic spikes without manual intervention
- **Discord Bot Constraint**: Discord.js requires persistent WebSocket (cannot run on Vercel serverless)
- **Database Requirements**: 24/7 availability, predictable load (~10MB database size)
- **Developer Experience**: Simple deployment workflow
- **Global Performance**: CDN for static assets, low latency for global visitors
- **Control vs Convenience**: Balance between infrastructure control and deployment simplicity

---

## Considered Options

- **Option 1:** Full Vercel Serverless (Vercel Postgres + Vercel Functions)
- **Option 2:** Full Self-Hosted on Raspberry Pi
- **Option 3:** Hybrid Architecture (Vercel Frontend/API + Pi Database/Bot)
- **Option 4:** AWS/GCP Cloud (EC2/Compute Engine + RDS)

---

## Decision Outcome

**Chosen option:** Option 3 (Hybrid Architecture) - Combines the best of serverless and self-hosted while minimizing costs and complexity.

### Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Serverless)                     │
│                                                             │
│  ┌─────────────────────┐    ┌──────────────────────┐      │
│  │  Next.js Frontend   │    │   API Routes (27)     │      │
│  │  - React 19         │    │   - Google OAuth      │      │
│  │  - App Router       │    │   - Quote Management  │      │
│  │  - Server Components│    │   - Time Tracking     │      │
│  │  - Static Assets    │    │   - Monitoring        │      │
│  └─────────────────────┘    └──────────────────────┘      │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       │ DATABASE_URL
                                       │ (Postgres Connection)
                                       ↓
┌─────────────────────────────────────────────────────────────┐
│              RASPBERRY PI 4/5 (Self-Hosted)                 │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐     │
│  │ PostgreSQL Database  │    │   Discord Bot         │     │
│  │ - Docker Container   │    │   - WebSocket Gateway │     │
│  │ - postgres:15-alpine │    │   - 19 Commands       │     │
│  │ - 20 connections     │    │   - Health Server     │     │
│  └──────────────────────┘    └──────────────────────┘     │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       ↓
                               Discord Gateway
                               (WebSocket)
```

### Positive Consequences

- **Zero Operating Costs**: After initial Pi hardware (~$100-200), no monthly fees
- **Automatic Scaling**: Vercel handles frontend/API scaling automatically
- **Global CDN**: Vercel's edge network provides low latency worldwide
- **Database Control**: Full control over PostgreSQL (custom extensions, backup strategies)
- **Bot Compatibility**: Discord.js runs smoothly with persistent WebSocket on Pi
- **Simple Deployment**: Vercel auto-deploys on `git push`, Pi uses Docker Compose
- **Development Simplicity**: Local development can use Pi database or local PostgreSQL
- **Resource Efficiency**: Pi handles database + bot with room to spare (4GB RAM)

### Negative Consequences

- **Increased Complexity**: Managing two deployment targets instead of one
- **Network Dependency**: Vercel → Pi connection must be reliable (requires static IP or DDNS)
- **Single Database Instance**: No automatic failover (acceptable for portfolio site)
- **Firewall Configuration**: Must expose Pi PostgreSQL port to internet (security considerations)
- **Manual Bot Deployment**: Discord bot updates require SSH to Pi
- **Split Monitoring**: Must monitor Vercel (dashboard) and Pi (self-hosted tools) separately

---

## Pros and Cons of the Options

### Option 1: Full Vercel Serverless

**Description:** Host everything on Vercel using Vercel Postgres and Vercel Functions.

**Pros:**

- Single deployment target (Vercel)
- Fully managed infrastructure (no server maintenance)
- Automatic scaling for all components
- Built-in monitoring and analytics
- Global edge network for all requests

**Cons:**

- **Discord Bot Incompatible**: Vercel serverless functions have 10s timeout, cannot maintain WebSocket
- **High Database Costs**: Vercel Postgres pricing ~$20-200/month for production
- **Function Execution Costs**: Could exceed budget with high traffic
- **Limited Database Control**: Cannot customize PostgreSQL configuration
- **Vendor Lock-in**: Tight coupling to Vercel ecosystem

**Cost Estimate:** $20-100/month

### Option 2: Full Self-Hosted on Raspberry Pi

**Description:** Run Next.js, PostgreSQL, and Discord bot entirely on Raspberry Pi.

**Pros:**

- Zero monthly costs (only electricity)
- Complete infrastructure control
- No vendor lock-in
- Custom configurations possible
- Discord bot runs natively

**Cons:**

- **No Auto-Scaling**: Traffic spikes could overwhelm Pi (4-8GB RAM)
- **No CDN**: Static assets served from single location (higher latency)
- **Manual Deployment**: No automatic deployments on `git push`
- **Single Point of Failure**: Hardware failure = complete outage
- **Limited Resources**: Pi 4/5 cannot handle high concurrent traffic
- **Complex Setup**: Nginx reverse proxy, SSL certificates, process management

**Cost Estimate:** $0/month (after $100-200 hardware)

### Option 3: Hybrid Architecture (CHOSEN)

**Description:** Vercel for frontend/API + Raspberry Pi for database/bot.

**Pros:**

- **Cost-Effective**: $0/month operating costs
- **Scalable Frontend**: Vercel handles traffic spikes automatically
- **Bot Compatible**: Discord.js runs on Pi without constraints
- **CDN Benefits**: Global edge network for static assets
- **Database Control**: Full PostgreSQL customization
- **Simple Frontend Deployment**: Auto-deploy on `git push`
- **Resource Efficiency**: Pi handles database + bot easily

**Cons:**

- **Two Deployment Targets**: Increased operational complexity
- **Network Dependency**: Vercel must reach Pi database (static IP required)
- **Manual Bot Deployment**: SSH required for bot updates
- **Split Monitoring**: Must monitor two platforms
- **Security Considerations**: Database exposed to internet (mitigated with connection pooling, firewall)

**Cost Estimate:** $0/month (after $100-200 hardware)

### Option 4: AWS/GCP Cloud

**Description:** Use AWS EC2 + RDS or GCP Compute Engine + Cloud SQL.

**Pros:**

- Enterprise-grade infrastructure
- Managed database services (automatic backups, failover)
- Flexible scaling options
- Professional monitoring tools
- Discord bot compatible (EC2/Compute Engine)

**Cons:**

- **High Costs**: Estimated $50-200/month for EC2 + RDS
- **Complexity**: Requires VPC, security groups, IAM configuration
- **Overkill**: Far exceeds portfolio site requirements
- **Steeper Learning Curve**: More complex than Vercel or Docker
- **Billing Surprises**: Easy to exceed budget with misconfiguration

**Cost Estimate:** $50-200/month

---

## Implementation Details

### Deployment Architecture

**Vercel Configuration:**

```javascript
// next.config.js
module.exports = {
  // Externalize Discord.js to prevent bundling (bot runs on Pi)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("discord.js");
    }
    return config;
  },
};
```

**Environment Variables:**

```bash
# .env.production (Vercel)
DATABASE_URL=postgresql://user:pass@pi-static-ip:5432/sunnystack?connection_limit=20
NEXT_PUBLIC_APP_URL=https://sunny-stack.com

# .env.production (Raspberry Pi)
DISCORD_BOT_TOKEN=...
BOT_API_URL=https://sunny-stack.com/api
DATABASE_URL=postgresql://user:pass@postgres:5432/sunnystack
```

**Docker Compose (Raspberry Pi):**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "0.0.0.0:5432:5432" # Expose to Vercel
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

  discord-bot:
    image: sunny-stack-bot:latest
    depends_on:
      postgres:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1.5G
```

### Security Measures

1. **PostgreSQL Firewall Rules:**
   - Allow connections only from Vercel IP ranges
   - Use UFW firewall on Raspberry Pi
   - Connection pooling limit (`?connection_limit=20`)

2. **SSH Hardening:**
   - SSH key-only authentication
   - Disable root login
   - Change default SSH port
   - Fail2Ban for brute-force protection

3. **Environment Variable Security:**
   - Database credentials in Vercel secrets
   - Discord bot token never in repository
   - API keys rotated quarterly

### Deployment Workflow

**Frontend/API (Vercel):**

1. Push to `main` branch
2. Vercel auto-deploys (automatic)
3. Health check validates deployment
4. Rollback via Vercel dashboard if needed

**Database/Bot (Raspberry Pi):**

1. SSH to Raspberry Pi
2. Pull latest code: `git pull origin main`
3. Build bot image: `docker build -t sunny-stack-bot:latest -f Dockerfile .`
4. Apply migrations: `docker compose exec discord-bot npx prisma migrate deploy`
5. Restart services: `docker compose up -d`
6. Verify health: `curl http://localhost:8080/health`

---

## Validation and Metrics

### Performance Targets (ACHIEVED)

- **Initial Load:** <2000ms (Vercel CDN)
- **API Response:** <500ms (Vercel serverless functions)
- **Database Query:** <100ms (Pi PostgreSQL with caching)
- **Bot Uptime:** >99.5% (Pi 24/7 availability)

### Cost Validation (ACHIEVED)

- **Monthly Operating Costs:** $0 (Vercel free tier + Pi electricity ~$2/month)
- **Initial Hardware Investment:** $150 (Raspberry Pi 4 8GB + accessories)
- **Break-even:** Month 1 (vs $20/month Vercel Postgres)

### Scalability Validation

- **Concurrent Users:** Vercel handles 100+ concurrent users without performance degradation
- **Database Load:** Pi PostgreSQL handles ~50 queries/second with room to scale
- **Bot Performance:** Handles 19 commands with <200ms response time

---

## Related Decisions

- [ADR-002: Next.js App Router vs Pages Router](./ADR-002-nextjs-app-router.md)
- [ADR-004: Discord.js for Bot Framework](./ADR-004-discord-js-framework.md)
- [ADR-005: PostgreSQL vs Other Databases](./ADR-005-postgresql-database.md)

---

## References

- **Vercel Documentation:** https://vercel.com/docs
- **Docker Compose Documentation:** https://docs.docker.com/compose/
- **Raspberry Pi Documentation:** https://www.raspberrypi.com/documentation/
- **Discord.js Deployment Guide:** https://discordjs.guide/improving-dev-environment/hosting-on-a-vps.html
- **Trinity Method Architecture Principles:** [trinity/knowledge-base/ARCHITECTURE.md](../../../trinity/knowledge-base/ARCHITECTURE.md)

---

## Notes

### Future Considerations

- **Database Scaling:** If traffic exceeds Pi capacity, migrate to Neon/Supabase serverless PostgreSQL
- **Bot Scaling:** If bot joins >2500 guilds, implement Discord.js sharding
- **High Availability:** Consider second Pi for database replication (read replicas)
- **Monitoring:** Add Prometheus + Grafana for Pi monitoring

### Migration Path

```
Current: Vercel + Pi
  ↓
Phase 1: Add Redis caching (if needed)
  ↓
Phase 2: Migrate to Neon serverless PostgreSQL (if Pi becomes bottleneck)
  ↓
Phase 3: Full serverless (Vercel + Neon + Serverless bot on Fly.io)
```

### Lessons Learned

- Hybrid architecture provides excellent cost/performance balance for small-to-medium applications
- Separating stateless (Vercel) and stateful (Pi) components simplifies scaling
- Docker Compose simplifies Pi deployment significantly
- Static IP requirement is minor inconvenience (DDNS services available)

---

**Last Updated:** 2026-01-07
**Superseded By:** N/A (Current Architecture)
**Supersedes:** N/A (Initial Decision)
