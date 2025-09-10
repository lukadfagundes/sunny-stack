# Sunny Stack Architecture Documentation - Trinity Method v7.0

## 🏗️ PROJECT ARCHITECTURE OVERVIEW

### Technology Stack Profile
- **Frontend**: Next.js 15.0 with React 19.0 (App Router architecture)
- **State Management**: Zustand 5.0 for client-side state
- **Styling**: Tailwind CSS 3.4 with PostCSS
- **Backend**: FastAPI 0.104.1 with Python asyncio
- **Authentication**: NextAuth.js 5.0 Beta + JWT + bcrypt
- **Database**: JSON file-based storage (transitioning to PostgreSQL)
- **Real-time**: Socket.io for WebSocket connections
- **Infrastructure**: Cloudflare Tunnel for secure external access
- **Monitoring**: Custom debug methodology with emoji-prefixed logging

### System Architecture Pattern
```
┌──────────────────────────────────────────────────────────────┐
│                     Cloudflare Tunnel                         │
│                    (sunny-stack.com)                         │
└────────────────┬─────────────────────────┬──────────────────┘
                 │                         │
     ┌───────────▼──────────┐   ┌─────────▼──────────┐
     │   Next.js Frontend   │   │  FastAPI Backend   │
     │     (Port 3000)      │◄──►│    (Port 8000)    │
     └──────────────────────┘   └──────────────────┘
                 │                         │
     ┌───────────▼──────────┐   ┌─────────▼──────────┐
     │    Zustand Store     │   │   JSON Database    │
     │  (Client State)      │   │  (Server State)    │
     └──────────────────────┘   └──────────────────┘
```

---

## 📁 PROJECT STRUCTURE ANALYSIS

### Root Directory Organization
```
sunny-stack/
├── frontend/               # Next.js application
├── backend/               # FastAPI server
├── trinity/              # Trinity Method documentation
├── archive/              # Historical documentation
├── data/                 # Shared data storage
├── scripts/              # Shell automation scripts
├── *.sh                  # Startup/management scripts
└── CLAUDE.md             # Project context
```

### Frontend Architecture (Next.js)
```
frontend/
├── app/                  # App Router pages
│   ├── (auth)/          # Authentication routes
│   │   ├── login/       # Login page
│   │   ├── signup/      # Registration page
│   │   └── reset/       # Password reset
│   ├── dashboard/       # Protected dashboard
│   ├── api/            # API routes (NextAuth)
│   └── layout.tsx      # Root layout
├── components/          
│   ├── trinity/        # Trinity layout system
│   │   ├── TrinityLayout.tsx
│   │   ├── Navigation.tsx
│   │   └── StatusPanel.tsx
│   ├── auth/          # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   └── ui/            # Reusable UI components
├── lib/               # Utilities and helpers
│   ├── auth.ts       # NextAuth configuration
│   ├── api.ts        # API client utilities
│   └── store.ts      # Zustand store
├── styles/           # Global styles
└── public/          # Static assets
```

### Backend Architecture (FastAPI)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── routes/              # API endpoints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── users.py        # User management
│   │   ├── trinity.py      # Trinity-specific routes
│   │   └── websocket.py    # WebSocket handlers
│   ├── models/             # Pydantic models
│   │   ├── user.py        # User schemas
│   │   └── auth.py        # Auth schemas
│   ├── services/          # Business logic
│   │   ├── auth_service.py
│   │   └── user_service.py
│   ├── middleware/        # Custom middleware
│   │   ├── cors.py       # CORS configuration
│   │   └── auth.py       # Auth middleware
│   └── utils/            # Helper utilities
│       ├── security.py   # JWT/bcrypt utilities
│       └── database.py   # Database operations
├── data/                 # JSON storage
│   └── users.json       # User database
└── requirements.txt     # Python dependencies
```

---

## 🔌 COMPONENT INTERACTION PATTERNS

### Authentication Flow Architecture
```
1. Client Request → Next.js Frontend
2. NextAuth.js → JWT Token Generation
3. API Request → FastAPI Backend
4. JWT Validation → Middleware
5. Business Logic → Service Layer
6. Data Operation → JSON Storage
7. Response → Client Update
```

### State Management Architecture

#### Client-Side State (Zustand)
```typescript
interface AppState {
  // User State
  user: User | null;
  isAuthenticated: boolean;
  
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Data State
  projects: Project[];
  currentProject: Project | null;
  
