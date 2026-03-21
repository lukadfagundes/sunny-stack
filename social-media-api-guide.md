# Social Media API Guide

> Comprehensive developer reference for modern social media platform APIs.
> Last updated: March 2026

---

## Quick Reference

| Platform | Free Tier | Paid Tiers | Auth | Key Limitation |
|----------|-----------|------------|------|----------------|
| **Instagram** | Yes | None | OAuth 2.0 | Business/Creator accounts only |
| **LinkedIn** | Yes (100–500 calls/day) | $12K+/year (Partner) | OAuth 2.0 | Partner status for advanced access |
| **YouTube** | Yes (10K units/day) | Free increases via audit | API Key / OAuth 2.0 | Compliance audit for quota increases |
| **Reddit** | Yes (100 QPM) | $12K+/year | OAuth 2.0 | 1-hour token expiry |
| **Discord** | Yes (unlimited) | None | Bot token | Rate limits only (50 req/sec) |
| **Bluesky** | Yes | None | OAuth 2.0 / App Passwords | Decentralized architecture |
| **Twitch** | Yes | None | OAuth 2.0 | Scope-gated endpoints |
| **GitHub** | Yes (5K req/hr auth) | $4–$21/user/mo (platform) | OAuth / PAT | 60 req/hr unauthenticated |
| **Spotify** | Yes (severely restricted) | Extended Quota (business only) | OAuth 2.0 | Premium account required for devs |

---

## Platforms

### Instagram (Meta Graph API)

**API:** Instagram Graph API (through Meta)
**Auth:** OAuth 2.0 via Facebook/Meta infrastructure

**Capabilities:**
- Publish photos, carousels, videos, Reels, Stories
- Read media with metadata
- Analytics: impressions, reach, video views, likes, saves, engagement
- 2026 additions: Reels Skip Rate, Repost Counts
- Direct messaging (200 DMs/hour)

**Pricing:** Free

**Rate Limits:** 200 API calls per hour per Instagram account (rolling reset). All requests count including failures.

**Restrictions:**
- Business or Creator accounts only (Basic Display API deprecated)
- Must connect to a Facebook Page
- Mandatory App Review to go live
- Several metrics deprecated in Graph API v21 (video_views, email_contacts, profile_views, etc.)

---

### LinkedIn

**API:** LinkedIn API (Microsoft)
**Auth:** OAuth 2.0

**Capabilities:**
- Sign-in/authentication
- Limited profile access (name, picture, headline)
- Posts API (personal and organization)
- Member Post Analytics: engagement, impressions, reach, reactions
- Video Insights: watch time, views, unique viewers
- Follower growth tracking

**Pricing:**

| Tier | Cost | Rate Limits |
|------|------|-------------|
| Free | $0 | 100–500 calls/day (endpoint-dependent) |
| Premium/Partner | $12,000+/year | 100K+ daily requests |
| Enterprise | Tens of thousands+/year | Millions of daily requests |

**Restrictions:**
- Must be an official LinkedIn Partner for advanced features
- Access tokens valid for 1 hour only
- Scraping strictly prohibited

---

### YouTube (Google Data API)

**API:** YouTube Data API v3, Analytics API, Reporting API
**Auth:** API Key (read-only public data), OAuth 2.0 (private data, writes)

**Capabilities:**
- Video management: upload, update, delete
- Analytics: views, likes, comments
- Playlists: create, manage, retrieve
- Comments: read, post, moderate
- Channel management, search

**Pricing:** Free quota system (no direct fees)

**Quota System:**

| Operation | Quota Cost | Max/Day (10K default) |
|-----------|-----------|----------------------|
| videos.list | 1 unit | 10,000 |
| search.list | 100 units | 100 |
| videos.insert (upload) | 1,600 units | 6 |

- Default: 10,000 units/day (resets midnight PT)
- Free increases available via compliance audit
- Massive commercial use may require paid tier

**Restrictions:** Must comply with YouTube API Terms of Service. Approval-based quota increases.

---

### Reddit

**API:** Reddit Data API
**Auth:** OAuth 2.0 (required for all access)

**Capabilities:**
- Fetch/create posts and comments
- User profile management, voting
- Subreddit data and metrics
- Moderation tools (approve/remove, moderation logs)

**Pricing:**

| Tier | Cost | Rate Limit |
|------|------|------------|
| Free | $0 | 100 QPM (10-min rolling avg) |
| Premium | $12,000/year (100 RPM) | 100–1,000 RPM |
| Premium (high vol) | ~$60,000/year (500 RPM) | Higher RPM |
| Enterprise | $50,000–$500,000+/year | Custom/unlimited |

