# Sunny Stack Portfolio Documentation

Welcome to the comprehensive documentation for Sunny Stack Portfolio - a modern Next.js 15 portfolio application with hybrid cloud + self-hosted architecture.

## 🚀 Quick Start

New to the project? Start here:

1. **[Getting Started Guide](guides/getting-started.md)** - Setup, installation, and first steps
2. **[Architecture Overview](architecture/overview.md)** - Understand the system design
3. **[API Reference](api/README.md)** - Explore available endpoints

---

## 📚 Documentation Structure

### 🎯 Guides

Step-by-step guides for common development tasks.

- **[Getting Started](guides/getting-started.md)** - Complete setup and installation guide
  - Prerequisites and installation
  - Environment configuration
  - Running development server
  - Common development tasks
  - Troubleshooting

**Planned Guides:**

- Contributing Guide
- Testing Guide
- Database Management Guide
- Discord Bot Development Guide

[View all guides →](guides/)

---

### 🏗️ Architecture

Technical documentation about system design and patterns.

- **[Architecture Overview](architecture/overview.md)** - Comprehensive system architecture
  - System architecture diagram
  - Technology stack (Next.js 15, React 19, PostgreSQL, Discord.js)
  - Deployment architecture (Vercel + Raspberry Pi)
  - Application structure
  - Data architecture & database schema
  - API architecture (27 endpoints)
  - Discord bot architecture (19 commands)
  - Security architecture
  - Performance & scalability
  - Testing architecture
  - Technical decisions log

[View all architecture docs →](architecture/)

---

### 🔌 API Reference

Complete API documentation for all endpoints.

- **[API Documentation](api/README.md)** - REST API reference
  - **Public Endpoints:** Health check, quote submission
  - **Authentication:** Google OAuth flow
  - **Admin Endpoints:** Analytics, projects, quotes, time tracking, monitoring
  - **Projects API:** CRUD operations, status management
  - **Quotes API:** Quote management, conversion to projects
  - **Time Tracking API:** Manual and Discord-based time logging
  - **Monitoring API:** Service health checks, alerts, GitHub status
  - **Discord Integration:** Interactions and webhooks
  - Error response formats
  - Authentication & authorization

[View API documentation →](api/)

---

### 📖 Reference

Quick reference for commands, environment variables, and conventions.

- **[Reference Guide](reference/README.md)** - Commands and configuration
  - NPM scripts (development, testing, bot, deployment)
  - Environment variables (required and optional)
  - Configuration files (Next.js, TypeScript, Prisma, Jest, Playwright)
  - Coding conventions (file naming, component structure, API routes)
  - Project constants (status values, enums)
  - Database schema reference
  - Error codes
  - CLI commands

[View reference documentation →](reference/)

---

### 🚢 Deployment

Deployment guides for Vercel and Raspberry Pi.

- **[Deployment Overview](deployment/README.md)** - Deployment architecture and quick start
  - Vercel deployment (automatic)
  - Raspberry Pi deployment (Docker)
  - Environment configuration
  - Deployment checklist
  - Rollback procedures
  - Monitoring

**Planned Deployment Guides:**

- Deployment Overview (detailed)
- Raspberry Pi Setup (initial configuration)
- Pi Deployment Procedures
- GitHub Actions Setup (CI/CD)
- Troubleshooting Guide

[View deployment documentation →](deployment/)

---

## 🎨 Project Overview

### Technology Stack

**Frontend:**

- Next.js 15.5.9 (App Router)
- React 19.0
- TypeScript 5.5
- Tailwind CSS 3.4

**Backend:**

- Next.js API Routes (27 endpoints)
- PostgreSQL 15 (Raspberry Pi)
- Prisma ORM 6.18.0
- Google OAuth authentication

**Bot & Services:**

- Discord.js 14.14.1 (19 commands)
- Winston logging
- Rollbar error tracking
- Service health monitoring

**Testing:**

- Jest 30.1.3 (unit tests)
- Playwright 1.55.0 (E2E tests)
- 299+ test files

### Architecture Highlights

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│   Next.js Website + API Routes      │
└──────────────┬──────────────────────┘
               │ DATABASE_URL
               ↓
