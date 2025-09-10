# Sunny Stack Co-Pilot Instructions - Trinity Method v7.0 Implementation

## 🔥 INVESTIGATION-FIRST DEVELOPMENT METHODOLOGY

**This document defines the mandatory development methodology for the Sunny Stack AI Platform, integrating Next.js frontend, FastAPI backend, and Cloudflare infrastructure.**

---

## CRITICAL: MANDATORY ENFORCEMENT PROTOCOLS

### ⚠️ CLAUDE CODE MANDATORY REQUIREMENTS

#### MANDATORY FULL SYSTEM TESTING
**EVERY Claude Code implementation MUST include:**

```
MANDATORY: After implementation, conduct FULL USER EXPERIENCE AUDIT of entire affected workflow. Test ALL user interactions across frontend/backend, verify ALL data flows through FastAPI endpoints, confirm ALL cross-component integrations between React and Python services. This is not optional.
```

#### MANDATORY DEBUGGING IMPLEMENTATION
**EVERY implementation MUST include:**

```
MANDATORY: Add comprehensive debugging to ALL modified functions in both TypeScript/React components AND Python/FastAPI endpoints with entry/exit logging, parameter capture, error handling, and performance timing. Verify debug output during testing across the full stack.
```

#### USER EXPERIENCE AUDIT REQUIREMENTS
**Post-implementation audit MUST verify:**
- ✅ Full user workflow testing from React UI to FastAPI backend
- ✅ All Next.js component interaction verification
- ✅ FastAPI endpoint response validation
- ✅ Data persistence across SQLAlchemy models
- ✅ WebSocket real-time functionality through Socket.IO
- ✅ Error handling in both frontend and backend scenarios

---

## SUNNY STACK PROJECT ARCHITECTURE CONTEXT

### TECHNOLOGY STACK IDENTIFICATION
```javascript
// Sunny Stack Technology Profile
const sunnyStackArchitecture = {
    frontend: {
        framework: 'Next.js 15.0',
        language: 'TypeScript',
        styling: 'Tailwind CSS',
        state: 'Zustand',
        query: '@tanstack/react-query',
        animations: 'Framer Motion',
        realtime: 'Socket.IO Client'
    },
    backend: {
        framework: 'FastAPI 0.104.1',
        language: 'Python 3.11+',
        server: 'Uvicorn',
        auth: 'PassLib + JWT',
        database: 'SQLAlchemy',
        ai: 'Anthropic API',
        realtime: 'Python-SocketIO'
    },
    infrastructure: {
        edge: 'Cloudflare Workers',
        tunnel: 'Cloudflare Tunnel',
        database: 'D1 (SQLite edge)',
        deployment: 'Wrangler',
        domain: 'sunny-stack.com'
    }
};
```

### PROJECT-SPECIFIC DEVELOPMENT CONSTRAINTS
```markdown
## Critical Development Rules
1. NEVER start servers in Claude Code (kills sessions)
2. Server management is Luke's responsibility exclusively
3. Claude Code focuses on file creation/modification only
4. Always validate Cloudflare tunnel ingress after changes
5. Maintain separate frontend (3000) and backend (8000) ports
```

### PERFORMANCE BASELINES FOR SUNNY STACK
```javascript
// Sunny Stack Performance Requirements
const performanceStandards = {
    frontend: {
        renderTime: '<16ms for 60fps',
        interactionResponse: '<100ms',
        pageLoad: '<3s initial load',
        bundleSize: '<500KB gzipped'
    },
    backend: {
        apiResponse: '<200ms standard',
        aiResponse: '<5s for Claude API',
        websocketLatency: '<50ms',
        databaseQuery: '<100ms'
    },
    infrastructure: {
        edgeResponse: '<50ms globally',
        tunnelLatency: '<100ms',
        uptime: '99.9% SLA'
    }
};
```

---

## SUNNY STACK INVESTIGATION PROTOCOL

