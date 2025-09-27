# GitHub Repository Configuration

## Required Manual Steps

### 1. Add Repository Topics

Go to your repository Settings → About → Topics and add:

- Language topics: javascript, typescript, nextjs, react
- Framework topics: tailwindcss, framer-motion
- Purpose topics: ci-cd, automation, testing, portfolio

### 2. Configure Secrets

Go to Settings → Secrets and variables → Actions and add:

| Secret Name     | Description                           | Required |
| --------------- | ------------------------------------- | -------- |
| DISCORD_WEBHOOK | Discord webhook URL for notifications | Optional |
| GIST_SECRET     | GitHub PAT for gist creation          | Optional |
| CODECOV_TOKEN   | Codecov.io token                      | Optional |

### 3. Enable GitHub Pages (if needed)

Settings → Pages → Source: Deploy from branch → Branch: gh-pages

### 4. Configure Branch Protection

Settings → Branches → Add rule:

- Branch name pattern: main
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators

### 5. Verify Workflows

After pushing, check the Actions tab to ensure workflows are running correctly.

## Available Workflows

### 1. CI/CD Pipeline (`ci.yml`)

- Runs on: Push to main, Pull requests
- Features:
  - Multi-platform testing (Ubuntu, Windows, macOS)
  - Node.js 18.x and 20.x testing
  - TypeScript compilation
  - ESLint checks
  - Jest unit tests with coverage
  - Playwright E2E tests
  - Bundle analysis
  - Performance auditing
  - Security scanning

### 2. CodeQL Security Analysis (`codeql.yml`)

- Runs on: Push to main, Pull requests, weekly schedule
- Features:
  - Static code analysis
  - Security vulnerability detection
  - Automatic dependency updates

### 3. Dashboard Deployment (`deploy-dashboard.yml`)

- Runs on: Manual trigger
- Features:
  - Production deployment
  - Build verification

## Next.js Specific Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Resend API Key (for contact form)
RESEND_API_KEY=your_resend_api_key_here

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Feature flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Build Commands

The CI/CD pipeline uses these commands:

- `npm run build` - Production build
- `npm run lint` - ESLint checks
- `npm run test` - Jest unit tests
- `npm run test:e2e` - Playwright E2E tests
- `npm run type-check` - TypeScript verification

## Troubleshooting

### Common Issues

1. **Build failures**: Check Node.js version compatibility
2. **Test failures**: Ensure all dependencies are installed
3. **Lint errors**: Run `npm run lint:fix` locally first
4. **TypeScript errors**: Run `npm run type-check` locally

### Pre-commit Hooks

The repository includes pre-commit hooks that run:

- ESLint
- Prettier
- Trailing whitespace removal
- JSON/YAML validation
- Security checks

To bypass hooks temporarily (not recommended):

```bash
git commit --no-verify -m "your message"
```

## Performance Monitoring

The CI/CD pipeline includes:

- Bundle size analysis
- Lighthouse performance audits
- Core Web Vitals tracking
- Memory usage monitoring

Performance budgets are enforced automatically.