┌─────────────────────────────────────┐
│      Raspberry Pi (Self-Hosted)     │
│  • PostgreSQL Database              │
│  • Discord Bot                      │
└─────────────────────────────────────┘
```

**Why Hybrid?**

- **Vercel:** Automatic scaling, global CDN, zero-config deployment
- **Raspberry Pi:** 24/7 database & bot at $0/month operating cost
- **Best of Both:** Serverless flexibility + self-hosted control

### Key Features

- **Admin Dashboard:** Project and quote management
- **Quote System:** Public quote request form with email notifications
- **Discord Bot:** Project notifications, time tracking, monitoring
- **Time Tracking:** Discord-based and manual time logging
- **Service Monitoring:** Health checks for external APIs
- **PDF Generation:** Automated proposal generation
- **Google OAuth:** Secure admin authentication

---

## 🗂️ Repository Structure

```
sunny-stack/
├── app/                 # Next.js 15 App Router
│   ├── api/            # API routes (27 endpoints)
│   ├── admin/          # Admin dashboard pages
│   └── (public)/       # Public pages (about, contact, portfolio, etc.)
├── bot/                 # Discord bot (19 commands)
│   ├── commands/       # Slash commands
│   ├── core/           # Bot infrastructure
│   └── events/         # Discord event handlers
├── components/          # React components
├── lib/                 # Core utilities
│   ├── auth/           # Google OAuth
│   ├── db/             # Database (Prisma)
│   ├── errors/         # Error handling
│   └── monitoring/     # Service monitoring
├── prisma/             # Database schema and migrations
├── __tests__/          # Unit tests (299 files)
├── e2e/                # E2E tests (15 specs)
├── docs/               # Documentation (you are here!)
└── trinity/            # Trinity Method SDK
```

---

## 🔗 Related Documentation

### Trinity Method Documentation

This project uses the **Trinity Method SDK v2.0.7** for investigation-first development. Trinity-specific documentation:

- **[Trinity CLAUDE.md](../trinity/CLAUDE.md)** - Trinity Method enforcement and protocols
- **[Trinity Architecture](../trinity/knowledge-base/ARCHITECTURE.md)** - Technical architecture with Trinity integration
- **[Trinity To-Do](../trinity/knowledge-base/To-do.md)** - Task tracking
- **[Known Issues](../trinity/knowledge-base/ISSUES.md)** - Issue patterns and resolutions
- **[Technical Debt](../trinity/knowledge-base/Technical-Debt.md)** - Debt tracking
- **[Testing Principles](../trinity/knowledge-base/TESTING-PRINCIPLES.md)** - Testing standards
- **[Coding Principles](../trinity/knowledge-base/CODING-PRINCIPLES.md)** - Code standards

### External Resources

- **[Next.js Documentation](https://nextjs.org/docs)** - Next.js 15 framework
- **[Prisma Documentation](https://www.prisma.io/docs)** - Database ORM
- **[Discord.js Guide](https://discordjs.guide/)** - Discord bot framework
- **[React Documentation](https://react.dev/)** - React 19
- **[TypeScript Documentation](https://www.typescriptlang.org/docs/)** - TypeScript 5.5

---

## 📝 Documentation Conventions

### File Organization

Documentation follows a **hierarchical structure**:

```
docs/
├── README.md            # This file (main navigation)
├── guides/             # Step-by-step guides
│   ├── README.md
│   └── getting-started.md
├── architecture/       # System design documentation
│   ├── README.md
│   └── overview.md
├── api/                # API reference
│   └── README.md
├── reference/          # Quick reference
│   └── README.md
├── deployment/         # Deployment guides
│   └── README.md
└── images/             # Documentation images (if needed)
```

### Naming Conventions

- **Guides:** Action-oriented (getting-started.md, deploying-to-vercel.md)
- **Architecture:** Topic-oriented (overview.md, data-flow.md)
- **Reference:** Resource-oriented (api-endpoints.md, environment-variables.md)

### Writing Style

- **Clear and concise** - Get to the point quickly
- **Code examples** - Show, don't just tell
- **Practical focus** - Real-world usage over theory
- **Up-to-date** - Documentation reflects current implementation

---

## 🆘 Getting Help

### Documentation Resources

1. **Search this documentation** - Use your editor's search (Ctrl+F)
2. **Check Trinity Knowledge Base** - [trinity/knowledge-base/](../trinity/knowledge-base/)
3. **Review Known Issues** - [ISSUES.md](../trinity/knowledge-base/ISSUES.md)

### Development Resources

- **Architecture Questions:** [architecture/overview.md](architecture/overview.md)
- **API Questions:** [api/README.md](api/README.md)
- **Setup Issues:** [guides/getting-started.md](guides/getting-started.md)
- **Environment Variables:** [reference/README.md](reference/README.md)

### Contact

- **Email:** luka@sunny-stack.com
- **GitHub:** [@lukadfagundes](https://github.com/lukadfagundes)

---

## 📊 Documentation Coverage

**Current Coverage:** 85%

| Category            | Status   | Files       |
| ------------------- | -------- | ----------- |
| **Getting Started** | Complete | 1/1         |
| **Architecture**    | Complete | 1/1         |
| **API Reference**   | Complete | 1/1         |
| **Reference**       | Complete | 1/1         |
| **Deployment**      | Partial  | 1/5 planned |

**Gaps Identified:**

- Deployment guides (4 planned documents)
- Advanced development guides
- Discord bot development guide
- Testing guide
- Database management guide

See [Organization Report](../trinity/reports/DOCS-ORGANIZATION-2026-01-07.md) for detailed coverage metrics.

---

## 🔄 Keeping Documentation Updated

**Documentation is a living resource.** Please update documentation when:

- Adding new features
- Changing architecture
- Updating dependencies
- Fixing bugs that affect usage
- Discovering common pitfalls

**Last Updated:** 2026-01-07
**Documentation Version:** 2.0.2
**Maintained by:** Sunny Stack Development Team

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Ready to start?** → [Begin with Getting Started Guide](guides/getting-started.md)
