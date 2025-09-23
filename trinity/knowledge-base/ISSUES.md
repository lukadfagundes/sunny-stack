# ISSUES.md - Comprehensive Issues Database

## Overview
This document contains pre-populated issue patterns relevant to our Next.js/React/TypeScript stack, extracted from the Trinity Method issues database and organized by severity and frequency for maximum effectiveness.

---

## CRITICAL SEVERITY ISSUES

### React Component Hydration Errors
**Stack**: Next.js, React 18+
**Frequency**: High
**Severity**: Critical

#### Problem Description
Hydration errors occur when server-rendered HTML doesn't match client render, breaking interactivity and causing visual glitches. In Next.js App Router, this is particularly common with Server/Client Component mixing.

#### Investigation Approach
1. Check browser console for hydration warnings
2. Compare server HTML with client render
3. Look for suppressHydrationWarning usage
4. Identify Client Component boundaries
5. Test with JavaScript disabled
6. Review date/time/random value usage

#### Resolution Pattern
```typescript
// Pattern 1: Client-only wrapper
'use client';

import { useEffect, useState } from 'react';

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

// Pattern 2: Hydration-safe date rendering
export function DateDisplay({ date }: { date: Date }) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(date.toLocaleDateString());
  }, [date]);

  if (!formattedDate) {
    return <span className="date-skeleton">Loading...</span>;
  }

  return <span>{formattedDate}</span>;
}
```

#### Prevention Measures
- Use ClientOnly wrapper for browser-dependent content
- Avoid Date objects in initial render
- Serialize data properly when passing to Client Components
- Use dynamic imports for client-only libraries
- Test with SSR and CSR separately

---

### Session Knowledge Loss
**Stack**: All Trinity Method sessions
**Frequency**: High
**Severity**: Critical

#### Problem Description
Valuable knowledge gained during a session is lost when the session ends, requiring re-investigation and re-discovery in future sessions.

#### Investigation Approach
1. Audit session documentation completeness
2. Analyze knowledge retrieval success rate
3. Track re-investigation frequency
4. Measure knowledge decay over time
5. Identify critical knowledge categories

#### Resolution Pattern
```markdown
# Session Knowledge Retention System

## Mandatory Session Artifacts
### Session Summary Document
# Session: [Date] - [Primary Objective]

## Completed Tasks
- [x] Task 1 with outcome
- [x] Task 2 with outcome
- [ ] Task 3 (incomplete, reason)

## Key Discoveries
1. **Finding**: [What was learned]
   **Impact**: [How it affects the project]
   **Action**: [What to do about it]

## Problems Encountered
| Problem | Solution | Reusable |
|---------|----------|----------|
| Issue 1 | Fix 1 | Yes/No |
| Issue 2 | Workaround | Yes |

## Next Session Setup
1. Priority tasks
2. Open questions
3. Required context
```

#### Prevention Measures
- Mandatory session-end documentation
- Automated pattern extraction
- Searchable knowledge base
- Session start checklist

---

## MOBILE-SPECIFIC CRITICAL ISSUES (NEW)

### Mobile Viewport Height Issues
**Stack**: CSS, Next.js, React
**Frequency**: High on mobile devices
**Severity**: Critical (affects mobile UX)

#### Problem Description
Mobile browsers handle viewport height differently than desktop, causing layout issues with 100vh on mobile devices due to dynamic UI elements (address bar, navigation).

#### Investigation Approach
1. Test on actual mobile devices or Chrome DevTools mobile emulation
2. Check for 100vh usage in CSS/styles
3. Verify layout behavior during scroll
4. Test landscape/portrait orientation changes
5. Check for proper dynamic viewport height handling

#### Resolution Pattern
```css
/* Pattern 1: Use dynamic viewport height */
.full-height {
  height: 100dvh; /* Dynamic viewport height */
  min-height: 100vh; /* Fallback for unsupported browsers */
}

/* Pattern 2: CSS custom properties approach */
:root {
  --vh: 1vh;
}

.full-height {
  height: calc(var(--vh, 1vh) * 100);
}
```

