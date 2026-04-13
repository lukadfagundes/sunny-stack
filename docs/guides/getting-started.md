# Getting Started with sunny-stack

Welcome to sunny-stack! This guide will help you get the project running on your local machine for development.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 20 or later)
- **npm** (version 10+, included with Node.js)
- **Git** for version control

No database is required. This project fetches all data from external APIs at runtime.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/strawhatluka/sunny-stack.git
cd sunny-stack
```

### 2. Install Dependencies

```bash
npm ci
```

This installs exact dependency versions from `package-lock.json` for reproducible builds.

### 3. Environment Configuration

Copy `.env.example` to `.env.local` and populate with your API credentials:

```bash
cp .env.example .env.local
```

All environment variables are optional -- the app gracefully falls back to empty states when credentials are missing. See `.env.example` for the full list of 10 variables across 6 services (GitHub, Instagram, YouTube, Bluesky, Spotify, Steam).

**Environment variables:**

| Variable                 | Service   | Description                                     |
| ------------------------ | --------- | ----------------------------------------------- |
| `GITHUB_TOKEN`           | GitHub    | Personal access token for GitHub GraphQL API    |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram | Long-lived access token for Instagram Graph API |
| `YOUTUBE_API_KEY`        | YouTube   | YouTube Data API v3 key                         |
| `YOUTUBE_CHANNEL_ID`     | YouTube   | YouTube channel ID                              |
| `BLUESKY_HANDLE`         | Bluesky   | Bluesky handle/username                         |
| `SPOTIFY_CLIENT_ID`      | Spotify   | Spotify OAuth client ID                         |
| `SPOTIFY_CLIENT_SECRET`  | Spotify   | Spotify OAuth client secret                     |
| `SPOTIFY_REFRESH_TOKEN`  | Spotify   | Spotify OAuth refresh token                     |
| `STEAM_API_KEY`          | Steam     | Steam Web API key                               |
| `STEAM_ID`               | Steam     | Steam 64-bit user ID                            |

You can start with zero credentials configured. The site will render normally with placeholder/empty content for any missing service.

---

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

The development server uses Turbopack for fast hot module replacement. Changes to source files are reflected immediately in the browser.

### Available Pages

| Route        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `/`          | Home page with hero section, contribution heatmap, stats dashboard |
| `/about`     | About page with profile card, social feeds, music, gaming stats    |
| `/portfolio` | Portfolio page with project categories                             |
| `/docs`      | Documentation viewer with navigation sidebar                       |

### Running Tests

Run the full test suite with Jest. All 434 tests should pass. Coverage thresholds are enforced at 80% for statements, branches, functions, and lines.

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npx jest tests/api/github.test.ts
```

### Other Commands

```bash
# Run ESLint checks
npm run lint

# Type-check without emitting files
npm run typecheck

# Production build
npm run build

# Start production server (after build)
npm start
```

---

## Project Structure

```
sunny-stack/
├── src/                      # Application source code
│   ├── app/                  # Next.js App Router pages and API routes
│   │   ├── api/              # API route handlers (10 endpoints)
│   │   ├── about/            # About page
│   │   ├── portfolio/        # Portfolio page
│   │   ├── docs/             # Documentation viewer page
│   │   ├── not-found.tsx     # Custom 404 page (ZoroGame)
│   │   ├── layout.tsx        # Root layout (RootLayout)
│   │   └── page.tsx          # Home page
│   ├── components/           # React components (36 .tsx components + 5 utility modules)
│   ├── lib/                  # Utility libraries and static data
│   │   ├── data/             # Static TypeScript data files (projects, personal info)
│   │   └── github.ts         # GitHub GraphQL data fetching
│   └── proxy.ts              # Rate limiting proxy
├── tests/                    # Test files (mirroring src/ structure)
├── docs/                     # Project documentation
├── public/                   # Static assets
├── next.config.ts            # Next.js configuration
├── jest.config.ts            # Jest test configuration
├── tsconfig.json             # TypeScript configuration
├── eslint.config.mjs         # ESLint configuration
├── postcss.config.mjs        # PostCSS configuration (Tailwind CSS v4)
├── vercel.json               # Vercel deployment configuration
└── package.json              # Dependencies and scripts
```

---

## How It Works

sunny-stack is a **server-rendered portfolio website** with no database. Each page is a React Server Component that fetches data from external APIs through internal API routes:

1. **Pages** (e.g., `/about`) render as React Server Components
2. **API routes** (e.g., `/api/github`) proxy requests to external services
3. **External APIs** (GitHub, Bluesky, Instagram, YouTube, Spotify, Steam) provide real-time data
4. **Middleware** rate-limits API requests at 30 per minute per IP address

When an external API credential is missing, the corresponding API route returns `null` or `[]`, and the page renders gracefully without that data section.

---

## Verification

After completing the setup, verify everything works:

1. **Application starts:** `npm run dev` runs without errors and http://localhost:3000 loads
2. **Tests pass:** `npm test` shows all tests passing
3. **Lint passes:** `npm run lint` reports no errors
4. **Build succeeds:** `npm run build` completes without errors

---

## Troubleshooting

### Common Issues

**Issue:** Dependencies fail to install

- **Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` to regenerate

**Issue:** Port 3000 already in use

- **Solution:** Stop the process using port 3000 (`lsof -ti:3000 | xargs kill`) or start on another port: `npm run dev -- -p 3001`

**Issue:** API routes return `null` or empty arrays

- **Solution:** This is expected behavior when environment variables are not set. Check `.env.local` contains valid credentials for the service you are testing

**Issue:** TypeScript errors in IDE but build passes

- **Solution:** Restart your TypeScript language server. In VS Code: `Cmd+Shift+P` > "TypeScript: Restart TS Server"

**Issue:** Tests fail with timeout errors in CI

- **Solution:** Integration tests require `maxWorkers=1` to avoid cross-suite data pollution. Run with: `npx jest --maxWorkers=1`

---

## Next Steps

- Read the [API Documentation](../api/README.md) to understand available endpoints
- Review the [API Development Guide](./api-development.md) to learn how to add new features

- See the [Deployment Guide](./deployment.md) for production deployment

---

## Need Help?

- **Documentation:** [Full documentation](../README.md)
- **Issues:** Report bugs via [GitHub Issues](https://github.com/strawhatluka/sunny-stack/issues)
- **Questions:** [GitHub Discussions](https://github.com/strawhatluka/sunny-stack/discussions)

---

_Last updated: 2026-03-24_