### PRE-IMPLEMENTATION INVESTIGATION (MANDATORY)

#### INVESTIGATION CHECKLIST FOR SUNNY STACK
Before ANY code modification:

- [ ] **Frontend Architecture Analysis**
  - Next.js component structure mapped
  - React component dependencies identified
  - Zustand store state flow documented
  - TanStack Query cache patterns understood

- [ ] **Backend Architecture Analysis**
  - FastAPI route structure documented
  - SQLAlchemy models relationships mapped
  - Authentication flow verified
  - WebSocket event handlers identified

- [ ] **Infrastructure Impact Assessment**
  - Cloudflare tunnel routing verified
  - Worker edge function impact assessed
  - D1 database operations reviewed
  - Cross-service communication validated

- [ ] **Full Stack Integration Planning**
  - Frontend-to-backend API contracts defined
  - State synchronization strategy established
  - Error propagation handling planned
  - Performance impact across stack measured

### INVESTIGATION DOCUMENTATION TEMPLATE FOR SUNNY STACK

```markdown
# INVESTIGATION: [Feature/Bug/Task Name]
**Date**: [Current Date]
**Investigator**: Claude Code
**Stack Layer**: [Frontend/Backend/Infrastructure/Full Stack]

## 1. CURRENT STATE ANALYSIS
### Frontend State
- React component: [Component name and location]
- Current behavior: [How it works now]
- State management: [Zustand store involvement]
- API integration: [Current endpoints used]

### Backend State
- FastAPI endpoint: [Route and method]
- Business logic: [Current implementation]
- Database operations: [SQLAlchemy queries]
- Authentication: [JWT/session handling]

### Infrastructure State
- Cloudflare routing: [Current ingress rules]
- Edge function: [Worker involvement]
- Tunnel configuration: [Current setup]

## 2. PROBLEM DEFINITION
[Clear problem statement with evidence from both frontend and backend]

## 3. INVESTIGATION FINDINGS
### Frontend Analysis
[React component investigation results]

### Backend Analysis
[FastAPI endpoint investigation results]

### Infrastructure Analysis
[Cloudflare/tunnel investigation results]

## 4. PROPOSED SOLUTION
### Frontend Changes
[React/Next.js modifications with justification]

### Backend Changes
[FastAPI/Python modifications with justification]

### Infrastructure Changes
[Cloudflare configuration updates if needed]

## 5. IMPACT ASSESSMENT
### Cross-Stack Impact
- Frontend components affected: [List]
- Backend endpoints affected: [List]
- Database schema changes: [If any]
- Infrastructure routing changes: [If any]

### Performance Impact
- Frontend render performance: [Measurement]
- API response time: [Measurement]
- Database query impact: [Analysis]
- Edge latency: [Projection]

## 6. IMPLEMENTATION PLAN
### Phase 1: Backend Implementation
1. [Step-by-step FastAPI changes]
2. [Database migration if needed]
3. [API contract updates]

### Phase 2: Frontend Implementation
1. [Step-by-step React changes]
2. [State management updates]
3. [UI/UX modifications]

### Phase 3: Integration Testing
1. [Full stack testing plan]
2. [Performance verification]
3. [Error scenario validation]

## 7. SUCCESS METRICS
- [ ] All API endpoints respond < 200ms
- [ ] Frontend interactions respond < 100ms
- [ ] Zero console errors in production
- [ ] All tests passing
- [ ] User workflow functions end-to-end

## 8. RISK MITIGATION
### Identified Risks
- [Risk 1]: [Mitigation strategy]
- [Risk 2]: [Mitigation strategy]

### Rollback Plan
[Step-by-step rollback procedure if needed]
```

---

## SUNNY STACK DEBUGGING STANDARDS

