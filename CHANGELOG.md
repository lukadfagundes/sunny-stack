# Changelog

All notable changes to sunny-stack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
