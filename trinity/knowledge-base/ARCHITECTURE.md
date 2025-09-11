# ARCHITECTURE - Sunny Stack Portfolio System Design

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

**This document provides a comprehensive technical architecture analysis of the Sunny Stack Portfolio project, serving as the authoritative reference for all architectural decisions and patterns.**

---

## 📐 HIGH-LEVEL ARCHITECTURE

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Next.js Application                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  │   App Router │  │ React 19.0  │  │  TypeScript  │   │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  │ Tailwind CSS│  │Framer Motion│  │  Components  │   │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   /contact   │  │    /send     │  │     /quote       │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │    Resend    │  │   Vercel     │  │    Analytics     │    │
│  │  Email API   │  │   Hosting    │  │    (Future)      │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack Layers

#### 1. Presentation Layer
- **Framework**: Next.js 15.0.0 with App Router
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 3.4.0
- **Animations**: Framer Motion 11.0.0
- **Icons**: Lucide React 0.400.0

#### 2. Application Layer
- **Language**: TypeScript 5.5.0
- **State Management**: React Hooks & Context API
- **Routing**: Next.js File-based App Router
- **Data Fetching**: Server Components & Client Components

#### 3. API Layer
- **API Routes**: Next.js Route Handlers
- **Email Service**: Resend API
- **PDF Generation**: jsPDF & html2canvas
- **Validation**: Zod (planned)

#### 4. Infrastructure Layer
- **Hosting**: Vercel (planned)
- **CDN**: Vercel Edge Network
- **Analytics**: Google Analytics (planned)
- **Monitoring**: Vercel Analytics (planned)

---

## 🗂️ PROJECT STRUCTURE ARCHITECTURE

### Directory Structure with Responsibilities

```
sunny-stack/
│
├── app/                           # Next.js App Router (Routes & Pages)
│   ├── layout.tsx                # Root layout with providers and metadata
│   ├── page.tsx                  # Homepage (Server Component)
│   ├── not-found.tsx             # 404 error handling
│   ├── error.tsx                 # Error boundary (planned)
│   ├── loading.tsx               # Loading states (planned)
│   │
│   ├── (routes)/                 # Route groups for organization
│   │   ├── about/
│   │   │   └── page.tsx         # About page (Server Component)
│   │   ├── portfolio/
│   │   │   ├── page.tsx         # Portfolio listing (Server Component)
│   │   │   └── [id]/            # Dynamic routes (planned)
│   │   │       └── page.tsx     # Individual project pages
│   │   ├── resume/
│   │   │   └── page.tsx         # Resume display with PDF export
│   │   ├── quote/
│   │   │   └── page.tsx         # Quote calculator (Client Component)
│   │   └── contact/
│   │       └── page.tsx         # Contact form (Hybrid Component)
│   │
│   └── api/                      # API Route Handlers
│       ├── contact/
│       │   └── route.ts         # Contact form processing
│       ├── send/
│       │   └── route.ts         # Email sending via Resend
│       └── quote/
│           └── route.ts         # Quote calculation (planned)
│
├── components/                    # React Components Library
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx           # Site header with navigation
│   │   ├── Footer.tsx           # Site footer with links
│   │   ├── Navigation.tsx       # Main navigation component
│   │   └── MobileMenu.tsx       # Mobile navigation menu
│   │
│   ├── ui/                      # UI components (atoms)
│   │   ├── Button.tsx           # Reusable button component
│   │   ├── Card.tsx             # Card component
│   │   ├── Input.tsx            # Form input component
│   │   ├── Modal.tsx            # Modal dialog component
│   │   └── Spinner.tsx          # Loading spinner
│   │
│   ├── sections/                # Page sections (molecules)
│   │   ├── HeroSection.tsx      # Homepage hero section
│   │   ├── PortfolioGrid.tsx    # Portfolio projects grid
│   │   ├── SkillsSection.tsx    # Skills showcase
│   │   ├── ContactForm.tsx      # Contact form component
│   │   └── TestimonialsSection.tsx # Client testimonials
│   │
│   └── shared/                  # Shared components (organisms)
│       ├── SEO.tsx              # SEO meta tags component
│       ├── Analytics.tsx        # Analytics wrapper
│       └── ThemeProvider.tsx    # Theme context provider
│
├── lib/                          # Utility Functions & Libraries
│   ├── utils/                   # Utility functions
│   │   ├── cn.ts               # Class name utility
│   │   ├── format.ts           # Formatting utilities
│   │   └── validation.ts       # Validation functions
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useDebounce.ts      # Debounce hook
│   │   ├── useLocalStorage.ts  # Local storage hook
│   │   └── useMediaQuery.ts    # Media query hook
│   │
│   ├── constants/              # Application constants
│   │   ├── config.ts           # App configuration
│   │   ├── routes.ts           # Route definitions
│   │   └── theme.ts            # Theme constants
│   │
│   └── types/                  # TypeScript type definitions
│       ├── index.ts            # Main type exports
│       ├── api.ts              # API types
│       └── components.ts       # Component prop types
│
├── styles/                      # Global Styles
│   ├── globals.css             # Global CSS with Tailwind
│   └── components/             # Component-specific styles
│       └── animations.css      # Animation classes
│
├── public/                      # Static Assets
│   ├── images/                 # Image assets
│   │   ├── projects/          # Project screenshots
│   │   ├── profile/           # Profile images
│   │   └── icons/             # Icon images
│   ├── fonts/                  # Custom fonts
│   └── documents/              # Downloadable documents
│
├── content/                     # Content Data
│   ├── projects.json           # Portfolio projects data
│   ├── skills.json             # Skills and technologies
│   ├── experience.json         # Work experience data
│   └── testimonials.json       # Client testimonials
│
└── trinity/                     # Trinity Method Documentation
    ├── Co-Pilot-Instructions.md
    ├── CLAUDE.md
    ├── Session-Start.md
    ├── Session-End.md
    ├── knowledge-base/
    │   ├── ARCHITECTURE.md (this file)
    │   ├── Trinity.md
    │   ├── ISSUES.md
    │   ├── To-do.md
    │   ├── Chat-Log.md
    │   └── Session-Knowledge-Retention.md
    └── investigations/
        └── prior-investigations/
```

