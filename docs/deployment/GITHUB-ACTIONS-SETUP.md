# GitHub Actions CI/CD Setup

Complete guide for setting up automated testing and deployment pipelines using GitHub Actions for Sunny Stack Portfolio.

---

## Overview

GitHub Actions provides CI/CD automation for:

- **Automated Testing:** Run Jest + Playwright tests on every PR
- **Type Checking:** Verify TypeScript compilation
- **Linting:** Run ESLint on all code
- **Vercel Deployment:** Automatic deployment to Vercel
- **Pi Deployment:** Manual deployment to Raspberry Pi (future automation)
- **Discord Notifications:** Status updates in Discord channels

---

## Architecture

```mermaid
graph TD
    A[Git Push] --> B{Which Branch?}
    B -->|main| C[Production Workflow]
    B -->|feature-*| D[Preview Workflow]
    B -->|hotfix-*| E[Hotfix Workflow]

    C --> F[Run Tests]
    F --> G{Tests Pass?}
    G -->|Yes| H[Deploy to Vercel Prod]
    G -->|No| I[Send Failure Notification]

    H --> J[Notify Success]

    D --> K[Run Tests]
    K --> L{Tests Pass?}
    L -->|Yes| M[Deploy Preview]
    L -->|No| N[Block Merge]

    E --> O[Run Critical Tests]
    O --> P[Deploy Production]
    P --> Q[Notify Team]
```

---

## Workflow Files

GitHub Actions workflows are stored in `.github/workflows/` directory:

```
.github/
└── workflows/
    ├── test.yml              # Automated testing on PR
    ├── deploy-vercel.yml     # Vercel deployment (handled by Vercel)
    ├── deploy-pi.yml         # Pi deployment (manual trigger)
    └── notify-discord.yml    # Discord notifications
```

---

## 1. Automated Testing Workflow

### File: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup environment
        run: |
          cp .env.example .env
          echo "DATABASE_URL=postgresql://testuser:testpass@localhost:5432/testdb" >> .env

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Run unit tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  e2e:
    runs-on: ubuntu-latest
    needs: test

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Setup environment
        run: |
          cp .env.example .env
          echo "DATABASE_URL=postgresql://testuser:testpass@localhost:5432/testdb" >> .env

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run type check
        run: npm run type-check
```

**What This Does:**

- Runs on every push to `main`/`develop` and all pull requests
- Spins up PostgreSQL test database
- Runs unit tests with coverage
- Runs E2E tests with Playwright
- Runs ESLint and TypeScript type checking
- Uploads coverage to Codecov
- Saves test artifacts on failure

---

## 2. Vercel Deployment (Automatic)

### Vercel Integration

Vercel automatically deploys on git push. No workflow file needed.

**Configuration:**

1. Connect repository to Vercel dashboard
2. Configure build settings:
   - **Framework:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm ci`

**Environment Variables:**
Set in Vercel dashboard under Settings → Environment Variables:

```bash
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
ADMIN_EMAIL=...
RESEND_API_KEY=...
ROLLBAR_ACCESS_TOKEN=...
BOT_API_SECRET=...
```

**Deployment Behavior:**

- Push to `main` → Production deployment
- Push to feature branch → Preview deployment
- Pull request → Preview deployment

---

## 3. Raspberry Pi Deployment (Manual)

### File: `.github/workflows/deploy-pi.yml`

```yaml
name: Deploy to Raspberry Pi

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy"
        required: true
        type: choice
        options:
          - production
          - staging

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH key
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.PI_SSH_PRIVATE_KEY }}

      - name: Add Pi to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.PI_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to Raspberry Pi
        run: |
          ssh ${{ secrets.PI_USER }}@${{ secrets.PI_HOST }} << 'EOF'
            cd ~/projects/sunny-stack
            git fetch origin
            git reset --hard origin/main
            docker compose stop discord-bot
            docker build -t sunny-stack-bot:latest -f Dockerfile .
            docker compose up -d
            docker compose logs --tail=50 discord-bot
          EOF

      - name: Wait for health check
        run: |
          sleep 10
          ssh ${{ secrets.PI_USER }}@${{ secrets.PI_HOST }} \
            "curl -f http://localhost:8080/health || exit 1"

      - name: Notify success
        if: success()
        run: echo "Deployment successful"

      - name: Notify failure
        if: failure()
        run: echo "Deployment failed"
```