### REACT/NEXT.JS COMPONENT DEBUGGING
```typescript
// Mandatory Next.js Component Debugging Pattern
'use client';

import { useEffect } from 'react';

export default function SunnyComponent({ props }: ComponentProps) {
    // MANDATORY: Component render logging
    console.log('🔧 [RENDER] SunnyComponent', { 
        props, 
        timestamp: new Date().toISOString() 
    });
    
    // MANDATORY: Lifecycle logging
    useEffect(() => {
        console.log('🔧 [MOUNT] SunnyComponent initialized');
        
        return () => {
            console.log('🔧 [UNMOUNT] SunnyComponent cleanup');
        };
    }, []);
    
    // MANDATORY: Event handler logging
    const handleUserAction = async (event: React.MouseEvent) => {
        console.log('🎯 [EVENT] User action triggered', { 
            target: event.currentTarget,
            timestamp: Date.now() 
        });
        
        const startTime = performance.now();
        
        try {
            // API call with logging
            console.log('⚡ [API] Calling backend endpoint');
            const response = await fetch('/api/endpoint');
            const data = await response.json();
            
            const executionTime = performance.now() - startTime;
            console.log('✅ [SUCCESS] Action completed', { 
                executionTime: `${executionTime}ms`,
                data 
            });
            
        } catch (error) {
            console.error('🚨 [ERROR] Action failed', { 
                error,
                component: 'SunnyComponent' 
            });
        }
    };
    
    return <div onClick={handleUserAction}>Content</div>;
}
```

### FASTAPI ENDPOINT DEBUGGING
```python
# Mandatory FastAPI Endpoint Debugging Pattern
from fastapi import FastAPI, Request
from datetime import datetime
import time
import logging

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/api/endpoint")
async def sunny_endpoint(request: Request, data: RequestModel):
    """Sunny Stack API endpoint with comprehensive debugging"""
    
    # MANDATORY: Entry logging
    start_time = time.time()
    logger.info(f"⚡ [ENTRY] /api/endpoint", extra={
        "method": request.method,
        "path": request.url.path,
        "data": data.dict(),
        "timestamp": datetime.utcnow().isoformat(),
        "user": getattr(request.state, "user", None)
    })
    
    try:
        # MANDATORY: State logging before processing
        logger.info(f"📊 [STATE] Before processing", extra={
            "database_state": await get_db_state(),
            "cache_state": await get_cache_state()
        })
        
        # Business logic execution
        result = await process_business_logic(data)
        
        # MANDATORY: State logging after processing
        logger.info(f"📊 [STATE] After processing", extra={
            "changes_made": result.changes,
            "affected_records": result.affected_count
        })
        
        # MANDATORY: Performance logging
        execution_time = (time.time() - start_time) * 1000
        logger.info(f"✅ [EXIT] /api/endpoint", extra={
            "execution_time_ms": execution_time,
            "result_size": len(str(result)),
            "success": True
        })
        
        return {"success": True, "data": result}
        
    except Exception as e:
        # MANDATORY: Error logging
        execution_time = (time.time() - start_time) * 1000
        logger.error(f"🚨 [ERROR] /api/endpoint failed", extra={
            "error": str(e),
            "error_type": type(e).__name__,
            "execution_time_ms": execution_time,
            "traceback": traceback.format_exc()
        })
        raise HTTPException(status_code=500, detail=str(e))
```

### ZUSTAND STATE MANAGEMENT DEBUGGING
```typescript
// Mandatory Zustand Store Debugging
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SunnyStore {
    // State
    user: User | null;
    isLoading: boolean;
    
    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useSunnyStore = create<SunnyStore>()(
    devtools(
        (set, get) => ({
            user: null,
            isLoading: false,
            
            setUser: (user) => {
                // MANDATORY: State change logging
                console.log('🔧 [STORE] Setting user', { 
                    previousUser: get().user,
                    newUser: user,
                    timestamp: Date.now()
                });
                
                set({ user }, false, 'setUser');
            },
            
            setLoading: (loading) => {
                // MANDATORY: Loading state logging
                console.log('🔧 [STORE] Loading state changed', { 
                    from: get().isLoading,
                    to: loading 
                });
                
                set({ isLoading: loading }, false, 'setLoading');
            }
        }),
        {
            name: 'sunny-store', // Redux DevTools integration
        }
    )
);
```