---

## 🔄 DATA FLOW ARCHITECTURE

### Request/Response Flow

```
User Request → Next.js Router → Route Handler → Component Tree → Response

1. Browser Request
   ↓
2. Next.js Middleware (if any)
   ↓
3. App Router Resolution
   ↓
4. Layout Components Load
   ↓
5. Page Component Renders
   ↓
6. Data Fetching (if Server Component)
   ↓
7. Client Hydration (if needed)
   ↓
8. Interactive State Ready
```

### Component Data Flow

#### Server Components (Default)
```typescript
// Server Component Pattern
async function ServerComponent() {
    // Data fetched on server
    const data = await fetchData();
    
    // Rendered on server
    return <div>{data}</div>;
}
```

#### Client Components
```typescript
// Client Component Pattern
'use client';

function ClientComponent() {
    // Runs in browser
    const [state, setState] = useState();
    
    useEffect(() => {
        // Client-side effects
    }, []);
    
    return <div>{/* Interactive UI */}</div>;
}
```

### State Management Architecture

#### Local State (Component Level)
```typescript
// useState for local component state
const [isOpen, setIsOpen] = useState(false);
```

#### Shared State (Context API)
```typescript
// Context for cross-component state
const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
```

#### URL State (Search Params)
```typescript
// URL state for filters and navigation
const searchParams = useSearchParams();
const filter = searchParams.get('filter');
```

---

## 🎨 COMPONENT ARCHITECTURE

### Component Hierarchy

```
App Layout
├── Header
│   ├── Logo
│   ├── Navigation
│   │   ├── NavLink
│   │   └── MobileMenu
│   └── ThemeToggle
├── Main Content
│   ├── Page Component
│   │   ├── HeroSection
│   │   ├── ContentSections
│   │   └── CTASection
│   └── Sidebar (if applicable)
└── Footer
    ├── FooterLinks
    ├── SocialLinks
    └── Copyright
```

