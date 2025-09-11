# CLAUDE.md - Sunny Stack Portfolio Technical Context

## 🎯 PROJECT OVERVIEW

**Project Name**: Sunny Stack Portfolio
**Purpose**: Professional web development portfolio showcasing projects, skills, and services
**Status**: Active Development
**Version**: 1.0.0
**Repository**: sunny-stack
**Live URL**: [To be deployed]

### Project Mission
Create a high-performance, visually stunning portfolio website that demonstrates advanced web development capabilities while maintaining perfect accessibility, SEO, and user experience standards using the Trinity Method v7.0 methodology.

---

## 🏗️ TECHNICAL ARCHITECTURE

### Core Technology Stack

#### Frontend Framework
- **Next.js 15.0.0**: Latest App Router architecture for optimal performance
- **React 19.0.0**: Cutting-edge React with concurrent features
- **TypeScript 5.5.0**: Type-safe development with latest features

#### Styling & Animation
- **Tailwind CSS 3.4.0**: Utility-first CSS framework
- **Framer Motion 11.0.0**: Professional animations and transitions
- **PostCSS 8.4.0**: CSS processing with Autoprefixer 10.4.0

#### Development Tools
- **ESLint 9.0.0**: Code quality enforcement
- **Next.js ESLint Config 15.0.0**: Framework-specific linting rules
- **TypeScript Compiler**: Strict type checking enabled

#### Third-Party Integrations
- **Resend 6.0.3**: Transactional email service for contact forms
- **jsPDF 3.0.2**: Client-side PDF generation for resume downloads
- **html2canvas 1.4.1**: HTML to canvas conversion for PDF generation
- **Lucide React 0.400.0**: Modern icon library

### Project Structure

```
sunny-stack/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Homepage
│   ├── not-found.tsx          # 404 error page
│   ├── about/                 # About section
│   │   └── page.tsx
│   ├── portfolio/             # Portfolio showcase
│   │   └── page.tsx
│   ├── resume/                # Resume section
│   │   └── page.tsx
│   ├── quote/                 # Quote calculator
│   │   └── page.tsx
│   ├── contact/               # Contact form
│   │   └── page.tsx
│   └── api/                   # API routes
│       ├── contact/           # Contact form handler
│       │   └── route.ts
│       └── send/              # Email sending endpoint
│           └── route.ts
├── components/                 # React components
│   ├── layout/               # Layout components
│   ├── ui/                   # UI components
│   ├── sections/             # Page sections
│   └── shared/               # Shared components
├── lib/                       # Utility functions
│   ├── utils.ts              # Helper functions
│   ├── constants.ts          # App constants
│   └── types.ts              # TypeScript types
├── styles/                    # Global styles
│   └── globals.css           # Global CSS with Tailwind
├── public/                    # Static assets
│   ├── images/               # Image assets
│   ├── fonts/                # Custom fonts
│   └── icons/                # Icon assets
├── content/                   # Content data
│   ├── projects.json         # Portfolio projects
│   ├── skills.json           # Skills data
│   └── experience.json       # Work experience
└── trinity/                   # Trinity Method documentation
    ├── Co-Pilot-Instructions.md
    ├── CLAUDE.md (this file)
    ├── Session-Start.md
    ├── Session-End.md
    ├── knowledge-base/
    │   ├── ARCHITECTURE.md
    │   ├── Trinity.md
    │   ├── ISSUES.md
    │   ├── To-do.md
    │   ├── Chat-Log.md
    │   └── Session-Knowledge-Retention.md
    └── investigations/
        └── prior-investigations/
```

### Architecture Patterns

#### Component Architecture
- **Server Components**: Default for static content and data fetching
- **Client Components**: Used for interactivity and browser APIs
- **Hybrid Approach**: Optimal balance between SSR and client-side features

#### State Management
- **React Hooks**: useState, useEffect, useContext for local state
- **Context API**: Global state for theme, user preferences
- **URL State**: Search params for filters and navigation state

#### Data Flow
- **Server-Side**: Initial data fetching in server components
- **Client-Side**: Dynamic updates and user interactions
- **API Routes**: Backend logic for forms and external services

#### Performance Optimizations
- **Static Generation**: Pre-rendered pages for optimal performance
- **Dynamic Imports**: Code splitting for faster initial loads
- **Image Optimization**: Next.js Image component with lazy loading
- **Font Optimization**: Next.js font optimization with variable fonts

---

## 🔧 OPERATIONAL MODES

