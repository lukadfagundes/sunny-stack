# ISSUES.md - sunny-stack

**Trinity Method v2.0.7 - Issue Intelligence System**
**Technology Stack**: Next.js 15.5.9, React 19, TypeScript 5.5, PostgreSQL, Prisma, Discord.js
**Framework**: Next.js (App Router)
**Last Updated**: 2026-02-25

---

## 🔴 ACTIVE ISSUES

### Critical (P0) - Immediate Action Required

```yaml
Issue_ID: SS-C001
Title: TypeScript Build Errors Suppressed
Component: Build System (next.config.js)
Impact: Type safety compromised, potential runtime errors not caught at build time
Status: ACTIVE
First_Seen: 2024-11-09
Last_Seen: 2026-01-07
Occurrences: Ongoing

Symptoms:
  - TypeScript errors ignored via `typescript.ignoreBuildErrors: true`
  - NextAuth v5 + Next.js App Router compatibility issues
  - Potential type mismatches not caught during development

Root_Cause: NextAuth v5 has compatibility issues with Next.js 15 App Router (particularly <Html> component errors)

Investigation_Path:
  1. Review NextAuth v5 documentation for App Router support
  2. Check for alternative authentication patterns
  3. Consider downgrading to NextAuth v4 or custom OAuth implementation
  4. Monitor NextAuth v5 releases for official fix

Solution:
  Short-term: Keep `ignoreBuildErrors: true` with TODO comment
  Long-term: Migrate to stable NextAuth v5 or implement custom Google OAuth

Prevention:
  - Monitor NextAuth GitHub issues for App Router compatibility
  - Test authentication flow regularly
  - Document authentication pattern thoroughly
```

### High Priority (P1) - Core Functionality

No active P1 issues at this time.

### Medium Priority (P2) - User Experience

No active P2 issues at this time.

### Low Priority (P3) - Enhancements

No active P3 issues at this time.

---

## ✅ RESOLVED ISSUES (2026-02-25)

### Pattern: GitHub Actions Reusable Workflow Permissions

**Resolved**: 2026-02-25
**Category**: CI/CD

**Problem**: When `release.yml` calls `ci.yml` via `workflow_call`, the caller's top-level `permissions` block restricts the callee. If the caller only declares `contents: write`, all other permissions default to `none` — even if `ci.yml` declares `actions: read, checks: write` in its own `permissions` block.

**Fix**: Add explicit `permissions` to the calling job that match what `ci.yml` needs:

```yaml
ci:
  permissions:
    contents: read
    actions: read
    checks: write
  uses: ./.github/workflows/ci.yml
```

### Pattern: CodeQL Incomplete URL Substring Sanitization

**Resolved**: 2026-02-25
**Category**: Security / Testing

**Problem**: CodeQL flags `.includes("github.com")` and `.includes("npmjs.com")` in test assertions as "Incomplete URL substring sanitization" (High severity). Substrings like `npmjs.com` could match `evil-npmjs.com`.

**Fix**: Use exact URL matching (`===`) instead of substring checks in test assertions.

---

## 📊 Next.js-SPECIFIC PATTERNS

### Common Next.js Issues

#### Pattern: App Router vs Pages Router Compatibility

**Frequency**: MEDIUM
**Impact**: Functionality
**Category**: Framework Migration

**Problem Description**:
Next.js 15 App Router introduces breaking changes from Pages Router. Some libraries and patterns built for Pages Router may not work correctly with App Router.

**Typical Symptoms**:

1. Authentication middleware not running on expected routes
2. Client components trying to use server-only APIs
3. Hydration mismatches between server and client

**Investigation Approach**:

```bash
# Check for Pages Router patterns in App Router
grep -r "getServerSideProps\|getStaticProps\|getInitialProps" app/

# Verify Server/Client Component boundaries
grep -r "'use client'" app/ | wc -l
grep -r "'use server'" app/ | wc -l

# Check middleware configuration
cat middleware.ts
```

**Known Solutions**:

