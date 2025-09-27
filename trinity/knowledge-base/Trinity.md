# Sunny Stack Trinity Method Implementation

**Technology Stack**: TypeScript/React/Next.js
**Framework**: Next.js 15.0.0 with App Router
**Architecture**: Full Stack Web Application (JAMstack)
**Trinity Method Version**: v7.1
**Generated**: 2025-09-22

---

## PROJECT-SPECIFIC TRINITY PROTOCOLS

### Next.js-SPECIFIC INVESTIGATION PROCEDURES

#### Pre-Implementation Investigation Requirements

For Sunny Stack using Next.js, all investigations must include:

1. **Next.js App Router Analysis**
   - Current page/component structure and dependencies
   - Server/Client component boundaries verification
   - Route organization and dynamic routing patterns
   - Next.js-specific optimization checks (Image, Font, Bundle)

2. **Full Stack Architecture Considerations**
   - JAMstack pattern compliance (JavaScript, APIs, Markup)
   - Server-side vs client-side rendering decisions
   - API route security and rate limiting verification
   - Static generation vs dynamic rendering trade-offs

### Mobile-First Requirements (NEW)

**MANDATORY for all UI-related work orders:**

For Sunny Stack development, mobile-first testing and verification is required:

1. **Mobile Viewport Testing**
   - Test on device emulation (iPhone 12/13/14, Android devices)
   - Verify responsive breakpoints (320px, 768px, 1024px, 1440px)
   - Test landscape and portrait orientations
   - Validate touch target sizes (minimum 44px for interactive elements)

2. **Mobile Browser Compatibility**
   - iOS Safari (current and previous version)
   - Chrome Mobile (Android)
   - Samsung Internet (Android)
   - Firefox Mobile (where applicable)

3. **Mobile-Specific Technical Requirements**
   - Dynamic viewport height handling (100dvh vs 100vh)
   - Mobile performance impact assessment (< 3s initial load on 3G)
   - Touch interaction verification (tap, swipe, pinch-to-zoom disabled where appropriate)
   - Mobile-specific accessibility verification (screen reader compatibility)

4. **Mobile Testing Protocol**

   ```bash
   # Required mobile testing commands for Sunny Stack
   npm run dev                    # Start development server
   # Open Chrome DevTools
   # Switch to device emulation mode
   # Test on iPhone 12, iPad, Android devices
   # Verify all features work with touch interactions
   # Check Core Web Vitals on mobile emulation
   ```

5. **Mobile Performance Standards**
   - Mobile LCP < 2.5s (stricter than desktop)
   - Mobile FID < 100ms with touch interactions
   - Mobile CLS < 0.1 during scrolling and orientation changes
   - Mobile-specific bundle size optimization
   - Proper mobile image optimization with Next.js Image

### Sunny Stack PERFORMANCE STANDARDS

#### Technology-Specific Baselines

Based on Next.js/React/TypeScript stack, the following performance standards apply:

| Metric | Target | Critical Threshold | Next.js Specific |
|--------|--------|-------------------|------------------|
| Initial Load | <2000ms | >4000ms | Leverages Next.js SSG/SSR |
| Interaction Response | <100ms | >300ms | React state updates |
| Core Web Vitals LCP | <2.5s | >4.0s | Next.js Image optimization |
| Core Web Vitals FID | <100ms | >300ms | Next.js code splitting |
| Core Web Vitals CLS | <0.1 | >0.25 | Layout stability |
| Bundle Size | <500KB | >1MB | Next.js automatic optimization |

### JAMstack-SPECIFIC IMPLEMENTATION PATTERNS

#### Approved Patterns for Sunny Stack

```typescript
// Next.js App Router server component pattern
export default async function Page() {
  // Server-side data fetching
  const data = await fetch('...')

  return (
    <div>
      <StaticContent />
      <ClientComponent data={data} />
    </div>
  )
}

// Client component with proper state management
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()

  useEffect(() => {
    // Client-side only operations
  }, [])

  return <div>...</div>
}

// API route with validation and rate limiting
export async function POST(request: Request) {
  // Rate limiting check
  if (isRateLimited(clientIP)) {
    return NextResponse.json(error, { status: 429 })
  }

  // Input validation
  const validationResult = validateInput(data)
  if (!validationResult.isValid) {
    return NextResponse.json(errors, { status: 400 })
  }

  // Processing
  return NextResponse.json(result)
}
```

#### Anti-Patterns to Avoid