  // Actions
  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  loadProjects: () => Promise<void>;
}
```

#### Server-Side State (FastAPI)
```python
class AppState:
    users: Dict[str, User]
    sessions: Dict[str, Session]
    websocket_connections: Dict[str, WebSocket]
    cache: Dict[str, Any]
```

### API Communication Patterns

#### RESTful API Structure
```
GET    /api/users          # List users
POST   /api/users          # Create user
GET    /api/users/{id}     # Get user
PUT    /api/users/{id}     # Update user
DELETE /api/users/{id}     # Delete user

POST   /api/auth/login     # User login
POST   /api/auth/logout    # User logout
POST   /api/auth/refresh   # Refresh token
POST   /api/auth/reset     # Password reset
```

#### WebSocket Events
```javascript
// Client → Server
socket.emit('user:update', userData)
socket.emit('project:create', projectData)
socket.emit('message:send', messageData)

// Server → Client
socket.on('user:updated', handleUserUpdate)
socket.on('project:created', handleProjectCreated)
socket.on('message:received', handleMessage)
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Service Configuration
```yaml
Frontend Service:
  - Port: 3000
  - Process: Next.js standalone server
  - Environment: Production build
  - Static Assets: Optimized and cached

Backend Service:
  - Port: 8000
  - Process: Uvicorn ASGI server
  - Workers: 4 (auto-scaled)
  - Environment: Production with reload disabled

Tunnel Service:
  - Provider: Cloudflare
  - Protocol: HTTP/2 with TLS
  - Ingress Rules:
    - sunny-stack.com/* → localhost:3000
    - sunny-stack.com/api/* → localhost:8000
    - sunny-stack.com/ws → localhost:8000/ws
```

### Environment Configuration
```bash
# Frontend (.env.local)
NEXTAUTH_URL=https://sunny-stack.com
NEXTAUTH_SECRET=[generated-secret]
NEXT_PUBLIC_API_URL=https://sunny-stack.com/api

# Backend (.env)
SECRET_KEY=[generated-key]
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=json://./data/users.json
CORS_ORIGINS=["https://sunny-stack.com"]
```

---

## 🛡️ SECURITY ARCHITECTURE

### Authentication Security
- **Password Hashing**: bcrypt with salt rounds = 12
- **JWT Tokens**: HS256 algorithm with secure secret
- **Session Management**: Secure, httpOnly cookies
- **CORS Policy**: Strict origin validation
- **Rate Limiting**: API endpoint throttling

### Data Security
- **Input Validation**: Pydantic models for all inputs
- **SQL Injection**: N/A (JSON storage, prepared for ORM)
- **XSS Protection**: React automatic escaping
- **CSRF Protection**: NextAuth CSRF tokens
- **Secrets Management**: Environment variables only

---

## 🎯 PERFORMANCE ARCHITECTURE

### Frontend Optimization
```javascript
// Code Splitting
const Dashboard = lazy(() => import('./Dashboard'))

// Image Optimization
import Image from 'next/image'

// Bundle Optimization
- Tree shaking enabled
- Minification in production
- Compression with gzip/brotli

// Caching Strategy
- Static assets: 1 year cache
- API responses: 5 minute cache
- Dynamic content: No cache
```