```typescript
// App Router pattern: Server Components by default
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetch('https://api.example.com');
  return <div>{data.title}</div>;
}

// Client Component when needed
// app/components/InteractiveButton.tsx
'use client';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Prevention Measures**:

- Use `'use client'` directive only when necessary (interactivity, hooks, browser APIs)
- Keep data fetching in Server Components when possible
- Document Server/Client boundaries in architecture docs

**Related Issues**: [SS-C001]

---

#### Pattern: Discord.js Incompatibility with Serverless

**Frequency**: HIGH
**Impact**: Functionality
**Category**: Integration

**Problem Description**:
Discord.js requires persistent WebSocket connection for Gateway events, which is incompatible with Vercel serverless functions (stateless, cold starts).

**Typical Symptoms**:

1. Discord bot cannot maintain Gateway connection on Vercel
2. Event handlers not triggered (guild member add, message create)
3. Bot appears offline despite successful deployment

**Investigation Approach**:

```bash
# Check Discord bot deployment strategy
cat tsconfig.bot.json
cat docker-compose.yml | grep discord

# Verify bot is not bundled with Next.js
grep -A 5 "webpack:" next.config.js
```

**Known Solutions**:

```javascript
// next.config.js - Externalize Discord.js
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push(
      "discord.js",
      "@discordjs/ws",
      "zlib-sync",
      "bufferutil",
      "utf-8-validate",
    );
  }
  return config;
};

// Deploy bot separately (Raspberry Pi, Docker, or long-running server)
// bot/ directory with separate build: tsconfig.bot.json
```

**Prevention Measures**:

- Never attempt to run Discord bot Gateway in serverless functions
- Use Raspberry Pi, VM, or dedicated server for bot
- API-only interactions (slash commands via webhooks) CAN run on Vercel

**Related Issues**: None

---

#### Pattern: Prisma Client in Serverless Edge Functions

**Frequency**: MEDIUM
**Impact**: Performance/Functionality
**Category**: Database

**Problem Description**:
Prisma Client requires file system access and cannot run in Vercel Edge Runtime. Additionally, cold starts with Prisma can be slow without proper singleton pattern.

**Typical Symptoms**:

1. "Prisma Client could not locate the Query Engine" errors
2. Multiple Prisma Client instances created (development HMR)
3. Slow cold start times on serverless functions

**Investigation Approach**:

```bash
# Check Prisma singleton implementation
cat lib/db/prisma.ts

# Verify Prisma is not used in Edge Runtime
grep -r "export const runtime = 'edge'" app/api/

# Check DATABASE_URL configuration
grep DATABASE_URL .env
```

**Known Solutions**:

```typescript
// lib/db/prisma.ts - Singleton pattern (IMPLEMENTED)
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export { prisma };

// Connection pooling for serverless
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"
```

**Prevention Measures**:

- Always use singleton pattern for Prisma Client
- Add connection pooling to DATABASE_URL
- Monitor connection count on Raspberry Pi
- Use Neon/Supabase serverless Postgres if Pi becomes bottleneck

**Related Issues**: None

---

## 🌍 UNIVERSAL DEVELOPMENT PATTERNS

### State Management Issues

#### Pattern: React Context Re-renders

**Frequency**: MEDIUM
**Impact**: Performance
**Applicable To**: All React applications with Context API

**Problem**: Context value changes trigger re-renders of all consuming components, even if they don't use the changed value.

**Root Causes**:

1. Context value not memoized
2. Inline object/array creation in Context Provider
3. Too many values in single Context

**Universal Solution Pattern**:

```typescript
// app/providers.tsx - Memoized Context value (CHECK if implemented)
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
```

### Performance Optimization Patterns

#### Pattern: Large Bundle Size from Unnecessary Imports

**Frequency**: HIGH
**Impact**: User Experience (slower page load)

**Detection**:

```bash
# Analyze bundle size
ANALYZE=true npm run build

# Check optimized imports
grep "optimizePackageImports" next.config.js
```

**Solution**:

```javascript
// next.config.js - Tree-shakable imports (IMPLEMENTED)
experimental: {
  optimizePackageImports: ['lucide-react', 'framer-motion'],
}