### Component Design Patterns

#### 1. Atomic Design Structure
- **Atoms**: Basic UI elements (Button, Input, Label)
- **Molecules**: Simple component groups (FormField, Card)
- **Organisms**: Complex components (ContactForm, Navigation)
- **Templates**: Page layouts (DefaultLayout, BlogLayout)
- **Pages**: Complete pages (HomePage, PortfolioPage)

#### 2. Composition Pattern
```typescript
// Component composition for flexibility
function Card({ children, className }) {
    return (
        <div className={cn("card", className)}>
            {children}
        </div>
    );
}

function CardHeader({ children }) {
    return <div className="card-header">{children}</div>;
}

function CardBody({ children }) {
    return <div className="card-body">{children}</div>;
}

// Usage
<Card>
    <CardHeader>Title</CardHeader>
    <CardBody>Content</CardBody>
</Card>
```

#### 3. Render Props Pattern
```typescript
// Render props for flexible rendering
function DataFetcher({ render }) {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        fetchData().then(setData);
    }, []);
    
    return render(data);
}

// Usage
<DataFetcher render={(data) => <div>{data}</div>} />
```

---

## 🚀 PERFORMANCE ARCHITECTURE

### Optimization Strategies

#### 1. Static Generation (Default)
```typescript
// Pages are pre-rendered at build time
export default function StaticPage() {
    return <div>Pre-rendered content</div>;
}
```

#### 2. Dynamic Rendering
```typescript
// Pages rendered on-demand
export const dynamic = 'force-dynamic';

export default async function DynamicPage() {
    const data = await fetchLatestData();
    return <div>{data}</div>;
}
```

#### 3. Streaming & Suspense
```typescript
// Progressive rendering with Suspense
import { Suspense } from 'react';

export default function StreamingPage() {
    return (
        <div>
            <StaticContent />
            <Suspense fallback={<Loading />}>
                <SlowComponent />
            </Suspense>
        </div>
    );
}
```

### Code Splitting Architecture

#### 1. Route-based Splitting
```typescript
// Automatic with App Router
// Each route is a separate bundle
```

#### 2. Component-based Splitting
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Spinner />,
    ssr: false
});
```

### Image Optimization Architecture

```typescript
// Next.js Image component with optimization
import Image from 'next/image';

<Image
    src="/image.jpg"
    alt="Description"
    width={800}
    height={600}
    priority={isAboveFold}
    placeholder="blur"
    blurDataURL={blurDataUrl}
/>
```

### Font Optimization Architecture

```typescript
// Next.js font optimization
import { Inter } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter'
});
```

---

## 🔒 SECURITY ARCHITECTURE

### Security Layers

#### 1. Input Validation
```typescript
// Zod schema validation
const contactSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(1000)
});

function validateInput(data: unknown) {
    return contactSchema.parse(data);
}
```

#### 2. Output Sanitization
```typescript
// React automatically escapes output
// Additional sanitization for user content
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHTML(dirty: string) {
    return DOMPurify.sanitize(dirty);
}
```

#### 3. CSRF Protection
```typescript
// CSRF token generation and validation
function generateCSRFToken() {
    return crypto.randomUUID();
}

function validateCSRFToken(token: string) {
    return token === session.csrfToken;
}
```

#### 4. Rate Limiting
```typescript
// API route rate limiting
const rateLimiter = new Map();

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for');
    
    if (rateLimiter.get(ip) > 10) {
        return new Response('Too Many Requests', { status: 429 });
    }
    
    // Process request
}
```

### Security Headers

```typescript
// Security headers configuration
const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
    }
];
```

---

## 🧪 TESTING ARCHITECTURE

### Testing Pyramid

```
        ┌─────┐
        │ E2E │      - Full user journeys
       ┌┴─────┴┐
       │ Integ │     - API & component integration
      ┌┴───────┴┐
      │  Unit   │    - Individual functions/components
     └───────────┘