### WEBSOCKET DEBUGGING
```python
# Mandatory Socket.IO Debugging
import socketio
from datetime import datetime

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@sio.event
async def connect(sid, environ):
    """Handle WebSocket connection with debugging"""
    logger.info(f"🌐 [WEBSOCKET] Client connected", extra={
        "sid": sid,
        "timestamp": datetime.utcnow().isoformat(),
        "origin": environ.get('HTTP_ORIGIN')
    })

@sio.event
async def message(sid, data):
    """Handle WebSocket message with debugging"""
    start_time = time.time()
    
    logger.info(f"📨 [WEBSOCKET] Message received", extra={
        "sid": sid,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    try:
        result = await process_websocket_message(data)
        
        execution_time = (time.time() - start_time) * 1000
        logger.info(f"📤 [WEBSOCKET] Sending response", extra={
            "sid": sid,
            "execution_time_ms": execution_time,
            "response_size": len(str(result))
        })
        
        await sio.emit('response', result, to=sid)
        
    except Exception as e:
        logger.error(f"🚨 [WEBSOCKET] Error processing message", extra={
            "sid": sid,
            "error": str(e),
            "data": data
        })
```

---

## CRISIS MANAGEMENT PROTOCOLS FOR SUNNY STACK

### FRONTEND CONSOLE ERROR CRISIS
When encountering React/Next.js console errors:

```markdown
## IMMEDIATE ACTION PROTOCOL - FRONTEND
1. STOP all frontend development
2. COUNT total console errors in browser DevTools
3. CATEGORIZE by component and severity
   - Critical: Breaks user interaction
   - High: Visible UI issues
   - Medium: State inconsistencies
   - Low: Development warnings
4. FIX systematically starting with critical
   - Fix React hooks violations first
   - Resolve TypeScript errors second
   - Address state management issues third
5. VERIFY with full user journey test
```

### BACKEND API ERROR CRISIS
When FastAPI endpoints fail:

```markdown
## IMMEDIATE ACTION PROTOCOL - BACKEND
1. STOP all backend development
2. CHECK Uvicorn logs for exceptions
3. ANALYZE error patterns
   - 500 errors: Server exceptions
   - 422 errors: Validation failures
   - 401/403: Authentication issues
   - Database connection errors
4. FIX in priority order
   - Database connectivity first
   - Authentication flow second
   - Business logic third
5. VERIFY all endpoints with Postman/curl
```

### CLOUDFLARE TUNNEL CRISIS
When tunnel connectivity fails:

```markdown
## IMMEDIATE ACTION PROTOCOL - INFRASTRUCTURE
1. VALIDATE tunnel configuration
   ```bash
   cloudflared tunnel ingress validate --config trinity-config.yml
   ```
2. CHECK tunnel status
   ```bash
   cloudflared tunnel info trinity
   ```
3. VERIFY routing rules
   - sunny-stack.com → localhost:3000
   - api.sunny-stack.com → localhost:8000
4. TEST external access
   ```bash
   curl https://sunny-stack.com/health
   curl https://api.sunny-stack.com/health
   ```
5. RESTART tunnel if needed (Luke's responsibility)
```

### PERFORMANCE DEGRADATION CRISIS
When performance falls below standards:

```markdown
## PERFORMANCE RECOVERY PROTOCOL
1. MEASURE current metrics
   - React DevTools Profiler for frontend
   - FastAPI metrics endpoint for backend
   - Cloudflare Analytics for edge
2. IDENTIFY bottlenecks
   - Frontend: Bundle size, render cycles
   - Backend: Database queries, AI API calls
   - Infrastructure: Tunnel latency, edge caching
3. IMPLEMENT optimizations
   - Frontend: Code splitting, memoization
   - Backend: Query optimization, caching
   - Infrastructure: Edge caching rules
4. VERIFY improvements meet standards
```

