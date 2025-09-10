# Claude Code Technical Context - Sunny Stack Platform

## 🚀 PROJECT STATUS AND CONFIGURATION

### Live Environment
- **Production URL**: https://sunny-stack.com
- **Authentication**: luka@sunny-stack.com / S@m3fweak
- **Status**: ✅ Production Live
- **Uptime Target**: 99.9%
- **Last Deployment**: Current session

### Technology Stack
- **Frontend**: Next.js 15.0 + React 19.0 + TypeScript 5.0
- **Backend**: FastAPI 0.104.1 + Python 3.11+
- **State Management**: Zustand 5.0
- **Authentication**: NextAuth.js 5.0 Beta + JWT
- **Infrastructure**: Cloudflare Tunnel
- **Database**: JSON (migrating to PostgreSQL)
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS 3.4

### Development Environment
- **Platform**: Windows 10 (MINGW64)
- **Working Directory**: C:\Users\lukaf\Documents\ColaRecords\repositories\sunny-stack
- **Git Branch**: main
- **Node Version**: Latest LTS
- **Python Version**: 3.11+
- **Shell**: Git Bash

---

## 🛡️ CRITICAL OPERATIONAL RULES

### ⚠️ NEVER START SERVERS IN CLAUDE CODE
**ABSOLUTE PROHIBITION**: Claude Code must NEVER execute server startup commands.

**PROHIBITED COMMANDS**:
```bash
# NEVER RUN THESE:
./startup-sunny.sh      # ❌ Kills Claude session
npm run dev             # ❌ Kills Claude session
npm start               # ❌ Kills Claude session
uvicorn main:app        # ❌ Kills Claude session
python -m uvicorn       # ❌ Kills Claude session
next dev                # ❌ Kills Claude session
```

**WHY**: Starting servers terminates Claude Code sessions immediately, causing data loss and session failure.

### ✅ CLAUDE CODE RESPONSIBILITIES

**ALLOWED OPERATIONS**:
```bash
# File Operations
- Create, edit, delete files
- Write components and functions
- Update configurations
- Generate documentation

# Git Operations
- git add, commit, push
- git status, diff, log
- Branch management
- Merge operations

# Analysis Operations
- grep, find, ls
- Read and analyze code
- Test logic (without running servers)
- Syntax validation
```

**WORKFLOW SEPARATION**:
1. **Claude Code**: Implements changes, commits code
2. **Luke (Human)**: Manages servers, restarts services
3. **Both**: Collaborate on debugging via file modifications

---

## 🔧 DEVELOPMENT PROTOCOLS

### Proactive Quality Assurance (MANDATORY)

**Before Marking ANY Task Complete**:

#### ☑️ SYNTAX VALIDATION
```javascript
// All files must compile without errors
- TypeScript: No type errors
- JSX: Properly structured components
- Python: Valid syntax
- Imports: All dependencies resolved
```

#### ☑️ DEBUG INTEGRATION
```javascript
// Emoji-prefixed logging required
console.log('🔧 [COMPONENT] Initializing:', { props })
console.log('✅ [SUCCESS] Operation completed')
console.error('🚨 [ERROR] Failed to process:', error)
console.log('📊 [PERF] Execution time:', duration)
```

#### ☑️ INTEGRATION TESTING
```javascript
// Verify complete workflows
- Component renders without errors
- API endpoints respond correctly
- State management works
- Error boundaries catch failures
```

### Debug Methodology Standards

#### Emoji Prefix Standards
```
🔐 AUTH     - Authentication operations
📊 PERF     - Performance metrics
🛡️ SEC      - Security operations
⚡ API      - API requests/responses
🚨 ERR      - Error conditions
✅ SUCCESS  - Successful operations
🎯 FEAT     - Feature implementations
🌐 TUNNEL   - Cloudflare tunnel operations
🔧 DEBUG    - Debug information
💾 DATA     - Data operations
🔄 SYNC     - Synchronization events
📡 WS       - WebSocket events
```

#### 7-Step Debug Process
1. **🔍 IDENTIFY** - Precise issue identification with reproduction steps
2. **📊 DIAGNOSE** - Multi-service analysis across stack
3. **📁 ANALYZE** - Deep code examination with context
4. **🎯 ROOT CAUSE** - Evidence-based determination
5. **🛠️ SOLUTION** - Design with impact assessment
6. **⚡ IMPLEMENT** - Apply with comprehensive monitoring
7. **✅ VERIFY** - Test across entire affected workflow

---

