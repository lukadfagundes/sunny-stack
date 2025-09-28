# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment.

## Technology Stack Detection

- **Framework**: Next.js 15.0.0 with React 19.0.0
- **Language**: TypeScript 5.5.0
- **Module System**: ES Modules (`"type": "module"`)
- **Package Manager**: npm
- **Node Version**: >=18.17.0

## Workflows

### Main CI Pipeline (.github/workflows/ci.yml)

- **Triggers**: Push to main/dev/develop branches and pull requests
- **Features**:
  - TypeScript type checking
  - ESLint linting
  - Jest test execution (when configured)
  - Build validation
  - Performance metrics generation
  - Merge gate enforcement (80% threshold)
- **Permissions**: Full write access for artifacts and reports

### Security Scanning

#### CodeQL Analysis (.github/workflows/codeql.yml)

- **Language**: JavaScript/TypeScript
- **Schedule**: Weekly on Sunday at midnight UTC
- **Features**:
  - Vulnerability detection
  - Code quality analysis
  - Security alerts generation
- **Permissions**: Security events write access

#### OWASP Security Scan (.github/workflows/security.yml)

- **Features**:
  - Dependency vulnerability checking
  - OWASP Top 10 compliance
  - Secret scanning
  - License compliance checking
- **Schedule**: Daily and on push events

### Deployment Workflows

#### GitHub Pages Deployment (.github/workflows/deploy-pages.yml)

- **Trigger**: Push to main branch
- **Build Process**:
  - Runs `npm run export` for Next.js static export
  - Falls back to `npm run build` if export script not available
  - Detects output directory (out/ for Next.js 13+)
- **Deployment Method**: Peaceiris GitHub Pages action
- **Target Branch**: gh-pages
- **Permissions**:
  - `contents: write` - For git operations
  - `pages: write` - For GitHub Pages
  - `id-token: write` - For OIDC authentication

#### Trinity Dashboard Deployment (.github/workflows/deploy-dashboard.yml)

- **Trigger**: Push to main branch
- **Purpose**: Deploy Trinity Method dashboard
- **Build Directory**: ./dist

### Code Quality

#### Markdown Linting (.github/workflows/markdown-lint.yml)

- **Triggers**: Push and pull requests to main/dev branches
- **Tool**: markdownlint-cli
- **Exclusions**: node_modules, .git directories
- **Artifacts**: Uploads lint results on failure

## Configuration

### Permissions

All workflows are configured with comprehensive permissions:

- `contents: write` - For artifact uploads and deployments
- `pages: write` - For GitHub Pages deployment
- `security-events: write` - For security scanning results
- `id-token: write` - For OIDC authentication
- `actions: read` - For workflow access
- `checks: write` - For status checks

### Module System

This project uses ES modules. All scripts in `.github/scripts/` use `import` syntax.

## Scripts

### generate-dashboard-data.js

- **Type**: ES Module
- **Purpose**: Generate performance and quality metrics
- **Location**: `.github/scripts/generate-dashboard-data.js`
- **Usage**: Automatically executed during CI pipeline

## Troubleshooting

### Common Issues

1. **"require is not defined" error**
   - Project uses ES modules (`"type": "module"` in package.json)
   - All scripts use `import` syntax instead of `require`

2. **Permission denied during deployment**
   - All workflows have `contents: write` permission configured
   - Verify repository settings allow Actions to create and approve pull requests

3. **Next.js export issues**
   - Ensure `next.config.js` has proper export configuration
   - For static export, use `npm run export` command
   - Output directory will be `out/` for Next.js 13+

4. **Security scan timeouts**
   - First run of security tools may take longer
   - Configured with `continue-on-error: true` for non-critical scans

## Repository Setup Requirements

### For GitHub Pages Deployment

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions" or "Deploy from a branch" (gh-pages)
3. Configure custom domain if needed (set CNAME variable)

### Required Secrets

None required for basic operation. Optional secrets:

- Custom deployment tokens if needed
- API keys for external services

### Environment Variables

- `NODE_VERSION`: 18 (defined in workflows)
- `MERGE_THRESHOLD`: 80 (quality gate percentage)
- `CACHE_VERSION`: v1 (for cache invalidation)

## Maintenance

### Regular Updates

- Review and update dependencies monthly
- Monitor security scan results weekly
- Keep workflow actions updated to latest versions
- Review and adjust merge thresholds as needed

### Performance Monitoring

- Check build times and optimize if >5 minutes
- Monitor artifact sizes
- Review test coverage reports

### Security

- Address critical vulnerabilities immediately
- Review CodeQL alerts weekly
- Update dependencies with security patches
- Audit npm packages regularly

## Trinity Method Integration

This CI/CD infrastructure follows Trinity Method principles:

- Comprehensive quality gates
- Security-first approach
- Performance monitoring
- Documentation-driven development
- Cross-session knowledge retention

## Support

For issues or questions:

- Check workflow run logs in Actions tab
- Review this documentation
- Consult Trinity Method documentation in `trinity/` directory
- Open an issue with [CI/CD] tag

---

Generated by Trinity Method CI/CD Deployment
Version: 2.0 - Enhanced with Production Lessons
Last Updated: 2025-09-27
