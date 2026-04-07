# sunny-stack

A personal developer portfolio website built with Next.js 16, React 19, and Tailwind CSS v4. Aggregates activity from GitHub, Bluesky, Instagram, YouTube, Spotify, and Steam into a unified, interactive experience.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Tests-445%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen)]()
[![License](https://img.shields.io/badge/License-CC--BY--NC--4.0-blue)](LICENSE)

---

## Features

- **Multi-Platform Integration** - Pulls live data from 6 external APIs (GitHub, Bluesky, Instagram, YouTube, Spotify, Steam)
- **Server Components** - Built on Next.js App Router with React Server Components for optimal performance
- **10 API Endpoints** - RESTful API layer across 8 resource groups with graceful fallbacks
- **Interactive 404 Page** - A playable Zoro-themed game when users hit a missing page
- **Rate Limiting** - IP-based rate limiting (30 req/min) via middleware with security headers (CSP, HSTS)
- **ISR Caching** - Incremental Static Regeneration with 1-hour revalidation for external API data
- **Documentation Viewer** - Server-rendered `/docs` page with 3-level collapsible sidebar, breadcrumbs, per-file URLs, and client-side Mermaid diagram rendering
- **SEO Optimized** - Per-page metadata, Open Graph tags, Twitter Cards, Person JSON-LD schema, sitemap, and robots.txt
- **90% Test Coverage** - 445 tests across 47 suites with enforced coverage thresholds

---

## Installation

### Prerequisites

- Node.js 20+
- npm 10+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/strawhatluka/sunny-stack.git
cd sunny-stack

# Install dependencies
npm ci

# Copy environment file
cp .env.example .env.local

# Fill in your API credentials in .env.local

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

All environment variables are optional. The app gracefully falls back to empty states when credentials are missing. See [`.env.example`](.env.example) for the full list of 10 variables across 6 services.

---

## Documentation

Complete documentation is available in the [`docs/`](docs/) directory:

- [Getting Started Guide](docs/guides/getting-started.md) - Setup and installation
- [API Documentation](docs/api/README.md) - Complete API reference (10 endpoints)
- [API Endpoint Map](docs/api/endpoint-map.md) - Visual endpoint diagram
- [Architecture Diagrams](docs/architecture/) - System architecture visualizations
- [Deployment Guide](docs/guides/deployment.md) - Production deployment instructions
- [API Development Guide](docs/guides/api-development.md) - Adding new API routes
---

## Architecture

sunny-stack follows a **Next.js App Router** architecture with Server Components and API Routes.

- **Frontend:** React 19.2.4 with Server Components, Tailwind CSS v4, Framer Motion
- **API Layer:** 10 GET endpoints across 8 resource groups (GitHub, Bluesky, Instagram, YouTube, Spotify, Steam, Docs, Activity)
- **External Integrations:** GitHub GraphQL, Bluesky AT Protocol, Instagram Graph API, YouTube Data API v3, Spotify Web API, Steam Web API
- **Security:** Rate limiting (30 req/min/IP), CSP headers, HSTS, input validation

For detailed diagrams, see:
- [Component-API Flow](docs/architecture/mvc-flow.md)
- [API Endpoint Map](docs/api/endpoint-map.md)
- [Component Hierarchy](docs/architecture/component-hierarchy.md)

---

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |

### Project Structure

```
sunny-stack/
├── src/
│   ├── app/           # Next.js App Router pages and API routes
│   │   ├── api/       # 10 API route handlers
│   │   ├── about/     # About page
│   │   ├── portfolio/ # Portfolio page
│   │   ├── docs/      # Documentation viewer page
│   │   └── not-found.tsx # Custom 404 page (ZoroGame)
│   ├── components/    # React components (36 .tsx components + 5 utility modules)
│   └── lib/           # Shared utilities and static data
│       ├── data/      # Static TypeScript data files (projects, personal info)
│       └── github.ts  # GitHub GraphQL data fetching
├── tests/             # Jest test suites
├── docs/              # Project documentation
└── .github/           # CI/CD workflows
```

---

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/) License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Luka Fagundes