```typescript
// NEVER: Client-side API calls without proper error handling
fetch('/api/endpoint') // No error handling, no loading states

// NEVER: Mixing server and client code incorrectly
'use client'
export default function Component() {
  const serverData = await fetch() // Won't work in client component
}

// NEVER: Unvalidated API routes
export async function POST(request: Request) {
  const data = await request.json()
  // Direct processing without validation - SECURITY RISK
}

// NEVER: Blocking operations in render
export default function Component() {
  const heavyComputation = expensiveSync() // Blocks UI
  return <div>{heavyComputation}</div>
}
```

---

## Sunny Stack DEBUGGING REQUIREMENTS

### Mandatory Debug Implementation for Next.js

Every function in Sunny Stack must include appropriate error boundaries and logging:

```typescript
// Client Component Debug Pattern
'use client'
export function ClientComponent() {
  useEffect(() => {
    console.log('[DEBUG] Component mounted:', componentName)

    return () => {
      console.log('[DEBUG] Component unmounted:', componentName)
    }
  }, [])

  try {
    // Component logic
  } catch (error) {
    console.error('[ERROR] Component error:', error)
    // Error reporting
  }
}

// API Route Debug Pattern
export async function POST(request: Request) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)

  console.log(`[API DEBUG] ${request.method} request from ${clientIP}`)

  try {
    // API logic
    const result = await processRequest(data)

    console.log(`[API SUCCESS] Completed in ${Date.now() - startTime}ms`)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Server Component Debug Pattern
export default async function ServerComponent() {
  console.log('[SSR DEBUG] Server component rendering')

  try {
    const data = await fetchData()
    return <ComponentContent data={data} />
  } catch (error) {
    console.error('[SSR ERROR]', error)
    return <ErrorFallback />
  }
}
```

### Next.js-Specific Debug Points

- **Build Process**: Monitor Next.js build output for warnings
- **Runtime Errors**: Client-side error boundaries for React components
- **API Routes**: Server-side logging with request/response tracking
- **Performance**: Bundle analyzer and Core Web Vitals monitoring
- **Hydration**: Server/client mismatch detection
- **Image Optimization**: Next.js Image component performance metrics

---

## Sunny Stack TESTING STANDARDS

### Next.js Test Requirements

#### Unit Testing

```typescript
// Component unit test structure
import { render, screen } from '@testing-library/react'
import { Navigation } from '@/components/Navigation'

describe('Navigation Component', () => {
  it('renders navigation items correctly', () => {
    render(<Navigation />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })

  it('handles mobile menu toggle', () => {
    render(<Navigation />)

    const menuButton = screen.getByLabelText('Toggle menu')
    fireEvent.click(menuButton)

    expect(screen.getByTestId('mobile-menu')).toBeVisible()
  })
})
```

#### Integration Testing

```typescript
// API route integration test
import { POST } from '@/app/api/send-quote/route'

describe('/api/send-quote', () => {
  it('validates form data correctly', async () => {
    const request = new Request('http://localhost/api/send-quote', {
      method: 'POST',
      body: JSON.stringify(invalidData)
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.validationErrors).toBeDefined()
  })

  it('processes valid submissions', async () => {
    const request = new Request('http://localhost/api/send-quote', {
      method: 'POST',
      body: JSON.stringify(validData)
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })
})
```

### Coverage Requirements

- **Minimum coverage**: 80%
- **Critical path coverage**: 95%
- **React component coverage**: 85%
- **API route coverage**: 90%
- **Utility function coverage**: 95%

---

## CRISIS MANAGEMENT PROTOCOLS FOR Sunny Stack

### Next.js-Specific Crisis Indicators

1. **Build Failures**: Next.js build process failing
2. **Hydration Errors**: Server/client content mismatches
3. **API Route Errors**: More than 5% error rate
4. **Performance Degradation**: Core Web Vitals below thresholds
5. **Bundle Size Growth**: >20% increase without features
6. **Memory Leaks**: Client-side memory usage continuously growing

### Recovery Procedures

1. **Immediate Actions**
   - Stop all Sunny Stack development
   - Create crisis branch: `crisis/2025-09-22-[issue-name]`
   - Document current Next.js build state and errors
   - Capture performance metrics and error logs

2. **Next.js Specific Recovery**
   - **Build Issues**: Check Next.js config, dependencies, TypeScript errors
   - **Hydration Issues**: Verify server/client component boundaries
   - **Performance Issues**: Run bundle analyzer, check Core Web Vitals
   - **API Issues**: Check rate limiting, validation, external service status

3. **Trinity Method Crisis Protocol**
   - Complete investigation of root cause
   - Document all symptoms and attempted fixes
   - Create comprehensive fix with proper testing
   - Update knowledge base with prevention strategies

---

## Sunny Stack KNOWLEDGE MANAGEMENT

### Chat Log Structure