**Alternative:** $0.24 per 1,000 API calls

**Restrictions:**
- OAuth tokens valid for 1 hour only
- Bots cannot manipulate voting
- Explicit approval required before data access
- Premium tier targets commercial applications

---

### Discord

**API:** Discord API (REST + WebSocket Gateway)
**Auth:** Bot tokens

**Capabilities:**
- Full bot development with permission controls
- Messages: send, edit, delete in channels
- Channels/roles/permissions management
- Webhooks for real-time updates
- Voice channel monitoring
- Moderation and auto-moderation
- 2026: AI bots for Q&A, auto-moderation, knowledge bases

**Pricing:** Completely free. No charges, no monthly fees.

**Rate Limits:**
- Global: 50 requests/second per bot/user
- Per-route limits vary (indicated in response headers)
- HTTP 429 when exceeded

**Restrictions:** Must respect rate limits. No API fees whatsoever.

---

### Bluesky (AT Protocol)

**API:** AT Protocol / Bluesky API
**Auth:** OAuth 2.0, App Passwords (handle + app password → JWT)

**Capabilities:**
- Read/write posts (including replies, mentions, images)
- Timelines, profiles, followers, engagement metrics
- Social graph management (follows, blocks, mutes)
- Advanced moderation and content filtering
- Real-time notifications, direct messages
- Custom feed algorithms

**Pricing:** Free (no paid tiers)

**Rate Limits:** Points-based — 5,000 points/hour, 35,000 points/day. Create: 3 pts, Update: 2 pts, Delete: 1 pt.

**Restrictions:** Decentralized architecture (no single centralized API). Contact Bluesky for rate limit issues.

---

### Twitch

**API:** Helix API
**Auth:** OAuth 2.0 (app access and user access tokens)

**Capabilities:**
- Channel info, streams, users, chat, moderators/VIPs
- Modify channel metadata (title, game)
- Chat operations, search channels
- Webhooks for real-time events

**Pricing:** Free

**Rate Limits:** Token-bucket algorithm. Default: 1 point/request. User access limits per client ID per user per minute. HTTP 429 when depleted.

**Restrictions:** Some endpoints require specific OAuth scopes.

---

### GitHub

**API:** REST API + GraphQL API
**Auth:** Personal Access Tokens, OAuth apps, GitHub Apps

**Capabilities:**
- Repository CRUD, issues, pull requests, releases
- User profiles, social graph
- Code search, Actions, Packages, Pages
- Comments, discussions, webhooks

**Pricing:**

| Tier | Cost | Actions Minutes | Packages Storage |
|------|------|-----------------|------------------|
| Free | $0 | 2,000/month | 500 MB |
| Team | $4/user/month | 3,000/month | 2 GB |
| Enterprise | $21/user/month | 50,000/month | 50 GB |

**Rate Limits:**
- Unauthenticated: 60 requests/hour
- Authenticated (REST): 5,000 requests/hour
- Authenticated (GraphQL): 5,000 points/hour
- Secondary: 100 concurrent requests

**Restrictions:** GraphQL requires authentication. Secondary rate limits prevent abuse.

---

### Spotify

**API:** Spotify Web API
**Auth:** OAuth 2.0 (Premium account required for developers as of Feb 2026)

**Capabilities (Development Mode — severely restricted in 2026):**
- Search catalog (max 10 results)
- Playlist metadata (owned/collaborated only)
- Playback control (Premium accounts only)
- Removed: bulk track metadata, new album releases, artist top tracks

**Capabilities (Extended Quota Mode):**
- Full endpoint access, playlist management, recommendations, analytics

**Pricing:** Free (Development Mode) — but Premium account required. Extended Quota: business-only (legally registered, 250K MAU, key market presence).

**Rate Limits:** Rolling 30-second window. Development Mode has significantly lower limits. Extended Quota limits not publicly disclosed.

**Restrictions:** February 2026 changes severely limited Development Mode. Limited to 5 test users in Dev Mode. Only organizations accepted for Extended Quota.

---

## Key Takeaways

**Completely Free APIs:** Discord, Bluesky, Twitch

**Free with Generous Limits:** YouTube (10K units/day), GitHub (5K req/hr), Instagram

**Expensive / Enterprise-Focused:** LinkedIn ($12K+/yr), Reddit ($12K+/yr for commercial)

**Heavily Restricted in 2026:** Spotify (Premium required, Dev Mode gutted), LinkedIn (Partner-only for advanced features)

**Best for Portfolio Integration:**
- **GitHub** — rich developer data, generous free tier
- **Discord** — completely free, excellent for bots
- **Bluesky** — free, modern, growing developer community
- **YouTube** — free quota, broad content data