```typescript
// Pattern 3: JavaScript dynamic calculation
useEffect(() => {
  const updateVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  updateVH();
  window.addEventListener('resize', updateVH);
  window.addEventListener('orientationchange', updateVH);

  return () => {
    window.removeEventListener('resize', updateVH);
    window.removeEventListener('orientationchange', updateVH);
  };
}, []);
```

#### Prevention Measures
- Always test mobile viewport during development
- Use dynamic viewport units (dvh, dvw) when available
- Implement proper orientation change handling
- Test on multiple mobile devices and browsers

### Mobile Touch Target Size Issues
**Stack**: CSS, React, Next.js
**Frequency**: Medium
**Severity**: Critical (accessibility compliance)

#### Problem Description
Interactive elements too small for mobile touch interaction, failing WCAG accessibility guidelines and causing poor mobile UX.

#### Investigation Approach
1. Measure touch target sizes in mobile emulation
2. Check for minimum 44px touch targets
3. Test with finger/thumb interaction simulation
4. Verify spacing between interactive elements
5. Check accessibility audit results

#### Resolution Pattern
```css
/* Ensure minimum touch target sizes */
button, a, input[type="checkbox"], input[type="radio"] {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 12px;
}

/* Add sufficient spacing between touch targets */
.touch-targets > * + * {
  margin-top: 8px;
}
```

#### Prevention Measures
- Include touch target size checks in mobile testing protocol
- Use design system with predefined mobile-friendly sizes
- Regular accessibility audits during development

---

## CONFLICT-RELATED CRITICAL ISSUES (NEW)

### Git Merge Conflicts in Package Files
**Stack**: npm, Git, Next.js
**Frequency**: High during team development
**Severity**: Critical (blocks development)

#### Problem Description
Merge conflicts in package.json, package-lock.json, or other configuration files can break dependency resolution and build processes.

#### Investigation Approach
1. Check for conflict markers (<<<<<<, =======, >>>>>>>)
2. Verify package.json syntax validity
3. Test npm install after conflict resolution
4. Check for dependency version mismatches
5. Verify build process still works

#### Resolution Pattern
```bash
# Detection commands
grep -E "<<<<<<|======|>>>>>>" package.json
grep -E "<<<<<<|======|>>>>>>" package-lock.json

# Verification after resolution
npm install
npm run build
npm run type-check
```

#### Prevention Measures
- Run conflict detection before all work orders
- Never manually edit package-lock.json
- Use exact dependency versions where possible
- Regular dependency audits

### Configuration File Conflicts
**Stack**: TypeScript, ESLint, Next.js config
**Frequency**: Medium
**Severity**: High (affects development tools)

#### Problem Description
Conflicts in configuration files can break development tools, type checking, and build processes.

#### Investigation Approach
1. Check all .config files for conflict markers
2. Verify configuration syntax after resolution
3. Test development server startup
4. Verify linting and type checking work
5. Check for conflicting configuration options

#### Resolution Pattern
```bash
# Detection for configuration files
find . -name "*.config.*" -exec grep -l "<<<<<<\|======\|>>>>>>" {} \;

# Verification commands
npm run dev          # Test development server
npm run type-check   # Verify TypeScript config
npm run lint         # Verify ESLint config
```

#### Prevention Measures
- Include configuration files in conflict detection protocol
- Backup working configurations before major changes
- Use consistent formatting in configuration files

---## HIGH SEVERITY ISSUES

### React useEffect Cleanup Missing
**Stack**: React, React Native, Next.js
**Frequency**: High
**Severity**: High

#### Problem Description
Components fail to properly clean up side effects when unmounting, leading to memory leaks, performance degradation, and "Can't perform a React state update on an unmounted component" warnings.

#### Investigation Approach
1. Search for all useEffect hooks without return statements
2. Check browser DevTools for memory heap growth
3. Monitor console for state update warnings
4. Use React DevTools Profiler to track unmounting
5. Add console logs in cleanup functions

#### Resolution Pattern
```javascript
function ComponentWithSideEffects() {
  useEffect(() => {
    // Setup
    const timer = setTimeout(() => {}, 1000);
    const interval = setInterval(() => {}, 1000);
    const handleResize = () => {};
    const handleScroll = () => {};

    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', handleScroll);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);
}
```