## 📋 PROJECT-SPECIFIC CONFIGURATION

### Authentication Configuration
```typescript
// NextAuth.js configuration
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate against FastAPI backend
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const user = await response.json()
          return user
        }
        return null
      }
    })
  ],
  session: { strategy: 'jwt' },
  jwt: { 
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  }
}
```

### API Client Configuration
```typescript
// Centralized API client
class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    console.log(`⚡ [API] Request: ${endpoint}`)
    const startTime = performance.now()
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
          ...options?.headers
        }
      })
      
      const duration = performance.now() - startTime
      console.log(`✅ [API] Response: ${endpoint} (${duration.toFixed(2)}ms)`)
      
      if (!response.ok) {
        throw new APIError(response.status, await response.text())
      }
      
      return response.json()
    } catch (error) {
      console.error(`🚨 [API] Error: ${endpoint}`, error)
      throw error
    }
  }
}

export const api = new APIClient()
```

### Cloudflare Tunnel Configuration
```yaml
# ~/.cloudflared/trinity-config.yml
tunnel: sunny-stack
credentials-file: /home/user/.cloudflared/sunny-stack.json

ingress:
  # API routes to backend
  - hostname: sunny-stack.com
    path: /api/*
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true
      
  # WebSocket routes
  - hostname: sunny-stack.com
    path: /ws/*
    service: ws://localhost:8000
    originRequest:
      noTLSVerify: true
      
  # Everything else to frontend
  - hostname: sunny-stack.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
      
  # Catch-all
  - service: http_status:404
```

---

## 🚀 OPERATIONAL MODES

### Development Mode
```bash
# Frontend development (Luke manages)
cd frontend && npm run dev

# Backend development (Luke manages)
cd backend && uvicorn app.main:app --reload --port 8000

# Tunnel (Luke manages)
cloudflared tunnel run sunny-stack
```

### Production Mode
```bash
# Startup script (Luke manages)
./startup-sunny.sh

# Status check (Claude can run)
./status-sunny.sh

# Logs monitoring (Claude can run)
tail -f logs/*.log
```

### Debug Mode
```javascript
// Enable verbose logging
export DEBUG_MODE=true
export LOG_LEVEL=debug

// Component debug mode
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('🔧 [DEBUG] Component state:', state)
  console.log('🔧 [DEBUG] Props received:', props)
  console.log('🔧 [DEBUG] Render cycle:', renderCount++)
}
```

---

## 🎯 CURRENT DEVELOPMENT CONTEXT

### Active Features
1. **Trinity Layout System** - Component-based layout architecture
2. **Authentication System** - NextAuth + FastAPI JWT integration
3. **Dashboard Interface** - Real-time metrics and monitoring
4. **Project Management** - Multi-project support system
5. **WebSocket Integration** - Real-time updates via Socket.io

### Known Issues
```markdown
## Current Issues

### High Priority
- [ ] Password reset flow incomplete
- [ ] WebSocket reconnection logic needs improvement
- [ ] Dashboard metrics not updating in real-time

### Medium Priority
- [ ] Session timeout handling
- [ ] Error boundary improvements needed
- [ ] Performance optimization for large datasets

### Low Priority
- [ ] UI polish for mobile devices
- [ ] Accessibility improvements
- [ ] Documentation updates
```

### Recent Changes
```markdown
## Recent Modifications

### 2025-08-13
- Removed MCP integration completely
- Fixed authentication middleware
- Implemented multi-project architecture
- Added proactive QA methodology

### 2025-08-12
- Complete landing page rebrand
- Fixed TrinityLayout syntax errors
- Restored authentication functionality
- Added debug methodology

### Current Session
- Implementing Trinity Method v7.0
- Creating comprehensive documentation
- Establishing development protocols
```

---

## 🔒 SECURITY CONTEXT

### Authentication Security
```python
# Password hashing configuration
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # High security
)

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY")  # Never hardcode
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### API Security
```python
# CORS configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sunny-stack.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600
)

# Rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginSchema):
    # Login logic with rate limiting