// Import only needed icons
import { Menu, X } from 'lucide-react'; // Good
import * as Icons from 'lucide-react'; // Bad (imports all icons)
```

### Security Patterns

#### Pattern: Environment Variable Exposure

**Frequency**: MEDIUM
**Impact**: CRITICAL

**Prevention Strategy**:

```typescript
// NEVER expose server-side secrets to client
// next.config.js - Public env vars start with NEXT_PUBLIC_
process.env.NEXT_PUBLIC_SITE_URL // OK for client
process.env.DATABASE_URL // Server-only, never sent to client

// Verify no secrets in client bundle
grep -r "process.env." app/components/
grep -r "process.env." components/
```

---

## 🔬 TRINITY METHOD PATTERNS

### Investigation Protocol Issues

#### Pattern: Investigation Scope Creep

**Frequency**: MEDIUM
**Impact**: Development Velocity

**Problem**: Investigations expand beyond intended scope when discovering related issues.

**Solution**:

1. Set strict time boxes (30 min initial investigation)
2. Document tangential findings in ISSUES.md separately
3. Create follow-up investigations for related discoveries
4. Update To-do.md with new investigation tasks

### Knowledge Capture Issues

#### Pattern: Architecture Documentation Lag

**Frequency**: MEDIUM
**Impact**: Knowledge Reuse

**Problem**: Architecture changes made without updating ARCHITECTURE.md, leading to stale documentation.

**Solution**:

- Update ARCHITECTURE.md within same session as architecture changes
- Add ARCHITECTURE.md update to pre-commit checklist
- Use `/trinity-end` command to verify documentation sync

---

## 📈 ISSUE METRICS

### Pattern Recognition Statistics

```yaml
Total_Patterns_Identified: 8
Patterns_This_Month: 8 (initial baseline)
Most_Frequent_Pattern: Discord.js Serverless Incompatibility
Success_Rate: N/A (baseline)

By_Category:
  Framework: 2 (App Router, Edge Runtime)
  Integration: 1 (Discord.js)
  Performance: 2 (Context re-renders, Bundle size)
  Security: 1 (Env var exposure)
  Database: 1 (Prisma Client)
  Trinity_Method: 2 (Scope creep, Doc lag)
```

### Issue Resolution Metrics

```yaml
Average_Resolution_Time:
  P0_Critical: TBD (baseline)
  P1_High: TBD
  P2_Medium: TBD
  P3_Low: TBD

First_Time_Fix_Rate: TBD (baseline)
Regression_Rate: TBD
Pattern_Prevention_Rate: TBD
```

### Recurrence Tracking

| Issue Pattern           | First Seen | Last Seen  | Occurrences | Status                   |
| ----------------------- | ---------- | ---------- | ----------- | ------------------------ |
| TypeScript Build Errors | 2024-11-09 | 2026-01-07 | Ongoing     | ACTIVE                   |
| Discord.js Serverless   | 2024-09    | N/A        | 1           | RESOLVED (Pi deployment) |

---

## 🛠️ INVESTIGATION QUEUE

### Pending Investigations

1. **TypeScript Build Errors Resolution**
   - Scope: Research NextAuth v5 App Router compatibility
   - Estimated Time: 2 hours
   - Dependencies: NextAuth v5 stable release

2. **Performance Baseline Measurement**
   - Scope: Measure actual page load times, API response times
   - Estimated Time: 1 hour
   - Dependencies: None

3. **Test Coverage Analysis**
   - Scope: Run coverage report, identify untested components
   - Estimated Time: 30 minutes
   - Dependencies: None

### Completed Investigations (This Session)

- [x] Codebase Architecture Analysis - See: trinity/knowledge-base/ARCHITECTURE.md
- [x] Technology Stack Audit - See: trinity/knowledge-base/ARCHITECTURE.md

---

## 🔄 ISSUE LIFECYCLE

### Issue States

```mermaid
graph LR
    A[Discovered] --> B[Investigated]
    B --> C[Documented]
    C --> D[Solution Implemented]
    D --> E[Verified]
    E --> F[Pattern Extracted]
    F --> G[Closed]