**Usage:**

1. Go to Actions tab in GitHub
2. Select "Deploy to Raspberry Pi"
3. Click "Run workflow"
4. Select environment (production/staging)
5. Click "Run workflow"

---

## 4. Discord Notifications

### File: `.github/workflows/notify-discord.yml`

```yaml
name: Discord Notifications

on:
  workflow_run:
    workflows: ["Tests", "Deploy to Raspberry Pi"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest

    steps:
      - name: Send Discord notification
        uses: sarisia/actions-status-discord@v1
        if: always()
        with:
          webhook: ${{ secrets.DISCORD_WEBHOOK_URL }}
          status: ${{ job.status }}
          title: ${{ github.workflow }}
          description: |
            **Repository:** ${{ github.repository }}
            **Branch:** ${{ github.ref_name }}
            **Commit:** ${{ github.sha }}
            **Author:** ${{ github.actor }}
            **Status:** ${{ job.status }}
          color: |
            ${{ job.status == 'success' && '0x00ff00' || '0xff0000' }}
```

**What This Does:**

- Sends Discord notification after Tests or Deploy workflows complete
- Includes workflow status, branch, commit, and author
- Green for success, red for failure

---

## GitHub Secrets Setup

### Required Secrets

Set secrets in GitHub repository: Settings → Secrets and variables → Actions → New repository secret

#### For Testing

```bash
# No secrets needed - tests use in-memory database
```

#### For Pi Deployment

```bash
PI_HOST=192.168.1.100  # Pi IP address or hostname
PI_USER=pi             # SSH username
PI_SSH_PRIVATE_KEY=    # SSH private key (contents of ~/.ssh/id_ed25519)
```

#### For Discord Notifications

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Generating Secrets

#### SSH Key for Pi Deployment

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Copy public key to Pi
ssh-copy-id -i ~/.ssh/github-actions.pub pi@raspberrypi.local

# Display private key (copy this to GitHub secret)
cat ~/.ssh/github-actions

# Copy entire output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

#### Discord Webhook

```bash
# In Discord:
1. Go to Server Settings → Integrations → Webhooks
2. Click "New Webhook"
3. Name it "GitHub Actions"
4. Select #ci-cd channel (or appropriate channel)
5. Copy webhook URL
6. Paste into GitHub secret DISCORD_WEBHOOK_URL
```

---

## Workflow Triggers

### Automatic Triggers

```yaml
# Run on push to specific branches
on:
  push:
    branches: [main, develop]

# Run on pull request
on:
  pull_request:
    branches: [main]

# Run on schedule (cron)
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

# Run on new release
on:
  release:
    types: [published]
```

### Manual Triggers

```yaml
# Manual workflow dispatch
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment"
        required: true
        type: choice
        options:
          - production
          - staging
      reason:
        description: "Reason for deployment"
        required: false
```

---

## Advanced Workflows

### Conditional Deployment

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy only on main branch
        run: echo "Deploying..."
```

### Matrix Testing (Multiple Node Versions)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm test
```

### Caching Dependencies

```yaml
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: "22"
      cache: "npm"

  - run: npm ci # Uses cache automatically
```

### Deployment Rollback

```yaml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      commit:
        description: "Commit SHA to rollback to"
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout specific commit
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.commit }}

      - name: Deploy to Vercel
        run: vercel --prod --force
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Monitoring Workflows

### View Workflow Runs

```bash
# Via GitHub UI
https://github.com/[username]/sunny-stack/actions

# Via GitHub CLI
gh run list

# View specific run
gh run view [run-id]