### Development Mode
```bash
npm run dev
# Runs on http://localhost:3000
# Hot Module Replacement enabled
# Error overlay active
# Source maps enabled
```

### Production Mode
```bash
npm run build && npm start
# Optimized production build
# Minified and compressed
# Static optimization applied
# Error boundaries active
```

### Testing Mode
```bash
npm run test
# Unit tests with Jest
# Component testing with React Testing Library
# E2E tests with Playwright
# Coverage reports generated
```

### Type Checking Mode
```bash
npm run type-check
# TypeScript strict mode
# No implicit any
# Strict null checks
# Unused variables check
```

---

## 📊 CURRENT DEVELOPMENT STATUS

### Completed Features
- ✅ Project structure setup with Next.js 15
- ✅ TypeScript configuration with strict mode
- ✅ Tailwind CSS integration with custom config
- ✅ Basic routing structure with App Router
- ✅ Component architecture foundation
- ✅ API routes setup for contact and email
- ✅ Trinity Method v7.0 documentation structure

### In Progress
- 🔄 Portfolio section implementation
- 🔄 Contact form with Resend integration
- 🔄 Resume PDF generation feature
- 🔄 Quote calculator functionality
- 🔄 Responsive design optimization
- 🔄 Animation implementations with Framer Motion

### Pending Features
- ⏳ Blog section with MDX support
- ⏳ Dark mode toggle with system preference
- ⏳ Analytics integration
- ⏳ SEO optimization with metadata
- ⏳ PWA capabilities
- ⏳ Internationalization (i18n)
- ⏳ Admin dashboard for content management

### Known Issues
- 🐛 Console warnings from development mode
- 🐛 Hydration warnings in certain components
- 🐛 Performance optimization needed for images
- 🐛 Form validation edge cases
- 🐛 Mobile menu animation glitches

---

## 🚀 DEPLOYMENT CONFIGURATION

### Environment Variables
```env
# Email Service
RESEND_API_KEY=            # Resend API key for email
FROM_EMAIL=                 # Sender email address
TO_EMAIL=                   # Recipient email address

# Analytics (Future)
NEXT_PUBLIC_GA_ID=          # Google Analytics ID
NEXT_PUBLIC_GTM_ID=         # Google Tag Manager ID

# API Configuration
NEXT_PUBLIC_API_URL=        # API endpoint URL
API_RATE_LIMIT=             # Rate limiting configuration

# Feature Flags
ENABLE_BLOG=                # Enable blog section
ENABLE_ANALYTICS=           # Enable analytics tracking
ENABLE_PWA=                 # Enable PWA features
```

### Build Configuration
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    appDir: true,
  },
};
```

### Deployment Targets
- **Vercel**: Primary deployment platform (recommended)
- **Netlify**: Alternative static hosting
- **AWS Amplify**: Enterprise deployment option
- **Docker**: Containerized deployment

---

## 🔒 SECURITY PROTOCOLS

### Input Validation
- All form inputs sanitized before processing
- SQL injection prevention in data handling
- XSS protection through React's default escaping
- CSRF tokens for form submissions

### API Security
- Rate limiting on all endpoints
- CORS configuration for API routes
- Environment variable protection
- API key rotation schedule

### Content Security Policy
```typescript
// Recommended CSP headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
    `.replace(/\n/g, ''),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
];
```

---

## 🎨 DESIGN SYSTEM

### Color Palette
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-900: #1e3a8a;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-500: #6b7280;
--gray-900: #111827;

/* Semantic Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### Typography Scale
```css
/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
```

### Spacing System
```css
/* Spacing Scale (rem) */
--space-0: 0;          /* 0px */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
```

### Breakpoints
```css
/* Responsive Breakpoints */
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

---

## 📈 PERFORMANCE TARGETS

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s

### Bundle Size Targets
- **Initial JS**: < 100KB (gzipped)
- **Initial CSS**: < 20KB (gzipped)
- **Total Page Weight**: < 500KB
- **Image Optimization**: 85% compression
- **Font Loading**: < 100ms

### Performance Monitoring
```typescript
// Performance monitoring setup
export function monitorPerformance() {
  // Core Web Vitals
  if (typeof window !== 'undefined') {
    // LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[PERFORMANCE] LCP:', lastEntry.renderTime || lastEntry.loadTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // FID
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        console.log('[PERFORMANCE] FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ type: 'first-input', buffered: true });
    
    // CLS
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('[PERFORMANCE] CLS:', clsValue);
        }
      });
    }).observe({ type: 'layout-shift', buffered: true });
  }
}
```