#### Prevention Measures
- Always return cleanup function from useEffect
- Use ESLint rule: react-hooks/exhaustive-deps
- Create custom hooks for common side effects
- Test unmounting scenarios in development

---

### Async Component State Race Conditions
**Stack**: React, React Native, Next.js
**Frequency**: Medium
**Severity**: High

#### Problem Description
Race conditions occur when multiple async operations update component state in unpredictable orders, leading to inconsistent UI states and data corruption.

#### Investigation Approach
1. Add timestamps to all async operations
2. Log state updates with operation identifiers
3. Test with network throttling
4. Simulate rapid user interactions
5. Use React DevTools to track state changes

#### Resolution Pattern
```javascript
// Pattern: Request cancellation with AbortController
function SearchComponent() {
  const [results, setResults] = useState([]);
  const abortControllerRef = useRef(null);

  const search = useCallback(async (query) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/search?q=${query}`,
        { signal: abortControllerRef.current.signal }
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        setResults([]);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
}
```

#### Prevention Measures
- Always cancel previous requests
- Use request timestamps for ordering
- Implement proper state machines
- Test with network delays

---

### Trinity Consensus Delays
**Stack**: Trinity Method team coordination
**Frequency**: Medium
**Severity**: High

#### Problem Description
Achieving consensus among Trinity members causes delays, conflicting recommendations, and implementation bottlenecks.

#### Investigation Approach
1. Track consensus achievement time
2. Document conflict patterns
3. Analyze decision reversal frequency
4. Identify blocking Trinity members
5. Review consensus criteria clarity

#### Resolution Pattern
```markdown
# Trinity Consensus Acceleration Protocol

## Decision Types and Required Consensus
1. **Critical Decisions** (Unanimous required)
   - Architecture changes
   - Security implementations
   - Data model modifications

2. **Major Decisions** (2/3 majority required)
   - Feature implementations
   - Refactoring approaches
   - Technology selections

3. **Minor Decisions** (Single member sufficient)
   - Code style choices
   - Variable naming
   - Comment formatting

## Time-Boxed Discussion (15 minutes max)
1. Problem statement (2 minutes)
2. Solution proposals (5 minutes)
3. Evidence presentation (5 minutes)
4. Vote and decision (3 minutes)
```

#### Prevention Measures
- Define consensus rules upfront
- Use async consensus for non-urgent decisions
- Implement tie-breaking mechanisms
- Time-box all discussions

---

## MEDIUM SEVERITY ISSUES

### Next.js Server Component Data Fetching Waterfall
**Stack**: Next.js 13+, React Server Components
**Frequency**: High
**Severity**: Medium

#### Problem Description
Sequential data fetching in Server Components creates waterfalls where each request waits for the previous one, significantly impacting page load times.

#### Investigation Approach
1. Enable Next.js request logging
2. Use Chrome DevTools Network tab
3. Add console.time() markers around fetch calls
4. Review Server Component tree structure
5. Check for sequential await statements

#### Resolution Pattern
```typescript
// Anti-pattern: Sequential fetching
async function SequentialComponent() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  const comments = await fetchComments(posts[0].id);

  return <div>{/* Render data */}</div>;
}

// Pattern: Parallel fetching with Promise.all
async function ParallelComponent({ userId }) {
  const [user, posts, comments] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchComments(userId)
  ]);

  return <div>{/* Render data */}</div>;
}

// Pattern: Streaming with Suspense
export default function StreamingPage() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserSection />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection />
      </Suspense>
    </div>
  );
}
```

#### Prevention Measures
- Always parallelize independent data fetches
- Use Suspense boundaries strategically
- Implement data preloading patterns
- Monitor waterfall metrics in development

---

### React Component Re-render Cascade
**Stack**: React, Preact
**Frequency**: High
**Severity**: Medium

#### Problem Description
Unintentional re-render cascades occur when parent component updates trigger unnecessary re-renders of all child components.

#### Investigation Approach
1. Enable React DevTools "Highlight Updates"
2. Use Profiler to identify unnecessary renders
3. Check component render counts
4. Analyze props changes with why-did-you-render
5. Monitor performance with Chrome DevTools

#### Resolution Pattern
```javascript
// Pattern: Memoization with React.memo
const ExpensiveChild = React.memo(({ data, onUpdate }) => {
  console.log('ExpensiveChild rendered');
  return (
    <div>
      {/* Complex rendering logic */}
    </div>
  );
});