# View logs
gh run view [run-id] --log
```

### Workflow Badges

Add to README.md:

```markdown
![Tests](https://github.com/[username]/sunny-stack/actions/workflows/test.yml/badge.svg)
![Deploy](https://github.com/[username]/sunny-stack/actions/workflows/deploy-pi.yml/badge.svg)
```

---

## Troubleshooting

### Tests Fail in CI but Pass Locally

**Common causes:**

1. **Environment variables missing**

   ```yaml
   # Add to workflow
   env:
     DATABASE_URL: postgresql://...
     NODE_ENV: test
   ```

2. **Timezone differences**

   ```yaml
   # Set timezone
   - name: Set timezone
     run: |
       sudo timedatectl set-timezone America/New_York
   ```

3. **Race conditions**
   ```javascript
   // Add delays or proper async/await
   await page.waitForSelector('[data-testid="element"]');
   ```

### SSH Connection Fails

**Check:**

```yaml
# Debug SSH connection
- name: Test SSH
  run: |
    ssh -v ${{ secrets.PI_USER }}@${{ secrets.PI_HOST }} "echo 'Connection successful'"
```

**Common issues:**

- Incorrect PI_HOST (use IP, not hostname)
- SSH key not added to Pi's `~/.ssh/authorized_keys`
- Firewall blocking SSH on Pi
- Known hosts mismatch

### Workflow Hangs or Timeouts

```yaml
# Add timeout to jobs
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15 # Default is 360 minutes

    steps:
      - name: Run tests
        run: npm test
        timeout-minutes: 10 # Per-step timeout
```

### Out of Disk Space

```yaml
# Clean up before build
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet
    sudo rm -rf /opt/ghc
    sudo rm -rf /usr/local/share/boost
    df -h
```

---

## Best Practices

### 1. Use Environment Secrets

```yaml
# ❌ Never hardcode secrets
env:
  API_KEY: sk-1234567890abcdef

# ✅ Use secrets
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### 2. Cache Dependencies

```yaml
# ✅ Cache npm dependencies
- uses: actions/setup-node@v4
  with:
    cache: "npm"

- run: npm ci # Faster than npm install
```

### 3. Run Tests in Parallel

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e

  # Both run in parallel
```

### 4. Use Job Dependencies

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  deploy:
    needs: test # Only runs if test succeeds
    runs-on: ubuntu-latest
    steps:
      - run: vercel --prod
```

### 5. Limit Workflow Scope

```yaml
# Only run on specific paths
on:
  push:
    paths:
      - 'src/**'
      - 'app/**'
      - 'package.json'

# Ignore paths
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '**.md'
```

---

## Security Considerations

### 1. Secrets Management

- Never log secrets
- Use GitHub secrets (encrypted)
- Rotate secrets regularly
- Limit secret access (environments)

### 2. Permissions

```yaml
# Limit GitHub token permissions
permissions:
  contents: read
  issues: write
  pull-requests: write
```

### 3. Third-Party Actions

```yaml
# ✅ Pin to specific commit SHA
- uses: actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab

# ⚠️ Avoid using latest
- uses: actions/checkout@latest
```

### 4. Branch Protection

Enable in GitHub repository settings:

- Require status checks before merging
- Require pull request reviews
- Require linear history
- Do not allow bypassing rules

---

## Cost Optimization

### 1. Limit Concurrent Jobs

```yaml
# In repository settings
Settings → Actions → General → Concurrent jobs: 1
```

### 2. Cancel Redundant Runs

```yaml
# Cancel in-progress runs on new push
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 3. Skip Unnecessary Workflows

```yaml
# Skip workflow if commit message contains [skip ci]
on:
  push:
    branches: [main]

jobs:
  test:
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
```

---

## Related Documentation

- **[Deployment Overview](DEPLOYMENT-OVERVIEW.md)** - Deployment architecture
- **[Pi Deployment](PI-DEPLOYMENT.md)** - Manual Pi deployment procedures
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common CI/CD issues

---

**Last Updated:** 2026-01-07
**GitHub Actions Version:** v4
**Maintained by:** Sunny Stack Development Team