### Backend Optimization
```python
# Async Operations
async def get_user(user_id: str):
    return await db.users.find_one({"id": user_id})

# Connection Pooling
database_pool = ConnectionPool(max_connections=100)

# Response Caching
@cache(expire=300)
async def get_projects():
    return await db.projects.find_all()

# Background Tasks
background_tasks.add_task(send_email, user.email)
```

### Performance Baselines
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **API Response Time**: < 200ms
- **WebSocket Latency**: < 50ms
- **Database Query Time**: < 30ms

---

## 🔄 DATA FLOW ARCHITECTURE

### Request Lifecycle
```
1. User Interaction (Frontend)
   ↓
2. React Component State Update
   ↓
3. Zustand Store Action
   ↓
4. API Client Request
   ↓
5. NextAuth Middleware (if protected)
   ↓
6. FastAPI Route Handler
   ↓
7. Business Logic Service
   ↓
8. Data Layer Operation
   ↓
9. Response Transformation
   ↓
10. Client State Update
    ↓
11. React Re-render
```

### Real-time Data Flow
```
1. WebSocket Connection Established
   ↓
2. Client Subscribes to Events
   ↓
3. Server Broadcasts Updates
   ↓
4. Client Receives Event
   ↓
5. Zustand Store Update
   ↓
6. React Components Re-render
```

---

## 🧩 INTEGRATION ARCHITECTURE

### External Service Integrations
```
Anthropic API:
  - Purpose: AI model integration
  - Authentication: API key
  - Rate Limits: 1000 req/min
  - Retry Strategy: Exponential backoff

OpenAI API:
  - Purpose: Alternative AI provider
  - Authentication: API key
  - Rate Limits: 500 req/min
  - Failover: Automatic to Anthropic

Cloudflare:
  - Tunnel: Secure ingress
  - DNS: Domain management
  - SSL: Certificate management
  - DDoS: Protection enabled
```

### Internal Service Communication
```typescript
// API Client Pattern
class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL
  
  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(
      `${this.baseURL}${endpoint}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
          ...options?.headers
        }
      }
    )
    
    if (!response.ok) {
      throw new APIError(response)
    }
    
    return response.json()
  }
}
```

---

## 🚦 MONITORING ARCHITECTURE

### Debug Methodology
```javascript
// Emoji-Prefixed Logging Standard
console.log('🔐 [AUTH] Login attempt:', { email })
console.log('✅ [AUTH] Login successful:', { userId })
console.error('🚨 [AUTH] Login failed:', { error })
console.log('📊 [PERF] API response time:', { duration })
console.log('🌐 [TUNNEL] External access verified')
```

### Performance Monitoring
```python
# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"⚡ [API] {request.url.path} - {process_time:.3f}s")
    return response
```

### Error Tracking
```typescript
// Global error boundary
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ERROR] React error boundary:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })
    
    // Send to monitoring service
    trackError(error, errorInfo)
  }
}
```

---

## 📈 SCALING ARCHITECTURE

### Horizontal Scaling Strategy
```
Current: Single instance
Phase 1: Multiple workers (Uvicorn)
Phase 2: Container orchestration (Docker Swarm)
Phase 3: Kubernetes deployment
Phase 4: Auto-scaling with metrics
```

### Database Evolution Path
```
Current: JSON files
Phase 1: SQLite (development)
Phase 2: PostgreSQL (production)
Phase 3: PostgreSQL with read replicas
Phase 4: Database sharding
```

### Caching Strategy Evolution
```
Current: In-memory caching
Phase 1: Redis for session storage
Phase 2: Redis for API caching
Phase 3: CDN for static assets
Phase 4: Edge caching with Cloudflare
```

---

## 🔍 INVESTIGATION PATTERNS

### Architecture Investigation Template
```markdown
## Investigation: [Component/Feature]
### Current State
- Component location: [path]
- Dependencies: [list]
- Integration points: [list]

### Analysis
- Performance metrics: [measurements]
- Bottlenecks identified: [list]
- Security concerns: [list]