---

## CONTINUOUS IMPROVEMENT FOR SUNNY STACK

### SESSION DOCUMENTATION
Every development session MUST produce:

```markdown
# CHAT LOG: Sunny Stack - [Date] - [Session ID]

## SESSION SUMMARY
- Frontend changes: [React components modified]
- Backend changes: [FastAPI endpoints modified]
- Infrastructure changes: [Cloudflare config updates]
- Tests added/modified: [Test coverage changes]

## INVESTIGATION RESULTS
### Frontend Investigations
[React/Next.js findings]

### Backend Investigations
[FastAPI/Python findings]

### Infrastructure Investigations
[Cloudflare/tunnel findings]

## IMPLEMENTATION DECISIONS
### Technical Stack Choices
- Why Next.js for [feature]: [Justification]
- Why FastAPI for [endpoint]: [Justification]
- State management approach: [Reasoning]

## PATTERNS DISCOVERED
### Frontend Patterns
- Successful React patterns
- Effective state management
- Performance optimizations

### Backend Patterns
- Efficient FastAPI patterns
- Database query optimizations
- Authentication improvements

## NEXT SESSION REQUIREMENTS
### Outstanding Frontend Tasks
- [ ] React components to complete
- [ ] State management updates needed

### Outstanding Backend Tasks
- [ ] FastAPI endpoints to implement
- [ ] Database migrations required

### Outstanding Infrastructure Tasks
- [ ] Cloudflare configuration updates
- [ ] Performance optimizations needed
```

### PATTERN LIBRARY DEVELOPMENT
Extract and document successful patterns:

```markdown
## SUNNY STACK PATTERN LIBRARY

### Frontend Patterns
1. **Optimistic UI Updates**
   - Update UI immediately
   - Sync with backend async
   - Rollback on failure

2. **API Hook Pattern**
   ```typescript
   const useApiEndpoint = () => {
       return useMutation({
           mutationFn: async (data) => {
               const response = await fetch('/api/endpoint', {
                   method: 'POST',
                   body: JSON.stringify(data)
               });
               return response.json();
           },
           onSuccess: (data) => {
               queryClient.invalidateQueries(['endpoint']);
           }
       });
   };
   ```

### Backend Patterns
1. **Dependency Injection**
   ```python
   async def get_current_user(
       token: str = Depends(oauth2_scheme),
       db: Session = Depends(get_db)
   ) -> User:
       # Reusable authentication dependency
   ```

2. **Response Model Pattern**
   ```python
   class APIResponse(BaseModel):
       success: bool
       data: Optional[Any] = None
       error: Optional[str] = None
       timestamp: datetime = Field(default_factory=datetime.utcnow)
   ```

### Infrastructure Patterns
1. **Health Check Endpoints**
   - Frontend: /api/health
   - Backend: /health
   - Combined: /status

2. **Tunnel Routing Rules**
   - Static assets: Edge cached
   - API calls: Direct proxy
   - WebSocket: Persistent connection
```

---

## QUALITY GATES FOR SUNNY STACK

### PRE-COMMIT CHECKLIST
Before ANY code commit:
- [ ] TypeScript compilation successful (frontend)
- [ ] Python type hints validated (backend)
- [ ] All tests passing (frontend + backend)
- [ ] Debugging implemented and verified
- [ ] Performance standards met
- [ ] Zero console errors
- [ ] Cloudflare tunnel validated
- [ ] User experience audit passed

### DEPLOYMENT VERIFICATION
Before deployment:
- [ ] Full stack integration tested
- [ ] Performance benchmarks met
  - Frontend: <100ms interactions
  - Backend: <200ms API responses
  - Edge: <50ms global response