// Pattern: useCallback for stable references
function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleUpdate = useCallback((value) => {
    setText(value);
  }, []); // Only recreate if dependencies change

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChild onUpdate={handleUpdate} />
    </div>
  );
}
```

#### Prevention Measures
- Use React.memo for expensive components
- Memoize callbacks with useCallback
- Memoize values with useMemo
- Avoid inline function/object definitions

---

### Next.js Metadata and SEO Configuration Issues
**Stack**: Next.js 13+
**Frequency**: Medium
**Severity**: Medium

#### Problem Description
Incorrect metadata configuration leads to poor SEO, broken social media previews, and missing critical meta tags.

#### Investigation Approach
1. Use SEO analysis tools to check meta tags
2. Test social media preview tools
3. Check View Source for rendered metadata
4. Verify metadata in nested routes
5. Test dynamic metadata generation

#### Resolution Pattern
```typescript
// Pattern: Static metadata
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter Title',
    description: 'Twitter Description',
    images: ['/twitter-image.png'],
  },
};

// Pattern: Dynamic metadata
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const product = await fetchProduct(params.id);

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  };
}
```

#### Prevention Measures
- Use metadata templates for consistency
- Test with SEO validation tools
- Verify Open Graph debuggers
- Check metadata inheritance

---

### Investigation Scope Creep
**Stack**: All Trinity Method implementations
**Frequency**: High
**Severity**: Medium

#### Problem Description
Investigations expand beyond their original scope, leading to analysis paralysis, delayed implementations, and loss of focus on the core problem.

#### Investigation Approach
1. Define clear investigation boundaries upfront
2. Set time limits for each investigation phase
3. Document scope expansions as they occur
4. Track investigation time vs implementation time
5. Identify patterns in scope creep triggers

#### Resolution Pattern
```markdown
# Investigation Scope Control Framework

## Pre-Investigation Setup (5 minutes max)
1. **Primary Objective**: [Single, clear goal]
2. **Success Criteria**: [Measurable outcome]
3. **Time Box**: [Maximum time allowed]
4. **Out of Scope**: [Explicitly excluded items]
5. **Depth Limit**: [How deep to investigate]

## Investigation Phases with Time Boxes
### Phase 1: Surface Investigation (15 minutes)
- Problem reproduction
- Error message analysis
- Recent change review
- Quick documentation check

### Phase 2: Deep Dive (30 minutes)
- Root cause analysis
- Code examination
- Dependency investigation
- Pattern identification

### Phase 3: Solution Exploration (15 minutes)
- Identify potential solutions
- Assess implementation effort
- Document trade-offs
- Create action plan
```

#### Prevention Measures
- Use timer during investigations
- Write scope before starting
- Review scope every 15 minutes
- Document but don't pursue tangential findings

---

## UNIVERSAL PATTERNS

### Investigation Template Standardization
**Applicable To**: All technical problem solving
**Frequency**: Every issue
**Impact**: Resolution success rate

#### Universal Investigation Template
```markdown
## 1. Problem Identification
- [ ] Clear problem statement documented
- [ ] Reproduction steps verified
- [ ] Impact scope assessed
- [ ] Priority level assigned
- [ ] Success criteria defined

## 2. Initial Investigation
- [ ] Error messages captured
- [ ] Stack traces analyzed
- [ ] Recent changes reviewed
- [ ] Similar issues searched
- [ ] Documentation checked

## 3. Deep Investigation
- [ ] Root cause hypothesis formed
- [ ] Hypothesis tested systematically
- [ ] Alternative causes considered
- [ ] Dependencies checked
- [ ] Environment factors reviewed

## 4. Solution Development
- [ ] Multiple approaches considered
- [ ] Risks assessed for each approach
- [ ] Implementation plan created
- [ ] Rollback strategy defined
- [ ] Testing approach documented