---

## 🧪 TESTING STRATEGY

### Unit Testing
```typescript
// Component testing example
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactForm } from '@/components/ContactForm';

describe('ContactForm', () => {
  it('should validate email format', () => {
    render(<ContactForm />);
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// API route testing
import { POST } from '@/app/api/contact/route';

describe('Contact API', () => {
  it('should send email successfully', async () => {
    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### E2E Testing
```typescript
// Playwright E2E test
import { test, expect } from '@playwright/test';

test('complete user journey', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sunny Stack Portfolio/);
  
  // Navigate to portfolio
  await page.click('text=Portfolio');
  await expect(page).toHaveURL('/portfolio');
  
  // Test contact form
  await page.click('text=Contact');
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="message"]', 'Test message');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Git Workflow
```bash
# Branch naming convention
feature/[feature-name]     # New features
fix/[bug-description]       # Bug fixes
refactor/[component-name]   # Code refactoring
docs/[doc-update]          # Documentation
test/[test-description]     # Testing updates

# Commit message format
feat: Add new feature
fix: Resolve bug issue
refactor: Improve code structure
docs: Update documentation
test: Add test coverage
style: Format code
perf: Optimize performance
```

### Code Review Checklist
- [ ] Investigation documented
- [ ] Tests written and passing
- [ ] TypeScript types proper
- [ ] Performance verified
- [ ] Accessibility checked
- [ ] Mobile responsive
- [ ] Documentation updated
- [ ] No console errors

### Release Process
1. **Development**: Feature branch development
2. **Testing**: Comprehensive testing suite
3. **Review**: Code review and approval
4. **Staging**: Deploy to staging environment
5. **QA**: Quality assurance testing
6. **Production**: Deploy to production
7. **Monitor**: Performance and error monitoring

---

## 🎯 OPERATIONAL INTELLIGENCE

### Quick Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Build production bundle
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript check

# Testing
npm run test            # Run test suite
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run E2E tests

# Analysis
npm run analyze         # Analyze bundle size
npm run lighthouse      # Run Lighthouse audit
```

### Debugging Tips
```typescript
// Enable verbose logging
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] Verbose logging enabled');
  
  // Log all API requests
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('[API] Request:', args);
      const response = await originalFetch(...args);
      console.log('[API] Response:', response.status);
      return response;
    };
  }
}

// Component render tracking
export function useRenderTracking(componentName: string) {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    console.log(`[RENDER] ${componentName} rendered ${renderCount.current} times`);
  });
}
```

### Performance Profiling
```typescript
// Profile component performance
export function ProfiledComponent({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`[PROFILE] Component lifecycle: ${endTime - startTime}ms`);
    };
  }, []);
  
  return <>{children}</>;
}
```

---

## 📚 KNOWLEDGE BASE REFERENCES

### Internal Documentation
- `/trinity/Co-Pilot-Instructions.md` - Development protocols
- `/trinity/knowledge-base/ARCHITECTURE.md` - System architecture
- `/trinity/knowledge-base/Trinity.md` - Trinity Method implementation
- `/trinity/knowledge-base/ISSUES.md` - Known issues and resolutions
- `/trinity/knowledge-base/To-do.md` - Development roadmap

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion)

### API Documentation
- [Resend API](https://resend.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🚨 CRITICAL OPERATIONAL NOTES

### Current Priorities
1. **Performance Optimization**: Achieve 95+ Lighthouse score
2. **Mobile Experience**: Perfect responsive design
3. **SEO Implementation**: Meta tags and structured data
4. **Accessibility**: WCAG AAA compliance
5. **Testing Coverage**: >80% code coverage

### Active Investigations
- Performance bottlenecks in portfolio section
- Hydration mismatch in client components
- Bundle size optimization strategies
- Image loading performance
- Animation performance on mobile

### Session Requirements
- Always start with `/trinity/Session-Start.md`
- Document all changes in chat log
- Update knowledge retention after significant discoveries
- End with `/trinity/Session-End.md`

### Emergency Protocols
- Console error crisis: Stop, assess, fix systematically
- Performance degradation: Profile, identify, optimize
- Build failure: Check types, lint, dependencies
- Deployment failure: Verify env vars, check logs

---

**CLAUDE.md - Sunny Stack Portfolio Technical Context**
**Last Updated**: [Session Date]
**Trinity Method Version**: v7.0
**Project Phase**: Active Development

**This document serves as the primary technical reference for Claude Code operations on the Sunny Stack Portfolio project.**