```markdown
# CHAT LOG: Sunny Stack - 2025-09-22 - SESSION_ID
## Technology Context
- Framework: Next.js 15.0.0 App Router
- Components Modified: [Navigation, Quote Forms, API Routes]
- Next.js Patterns Used: [Server Components, Client Components, API Routes]
- Performance Impact: [Bundle size, runtime performance]

## Investigations Conducted
[Sunny Stack specific investigations with Trinity Method]

## Next.js Patterns Discovered
[Reusable patterns for Next.js/React/TypeScript stack]

## Security Implementations
[CORS, rate limiting, input validation, CSP headers]
```

### Pattern Library for Sunny Stack

Location: `/trinity/knowledge-base/patterns/`

- **Authentication patterns**: Future implementation strategies
- **Form handling patterns**: Client validation + server validation
- **API security patterns**: Rate limiting, input sanitization, error handling
- **Performance patterns**: Image optimization, bundle splitting, caching
- **Next.js-specific optimizations**: SSG/SSR decisions, component boundaries

---

## CONTINUOUS IMPROVEMENT FOR Sunny Stack

### Metrics to Track

- **Core Web Vitals**: LCP, FID, CLS scores
- **Bundle Size**: Main bundle and chunk sizes
- **Build Performance**: Build time and optimization efficiency
- **API Performance**: Response times and error rates
- **User Experience**: Form completion rates, navigation patterns
- **Security Metrics**: Rate limiting effectiveness, validation coverage

### Review Schedule

- **Daily**: Console error check, build status verification
- **Weekly**: Performance review, Core Web Vitals monitoring
- **Sprint**: Pattern extraction, knowledge base updates
- **Monthly**: Methodology refinement, dependency updates

---

## TEAM INTEGRATION

### Sunny Stack Team Protocols

1. **New Developer Onboarding**
   - Trinity Method training for Next.js
   - Sunny Stack codebase walkthrough with architecture tour
   - Investigation template practice with real scenarios
   - Security and performance standards overview

2. **Code Review Requirements**
   - Trinity investigation documentation attached
   - Next.js best practices compliance verified
   - Debug implementation and error handling present
   - Performance impact assessment completed
   - Security validation for API routes

3. **Merge Request Template**

   ```markdown
   ## Trinity Method Compliance for Sunny Stack
   - [ ] Investigation completed and documented
   - [ ] Next.js patterns followed (component boundaries)
   - [ ] Debugging and error handling implemented
   - [ ] Tests passing (80% coverage minimum)
   - [ ] Performance verified (Core Web Vitals)
   - [ ] Security validated (input sanitization, rate limiting)
   - [ ] Zero console errors in development
   - [ ] TypeScript compilation successful
   ```

---

## QUICK REFERENCE COMMANDS FOR Sunny Stack

### Development Commands

```bash
# Start Sunny Stack development
npm run dev

# Run Next.js build (production)
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Production server
npm run start
```

### Trinity Method Commands

```bash
# Start investigation
"Begin Trinity Method investigation for Sunny Stack [feature/bug/performance issue]"

# Run crisis protocol
"Execute Next.js Crisis Protocol for Sunny Stack - [specific issue]"

# Generate pattern documentation
"Document Next.js pattern discovered in Sunny Stack for [specific use case]"

# Performance audit
"Conduct performance investigation for Sunny Stack with Core Web Vitals focus"
```

### Debugging Commands

```bash
# Bundle analysis
npm run build && npx @next/bundle-analyzer

# Performance monitoring
npm run build && npm run start -- --inspect

# Type checking with watch
npx tsc --noEmit --watch

# Console error monitoring
# Check browser console during development
```

---

## APPENDIX: Next.js SPECIFIC RESOURCES

### Documentation Links

- [Next.js 15 App Router Documentation](https://nextjs.org/docs/app)
- [Sunny Stack Architecture Guide](./ARCHITECTURE.md)
- [Trinity Method Universal Guide](../../trinity-method-source/MASTER-TRINITY-METHOD.md)
- [Next.js Performance Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Core Web Vitals Guide](https://web.dev/vitals/)

### Tool Configuration

- **TypeScript**: Strict mode enabled with path mapping
- **ESLint**: Next.js recommended configuration
- **Tailwind CSS**: JIT compilation with custom theme
- **Vercel Analytics**: Core Web Vitals monitoring (recommended)

### Security Configuration

- **Content Security Policy**: Comprehensive headers in next.config.js
- **CORS**: API route specific configuration
- **Rate Limiting**: Custom implementation with IP tracking
- **Input Validation**: Server-side sanitization and validation

---

**Trinity Method v7.1 - Customized for Sunny Stack**
**Generated for TypeScript/React/Next.js Stack with App Router**

**Remember: No updates without investigation. No changes without Trinity consensus. No shortcuts without consequences.**