```

### State Definitions

1. **Discovered**: Issue identified but not investigated
2. **Investigated**: Root cause analysis complete
3. **Documented**: Full documentation in ISSUES.md
4. **Solution Implemented**: Fix applied to codebase
5. **Verified**: Fix confirmed working
6. **Pattern Extracted**: Reusable pattern documented
7. **Closed**: Issue resolved and knowledge captured

---

## 📝 ISSUE TEMPLATE

```yaml
Issue_ID: SS-{{CATEGORY}}{{NUMBER}}
Title: { { DESCRIPTIVE_TITLE } }
Component: { { AFFECTED_COMPONENT } }
Framework_Specific: YES/NO
Impact: CRITICAL/HIGH/MEDIUM/LOW
Status: ACTIVE/INVESTIGATING/RESOLVED

Discovery:
  Date: { { DATE } }
  Discovered_By: { { METHOD/PERSON } }
  Session: { { SESSION_ID } }

Symptoms:
  - { { SYMPTOM_1 } }
  - { { SYMPTOM_2 } }

Root_Cause_Analysis:
  Investigation_Time: { { MINUTES } }
  Root_Cause: { { DESCRIPTION } }
  Contributing_Factors: [{ { LIST } }]

Solution:
  Implementation_Time: { { MINUTES } }
  Code_Changes: { { FILES_CHANGED } }
  Tests_Added: { { TEST_COUNT } }

Prevention:
  Pattern_Created: YES/NO
  Pattern_Location: trinity/patterns/{{PATTERN_FILE}}
  Guidelines_Updated: YES/NO

Metrics:
  Recurrence_Risk: HIGH/MEDIUM/LOW
  Similar_Issues_Prevented: { { COUNT } }
```

---

## 🎯 PREVENTION STRATEGIES

### Proactive Measures by Category

#### Performance Issues

1. Implement performance monitoring from start (Winston + Rollbar)
2. Set up automated performance testing (Playwright)
3. Regular bundle size analysis (Next.js bundle analyzer)

#### State Management Issues

1. Memoize Context values (useMemo)
2. Split large Contexts into smaller, focused ones
3. Use state management library if Context becomes complex

#### Security Issues

1. Input validation on all API boundaries (Zod schemas)
2. Never expose server secrets to client (env var naming)
3. Security headers configured (CSP, HSTS, etc.)

#### Integration Issues

1. Contract testing between components
2. Mock external dependencies in tests
3. Separate builds for incompatible services (Discord bot)

---

## 📊 WEEKLY ISSUE REVIEW

### Issues This Week

- **New Issues**: 1 (initial baseline)
- **Resolved Issues**: 0
- **Patterns Discovered**: 8 (initial baseline)
- **Investigations Completed**: 2 (Architecture, Tech Stack)

### Trending Patterns

1. TypeScript Build Errors - Ongoing (NextAuth v5 compatibility)

### Action Items

- [ ] Investigate TypeScript build errors resolution
- [ ] Measure performance baselines
- [ ] Run test coverage analysis

---

## 🔗 RELATED DOCUMENTS

- **[Technical-Debt.md](./Technical-Debt.md)**: Detailed debt tracking (TODO comments, test coverage)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System design and components
- **[Trinity.md](./Trinity.md)**: Methodology implementation
- **[To-do.md](./To-do.md)**: Pending fixes and improvements
- **Pattern Library**: trinity/patterns/ (future)

---

**Document Status**: Living Issue Intelligence System
**Update Frequency**: Real-time (as issues discovered) + session-based
**Maintained By**: Development team using Trinity Method
**Referenced By**: `/trinity-end` command for session updates
**Pattern Library**: Creates trinity/patterns/ files
**Last Updated**: 2026-02-25

---

_Issue tracking powered by Trinity Method v2.0.7_
_Continuous pattern recognition and prevention system_