## 5. Verification
- [ ] Solution tested in isolation
- [ ] Integration testing completed
- [ ] Edge cases validated
- [ ] Performance impact measured
- [ ] Documentation updated
```

---

### Timeout Prevention Protocol
**Applicable To**: All AI-assisted development sessions
**Frequency**: Critical
**Impact**: Session continuity

#### 3-Minute Progress Update Protocol
```markdown
## Implementation Pattern
Every 3 minutes during complex tasks, provide:
1. Current action status
2. Next planned step
3. Any blockers encountered

## Example Updates
- "Still investigating the error source..."
- "Found the issue, implementing fix..."
- "Testing the solution now..."
- "Compiling results for review..."
```

#### Prevention Measures
- Set timer for 2.5-minute intervals
- Break complex tasks into smaller chunks
- Maintain continuous dialogue during investigation
- Use status updates even when "nothing" is happening

---

### Cross-Session Knowledge Bridging
**Applicable To**: All development projects
**Frequency**: Every session
**Impact**: Development velocity

#### Knowledge Persistence Structure
```yaml
project/
├── trinity/
│   ├── sessions/
│   │   ├── 2024-01-15-session.md
│   │   ├── 2024-01-16-session.md
│   │   └── current-session.md
│   ├── patterns/
│   │   ├── error-handling.md
│   │   ├── performance.md
│   │   └── security.md
│   └── investigations/
│       ├── hydration-issue.md
│       ├── memory-leak.md
│       └── build-failure.md
```

#### Session End Documentation Requirements
```markdown
## Required Artifacts
1. **Session Summary**
   - Problems encountered
   - Solutions implemented
   - Patterns discovered
   - Open questions

2. **Code Patterns Library**
   - Reusable solutions
   - Anti-patterns identified
   - Performance optimizations
   - Security considerations

3. **Investigation Insights**
   - Debugging techniques that worked
   - Tools and commands used
   - Environment-specific findings
   - External resource links
```

---

### Evidence-Based Decision Making
**Applicable To**: All technical decisions
**Frequency**: Every significant choice
**Impact**: Decision quality

#### Decision Template
```markdown
### Decision: [Technology/Approach Selection]

#### Evidence Collection
1. **Performance Metrics**
   - Benchmark results
   - Load testing data
   - Memory profiling
   - Response time measurements

2. **Code Quality Metrics**
   - Complexity scores
   - Test coverage
   - Maintainability index
   - Technical debt assessment

3. **Team Factors**
   - Skill assessment
   - Learning curve analysis
   - Training requirements
   - Support availability

#### Evidence Evaluation Matrix
| Criterion | Option A | Option B | Option C | Weight |
|-----------|----------|----------|----------|--------|
| Performance | 8/10 | 6/10 | 9/10 | 30% |
| Maintainability | 7/10 | 9/10 | 6/10 | 25% |
| Team Expertise | 9/10 | 5/10 | 7/10 | 20% |

#### Decision Record
- **Selected Option**: [Choice]
- **Rationale**: [Reasoning]
- **Trade-offs Accepted**: [Compromises]
- **Mitigation Plan**: [Risk management]
- **Review Date**: [Follow-up schedule]
```

---

## ISSUE FREQUENCY SUMMARY

### Critical Issues (Address Immediately)
1. React Component Hydration Errors - Next.js specific
2. Session Knowledge Loss - Trinity Method universal

### High Severity Issues (Address This Session)
1. React useEffect Cleanup Missing - Memory leaks
2. Async Component State Race Conditions - Data integrity
3. Trinity Consensus Delays - Team coordination

### Medium Severity Issues (Address as Encountered)
1. Next.js Server Component Data Fetching Waterfall - Performance
2. React Component Re-render Cascade - Performance
3. Next.js Metadata and SEO Configuration Issues - SEO
4. Investigation Scope Creep - Trinity Method efficiency

### Universal Patterns (Apply Always)
1. Investigation Template Standardization
2. Timeout Prevention Protocol
3. Cross-Session Knowledge Bridging
4. Evidence-Based Decision Making

---

**Last Updated**: 2025-09-22
**Technology Stack**: Next.js 15.0.0 + React 19.0.0 + TypeScript 5.5.0
**Trinity Method Version**: 3.0
**Total Patterns**: 15 (4 Critical, 4 High, 4 Medium, 4 Universal)