- [ ] Error monitoring configured
- [ ] Rollback plan prepared
- [ ] Documentation updated

---

## ENFORCEMENT AND COMPLIANCE

### MANDATORY PROMPTS FOR SUNNY STACK
Always include in Claude Code requests:

```
CRITICAL REQUIREMENTS FOR SUNNY STACK:
1. Conduct FULL investigation across Next.js frontend AND FastAPI backend before implementation
2. Add comprehensive debugging to ALL React components AND Python endpoints
3. Test ENTIRE user workflow from UI through API to database
4. Verify zero console errors in browser AND server logs
5. Validate Cloudflare tunnel ingress after infrastructure changes
6. Document all decisions with evidence from both frontend and backend
7. NEVER start servers in Claude Code (use Luke's startup scripts)
```

### VERIFICATION COMMANDS FOR SUNNY STACK
Use these to ensure compliance:

```bash
# Frontend verification
cd frontend
npm run type-check        # TypeScript validation
npm run lint              # ESLint checks
npm run build            # Production build test

# Backend verification
cd backend
python -m pytest         # Run tests
python -m mypy .        # Type checking
python validate_environment.py  # Environment check

# Infrastructure verification
cloudflared tunnel ingress validate --config trinity-config.yml
curl https://sunny-stack.com/health
curl https://api.sunny-stack.com/health

# Full stack verification
./status-sunny.sh       # Check all services (Luke runs this)
```

---

## SUNNY STACK SPECIFIC COMMANDS

### DEVELOPMENT WORKFLOW
```bash
# Luke's responsibility (NOT Claude Code)
./startup-sunny.sh      # Start all services
./status-sunny.sh       # Check service status
./stop-sunny.sh         # Stop all services

# Claude Code can use these
git status              # Check changes
git add .               # Stage changes
git commit -m "message" # Commit changes
git push origin dev     # Push to repository
```

### INVESTIGATION COMMANDS
```bash
# Start frontend investigation
Investigate Next.js component [ComponentName] for [issue/feature]. Check React hooks, state management, API integration, and performance.

# Start backend investigation
Investigate FastAPI endpoint [/api/endpoint] for [issue/feature]. Analyze request handling, business logic, database queries, and response formatting.

# Start full stack investigation
Investigate full stack flow for [feature] from React UI through FastAPI backend to database. Document data flow, state changes, and integration points.
```

### CRISIS RECOVERY COMMANDS
```bash
# Frontend console error crisis
Execute Frontend Console Error Crisis Protocol for Sunny Stack. Stop development, assess React errors, fix by component priority, verify with full UI test.

# Backend API error crisis
Execute Backend API Error Crisis Protocol for Sunny Stack. Check FastAPI logs, analyze error patterns, fix endpoints by priority, verify with API tests.

# Performance crisis
Execute Performance Crisis Protocol for Sunny Stack. Measure React + FastAPI metrics, identify bottlenecks, implement optimizations, verify improvements.
```

---

## MULTI-PROJECT CONTEXT

### ACTIVE SUNNY STACK PROJECTS
1. **Main Platform** - AI consulting platform (sunny-stack.com)
2. **Navigator's Helm** - Industrial equipment intelligence
3. **Rinoa** - Single-user equipment platform
4. **Cola Records HUD** - Multi-project management interface

### PROJECT SWITCHING PROTOCOL
```markdown
When switching between Sunny Stack projects:
1. Save current project state
2. Document session findings
3. Update project-specific Sunny.md
4. Load new project context
5. Review project Claude.md
6. Continue with Trinity Method
```

---

**Sunny Stack Trinity Method v7.0 - Professional Full Stack Development Through Systematic Excellence**

**Remember: No updates without investigation. No changes without Trinity consensus. No shortcuts without consequences.**

**Stack-Specific Rule: NEVER start servers in Claude Code. File operations only.**