### Recommendations
- Proposed changes: [list]
- Impact assessment: [analysis]
- Implementation plan: [steps]
```

### Performance Investigation Protocol
```bash
# Frontend performance
npm run build
npm run analyze

# Backend performance
python -m cProfile -o profile.stats main.py
python -m pstats profile.stats

# Database performance
time python -c "import json; json.load(open('data/users.json'))"

# Network performance
curl -w "@curl-format.txt" -o /dev/null -s https://sunny-stack.com
```

---

## 🎯 ARCHITECTURE PRINCIPLES

### Design Principles
1. **Separation of Concerns**: Clear boundaries between layers
2. **Single Responsibility**: Each component has one job
3. **Dependency Inversion**: Depend on abstractions, not concretions
4. **Interface Segregation**: Specific interfaces over general ones
5. **Open/Closed**: Open for extension, closed for modification

### Development Principles
1. **Investigation-First**: Understand before implementing
2. **Evidence-Based**: Decisions backed by measurements
3. **Continuous Testing**: Test at every level
4. **Progressive Enhancement**: Build on stable foundations
5. **Documentation-Driven**: Document as you develop

### Quality Principles
1. **Zero Console Errors**: Production must be error-free
2. **Performance Standards**: Meet or exceed baselines
3. **Security by Default**: Secure from the start
4. **Accessibility First**: WCAG 2.1 AA compliance
5. **Mobile Responsive**: Mobile-first design approach

---

## 📊 METRICS AND BASELINES

### Application Metrics
```javascript
const metrics = {
  // Performance
  firstContentfulPaint: '< 1.5s',
  timeToInteractive: '< 3.5s',
  largestContentfulPaint: '< 2.5s',
  
  // API
  averageResponseTime: '< 200ms',
  p95ResponseTime: '< 500ms',
  errorRate: '< 0.1%',
  
  // Infrastructure
  uptime: '> 99.9%',
  cpuUsage: '< 70%',
  memoryUsage: '< 80%',
  
  // User Experience
  pageLoadTime: '< 3s',
  interactionDelay: '< 100ms',
  errorRecoveryTime: '< 5s'
}
```

---

## 🚀 FUTURE ARCHITECTURE ROADMAP

### Short Term (1-3 months)
- [ ] Migrate to PostgreSQL database
- [ ] Implement Redis caching
- [ ] Add comprehensive test suite
- [ ] Deploy monitoring dashboard
- [ ] Implement CI/CD pipeline

### Medium Term (3-6 months)
- [ ] Containerize with Docker
- [ ] Implement microservices architecture
- [ ] Add message queue (RabbitMQ/Kafka)
- [ ] Implement GraphQL API
- [ ] Deploy to Kubernetes

### Long Term (6-12 months)
- [ ] Multi-region deployment
- [ ] Event-driven architecture
- [ ] Machine learning pipeline
- [ ] Real-time analytics
- [ ] Edge computing integration

---

## 📝 ARCHITECTURE DECISION RECORDS

### ADR-001: Choose Next.js over Create React App
**Date**: 2024-01-15
**Status**: Accepted
**Context**: Need SSR, API routes, and better performance
**Decision**: Use Next.js for frontend
**Consequences**: Better SEO, faster initial load, integrated API

### ADR-002: FastAPI over Django/Flask
**Date**: 2024-01-20
**Status**: Accepted
**Context**: Need async support and automatic API documentation
**Decision**: Use FastAPI for backend
**Consequences**: Better performance, automatic OpenAPI docs

### ADR-003: Cloudflare Tunnel over traditional hosting
**Date**: 2024-02-01
**Status**: Accepted
**Context**: Need secure, easy deployment without exposing ports
**Decision**: Use Cloudflare Tunnel
**Consequences**: Enhanced security, easier deployment, built-in DDoS protection

---

**Architecture Documentation - Trinity Method v7.0**
**Maintained for Sunny Stack Platform - https://sunny-stack.com**