```

### Testing Strategy

#### 1. Unit Tests (Jest + React Testing Library)
```typescript
// Component unit test
describe('Button', () => {
    it('renders with correct text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });
});
```

#### 2. Integration Tests
```typescript
// API integration test
describe('Contact API', () => {
    it('sends email successfully', async () => {
        const response = await fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify(validData)
        });
        expect(response.status).toBe(200);
    });
});
```

#### 3. E2E Tests (Playwright)
```typescript
// End-to-end test
test('complete contact flow', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="message"]', 'Test message');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success')).toBeVisible();
});
```

---

## 📦 BUILD & DEPLOYMENT ARCHITECTURE

### Build Pipeline

```
1. Source Code
   ↓
2. TypeScript Compilation
   ↓
3. Next.js Build
   ↓
4. Static Optimization
   ↓
5. Bundle Optimization
   ↓
6. Image Optimization
   ↓
7. Output (.next folder)
```

### Deployment Architecture

#### Vercel Deployment (Recommended)
```yaml
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev

Environment Variables:
- RESEND_API_KEY
- FROM_EMAIL
- TO_EMAIL
```

#### Docker Deployment (Alternative)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔄 CI/CD ARCHITECTURE

### Continuous Integration

```yaml
# GitHub Actions workflow
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Continuous Deployment

```yaml
# Vercel deployment
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🎯 ARCHITECTURE DECISIONS RECORD (ADR)

### ADR-001: Next.js App Router
**Status**: Accepted
**Context**: Need modern React framework with SSR/SSG capabilities
**Decision**: Use Next.js 15 with App Router
**Consequences**: Better performance, simpler mental model, React 19 support

### ADR-002: Tailwind CSS for Styling
**Status**: Accepted
**Context**: Need rapid UI development with consistent design
**Decision**: Use Tailwind CSS utility-first approach
**Consequences**: Smaller CSS bundle, faster development, learning curve for team

### ADR-003: TypeScript Strict Mode
**Status**: Accepted
**Context**: Need type safety and better developer experience
**Decision**: Enable TypeScript strict mode
**Consequences**: More robust code, earlier error detection, slightly slower development

### ADR-004: Resend for Email
**Status**: Accepted
**Context**: Need reliable transactional email service
**Decision**: Use Resend API for email delivery
**Consequences**: Simple integration, good deliverability, additional service dependency

### ADR-005: Vercel for Hosting
**Status**: Proposed
**Context**: Need reliable hosting with Next.js optimization
**Decision**: Deploy to Vercel platform
**Consequences**: Optimal Next.js performance, automatic deployments, vendor lock-in

---

## 📈 SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- Stateless application design
- Edge function compatibility
- CDN integration for static assets
- Database connection pooling (future)

### Vertical Scaling
- Code splitting for reduced bundle size
- Lazy loading for heavy components
- Image optimization and responsive images
- Efficient caching strategies

### Performance Budgets
- Initial JS: <100KB gzipped
- Initial CSS: <20KB gzipped
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

---

## 🔮 FUTURE ARCHITECTURE ENHANCEMENTS

### Planned Improvements
1. **Internationalization (i18n)**
   - Multi-language support
   - Locale-based routing
   - Content translation system

2. **CMS Integration**
   - Headless CMS for content management
   - Dynamic content updates
   - Content versioning

3. **Advanced Analytics**
   - User behavior tracking
   - Performance monitoring
   - Error tracking with Sentry

4. **PWA Capabilities**
   - Service worker implementation
   - Offline functionality
   - Push notifications

5. **Database Integration**
   - PostgreSQL for data persistence
   - Prisma ORM for type-safe queries
   - Redis for caching

---

**ARCHITECTURE.md - Sunny Stack Portfolio System Design**
**Last Updated**: [Session Date]
**Architecture Version**: 1.0.0
**Trinity Method**: v7.0

**This document serves as the authoritative source for all architectural decisions and patterns in the Sunny Stack Portfolio project.**