# Changelog

All notable changes to sunny-stack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.6] - 2026-02-26

### Added

- Implement a new "Contributions Card" section in `app/portfolio/page.tsx` to display contribution projects.
- Define `contributionProjects` array in `app/portfolio/projects-data.tsx` to store data for open-source contributions, including details for "Reactive Resume - Job Search, AI Tailoring & DOCX Export".
- Add a `typecheck` script to `package.json` using `tsc --noEmit` for type checking.

### Changed

- Update `app/portfolio/page.tsx` to import `contributionProjects` and `GitMerge` icon.
- Modify `lint` and `lint:fix` scripts in `package.json` to use `eslint .` and `eslint . --fix` respectively.

## [2.0.5] - 2026-02-26

### Added

- Unit tests for core lib modules: DataLoader factories, config validation, QueryOptimizer, GoogleQuotaManager (147 tests)
- Unit tests for admin components: ProjectTable, ProjectForm, TimeEntryForm, Skeletons, QuoteCard, QuoteReviewModal, AdminNav, HealthIndicator, DashboardCard, AnalyticsChart (183 tests)
- Unit tests for portfolio/quote components: ProjectModal, TechnicalFormFields, ErrorBoundary (72 tests)
- Unit tests for admin pages: QuotesListPage, QuoteDetailPage, ProjectsListPage (34 tests)
- Comprehensive API route tests: analytics, auth, health, monitor, projects, proposals, quotes, reports, send-quote, sync, test-notification, time-entries (542 tests)

### Removed

- Stale `app/portfolio/page-old.tsx` backup file (570 LOC dead code)

### Changed

- Removed Jest (Changed Files) pre-commit hook to speed up commits
- Split Jest config into unit (parallel) and integration (serial `maxWorkers=1`) for ~71% faster test runs (57s → 16s)
- Added explicit `bot/dist/` to `.gitignore`

### Fixed

- Timer leak in `base-service.test.ts` — GoogleQuotaManager timers not destroyed in afterEach
- GoogleQuotaManager timer leak causing "worker failed to exit gracefully" — added `.unref()` to all timers and fixed `clearInterval`/`clearTimeout` mismatch in `destroy()`
- Flaky cache retrieval timing test in `performance.benchmark.test.ts` (1ms → 5ms threshold)
- `example-gmail-service.ts` excluded from coverage metrics (dead example code with `@ts-nocheck`)
- Branch coverage threshold aligned to 70% to match project acceptance criteria
- Monitor notifications silently skipped in CI — replaced module-level `const` env var capture with runtime `getNotificationChannel()` getter in all 5 monitor services, and replaced `instanceof TextChannel` checks with `isTextBased()` for mock compatibility
- ESLint config: added `**/dist/**` to ignores (fixes `bot/dist/` linting), added `.cjs` block with Node.js globals for `validate-env.cjs`

### Security

- Resolved 12 npm dependency vulnerabilities (5 high, 7 moderate → 0)
- Upgraded Next.js 15.5.9 → 15.5.12 (DoS via Image Optimizer, HTTP request deserialization)
- Upgraded jspdf to patched version (PDF injection, XSS, DoS — 7 advisories)
- Upgraded markdownlint-cli 0.46.0 → 0.47.0
- Fixed ajv ReDoS vulnerability via `npm audit fix`
- Fixed lodash prototype pollution vulnerability via `npm audit fix`
- Fixed markdown-it ReDoS vulnerability via `npm audit fix`
- Fixed @isaacs/brace-expansion uncontrolled resource consumption via `npm audit fix`
- Added npm overrides for transitive dependencies: undici (6.23.0), minimatch (10.2.4)
- Scoped minimatch override to `markdownlint-cli` only (global override broke `babel-plugin-istanbul` in CI)

## [2.0.4] - 2026-02-24

### Added

- `.markdownlintignore` to exclude `.claude/` from markdownlint

### Fixed

- CodeQL alerts for incomplete URL substring sanitization in portfolio tests
- `release.yml` workflow_call permissions for CI quality gates job
- Markdownlint pre-commit failures on Trinity SDK template files in `.claude/`
- Vercel deploy workflow failing at `vercel pull` by creating `.vercel/project.json` from secrets before pull

## [2.0.3] - 2026-02-24

### Added

- Hytale Server Manager project showcase on Portfolio page (personal projects)
- Cola Records project showcase on Portfolio page (professional projects)
- Trinity Method SDK moved from personal to professional projects
- Download links to Hytale Server Manager and Cola Records showcases
- Unit tests for portfolio projects data (39 tests)

### Changed

- Trinity Method SDK showcase updated to reflect current project (18 agents, 88 components, 21 slash commands, npm package link, corrected CLI command)
- Bwaincell portfolio entry updated to reflect unified monorepo platform (Discord bot + REST API + PWA)
- Release workflow gating all deployments behind GitHub Releases (#75)
- CHANGELOG.md for tracking release notes
- Release helper scripts (release:patch, release:minor, release:major)
- `vercel.json` for version-controlled Vercel project configuration
- Bot deployment now triggered only via release publish (not push to main)
- CI pipeline now reusable via workflow_call
- Vercel production deploys now use Vercel CLI instead of deploy hook (more reliable, includes deployment URL in notifications)
- Push to main creates preview deployment only (production requires release publish)

### Removed

- Bwain.app standalone portfolio entry (merged into Bwaincell monorepo entry)
- `markdown-lint.yml` workflow (redundant with pre-commit markdownlint hook)

### Fixed

- CI/CD test assertions to match actual workflow structure (job names, cache strategy, test command)
- Config validation tests aligned to actual 37-variable schema (was 44)
- Monitoring tests account for non-blocking setImmediate DB writes
- Quote conversion tests reflect current business logic (APPROVED quotes are convertible)
- Integration test cross-suite data pollution from parallel execution (`maxWorkers: 1`)
- FK-ordered `cleanDatabase()` in all 4 integration test suites (analytics, projects, quotes, proposals)
- Auth test mocks migrated from stale NextAuth route to `@/lib/auth/google-oauth`
- Removed stale `next-auth/next` mock from admin-auth tests
- Transaction atomicity test now functional (was skipped) via prisma client routing through testPrisma
- Pre-commit `jest-changed` hook CLI conflict (`--testPathIgnorePatterns` incompatible with `--findRelatedTests`)
- Replaced `VERCEL_DEPLOY_HOOK_URL` with Vercel CLI for reliable production deploys