```

### Environment Security
```bash
# Required environment variables
NEXTAUTH_URL=https://sunny-stack.com
NEXTAUTH_SECRET=[32+ character secret]
JWT_SECRET_KEY=[32+ character secret]
DATABASE_URL=json://./data/users.json
ANTHROPIC_API_KEY=[api-key]
OPENAI_API_KEY=[api-key]
```

---

## 📊 PERFORMANCE BASELINES

### Frontend Performance Targets
```javascript
const performanceTargets = {
  // Core Web Vitals
  FCP: 1500,    // First Contentful Paint < 1.5s
  LCP: 2500,    // Largest Contentful Paint < 2.5s
  FID: 100,     // First Input Delay < 100ms
  CLS: 0.1,     // Cumulative Layout Shift < 0.1
  
  // Custom Metrics
  apiResponse: 200,      // API calls < 200ms
  componentRender: 16,   // Re-render < 16ms (60fps)
  bundleSize: 500000,    // Bundle < 500KB
  memoryUsage: 50        // Memory < 50MB
}
```

### Backend Performance Targets
```python
performance_targets = {
    "api_response": 0.2,      # < 200ms average
    "db_query": 0.03,         # < 30ms per query
    "cpu_usage": 70,          # < 70% CPU
    "memory_usage": 512,      # < 512MB RAM
    "concurrent_users": 100,  # Support 100+ concurrent
    "requests_per_second": 1000  # Handle 1000+ RPS
}
```

---

## 🛠️ DEVELOPMENT PATTERNS

### Component Development Pattern
```typescript
// Standard React component structure
import React, { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'

interface ComponentProps {
  // Type-safe props
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // Debug logging
  console.log('🔧 [Component] Rendering with props:', props)
  
  // State management
  const [localState, setLocalState] = useState()
  const globalState = useStore(state => state.someValue)
  
  // Effects with cleanup
  useEffect(() => {
    console.log('🔧 [Component] Mounted')
    
    // Setup logic
    
    return () => {
      console.log('🔧 [Component] Unmounted')
      // Cleanup logic
    }
  }, [])
  
  // Event handlers with logging
  const handleEvent = (event: Event) => {
    console.log('⚡ [Component] Event triggered:', event)
    // Handle event
  }
  
  return (
    <div className="component-class">
      {/* Component JSX */}
    </div>
  )
}
```

### API Route Pattern
```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter(prefix="/api/resource", tags=["resource"])

@router.get("/", response_model=List[ResourceSchema])
async def get_resources(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get all resources with pagination"""
    print(f"⚡ [API] GET /resources - User: {current_user.email}")
    
    try:
        resources = await resource_service.get_all(skip, limit)
        print(f"✅ [API] Retrieved {len(resources)} resources")
        return resources
    except Exception as e:
        print(f"🚨 [API] Error retrieving resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ResourceSchema)
async def create_resource(
    resource: CreateResourceSchema,
    current_user: User = Depends(get_current_user)
):
    """Create new resource"""
    print(f"⚡ [API] POST /resources - User: {current_user.email}")
    
    try:
        new_resource = await resource_service.create(resource, current_user)
        print(f"✅ [API] Created resource: {new_resource.id}")
        return new_resource
    except Exception as e:
        print(f"🚨 [API] Error creating resource: {e}")
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 🔄 STATE MANAGEMENT PATTERNS

### Zustand Store Pattern
```typescript
// store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  // State
  user: User | null
  projects: Project[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  loadProjects: () => Promise<void>
  createProject: (project: CreateProjectDto) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearError: () => void
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        projects: [],
        isLoading: false,
        error: null,
        
        // Actions with debug logging
        setUser: (user) => {
          console.log('🔧 [Store] Setting user:', user?.email)
          set({ user })
        },
        
        loadProjects: async () => {
          console.log('⚡ [Store] Loading projects')
          set({ isLoading: true, error: null })
          
          try {
            const projects = await api.get<Project[]>('/projects')
            console.log(`✅ [Store] Loaded ${projects.length} projects`)
            set({ projects, isLoading: false })
          } catch (error) {
            console.error('🚨 [Store] Failed to load projects:', error)
            set({ error: error.message, isLoading: false })
          }
        },
        
        createProject: async (projectData) => {
          console.log('⚡ [Store] Creating project:', projectData.name)
          set({ isLoading: true, error: null })
          
          try {
            const newProject = await api.post<Project>('/projects', projectData)
            console.log('✅ [Store] Project created:', newProject.id)
            set(state => ({
              projects: [...state.projects, newProject],
              isLoading: false
            }))
          } catch (error) {
            console.error('🚨 [Store] Failed to create project:', error)
            set({ error: error.message, isLoading: false })
            throw error
          }
        },
        
        clearError: () => set({ error: null })
      }),
      {
        name: 'sunny-stack-storage',
        partialize: (state) => ({ user: state.user })
      }
    )
  )
)
```

---

## 🚦 MONITORING AND LOGGING

### Structured Logging Pattern
```typescript
class Logger {
  private context: string
  
  constructor(context: string) {
    this.context = context
  }
  
  info(message: string, data?: any) {
    console.log(`ℹ️ [${this.context}] ${message}`, data || '')
  }
  
  success(message: string, data?: any) {
    console.log(`✅ [${this.context}] ${message}`, data || '')
  }
  
  warning(message: string, data?: any) {
    console.warn(`⚠️ [${this.context}] ${message}`, data || '')
  }
  
  error(message: string, error?: any) {
    console.error(`🚨 [${this.context}] ${message}`, error || '')
  }
  
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 [${this.context}] ${message}`, data || '')
    }
  }
  
  performance(operation: string, duration: number) {
    console.log(`📊 [${this.context}] ${operation}: ${duration.toFixed(2)}ms`)
  }
}

// Usage
const logger = new Logger('AuthService')
logger.info('User login attempt', { email: user.email })
logger.success('Login successful', { userId: user.id })
logger.error('Login failed', error)
```

---

## 📝 DOCUMENTATION STANDARDS

### Code Documentation Pattern
```typescript
/**
 * Authenticates a user with email and password
 * 
 * @param credentials - User login credentials
 * @param credentials.email - User's email address
 * @param credentials.password - User's password
 * @returns Promise<User> - Authenticated user object
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {RateLimitError} When too many attempts
 * 
 * @example
 * ```typescript
 * const user = await authenticate({
 *   email: 'user@example.com',
 *   password: 'secure-password'
 * })
 * ```
 */
export async function authenticate(
  credentials: LoginCredentials
): Promise<User> {
  console.log('🔐 [Auth] Authentication attempt:', credentials.email)
  // Implementation
}
```

### API Documentation Pattern
```python
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user",
    description="Authenticate user with email and password, returns JWT token",
    responses={
        200: {"description": "Successfully authenticated"},
        401: {"description": "Invalid credentials"},
        429: {"description": "Too many requests"}
    }
)
async def login(
    credentials: LoginSchema,
    request: Request,
    response: Response
) -> TokenResponse:
    """
    Authenticate user and return JWT token.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT token for authenticated requests.
    """
    # Implementation
```

---

## 🎯 QUALITY GATES

### Pre-Commit Checklist
```markdown
## Before Committing Code

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console.log in production code (except debug logs)
- [ ] All imports used
- [ ] No commented-out code

### Testing
- [ ] Component renders without errors
- [ ] API endpoints tested
- [ ] Error cases handled
- [ ] Loading states implemented
- [ ] Edge cases considered

### Security
- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS prevention in place
- [ ] CSRF protection enabled

### Performance
- [ ] No unnecessary re-renders
- [ ] API calls optimized
- [ ] Images optimized
- [ ] Bundle size checked
- [ ] Memory leaks prevented

### Documentation
- [ ] Functions documented
- [ ] Complex logic explained
- [ ] API changes documented
- [ ] README updated if needed
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Production Deployment
```markdown
## Deployment Verification

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance metrics met
- [ ] Security scan passed
- [ ] Documentation updated

### Deployment Steps
- [ ] Build frontend: `npm run build`
- [ ] Test build locally
- [ ] Commit all changes
- [ ] Push to main branch
- [ ] Verify tunnel configuration
- [ ] Restart services
- [ ] Monitor logs

### Post-Deployment
- [ ] Verify site accessible
- [ ] Test critical user flows
- [ ] Check error monitoring
- [ ] Verify API responses
- [ ] Monitor performance
- [ ] Check WebSocket connections
- [ ] Test authentication flow
```

---

## 📚 REFERENCE COMMANDS

### Frequently Used Commands
```bash
# Project navigation
cd /c/Users/lukaf/Documents/ColaRecords/repositories/sunny-stack

# Status checks (Claude can run)
./status-sunny.sh
git status
npm ls

# File operations (Claude primary responsibility)
grep -r "pattern" --include="*.tsx"
find . -name "*.ts" -type f
ls -la frontend/components/

# Git operations (Claude can run)
git add -A
git commit -m "feat: implement feature"
git push origin main
git log --oneline -10

# Logs monitoring (Claude can run)
tail -f logs/frontend.log
tail -f logs/backend.log
grep "ERROR" logs/*.log
```

---

**Claude Code Technical Context - Sunny Stack Platform**
**Trinity Method v7.0 Implementation**
**Last Updated: Current Session**