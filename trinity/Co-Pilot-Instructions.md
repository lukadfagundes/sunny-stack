<<<<<<< HEAD
# Co-Pilot Instructions - Sunny Stack Trinity Method v7.0

## 🔥 INVESTIGATION-FIRST DEVELOPMENT METHODOLOGY

**Core Principle**: No updates without investigation. No changes without Trinity consensus. No shortcuts without consequences.

This document provides comprehensive instructions for AI assistants (Claude Code, GitHub Copilot, other AI tools) working on the Sunny Stack platform. Following these instructions ensures professional, systematic, and high-quality development.

---

## 🚨 CRITICAL ENFORCEMENT PROTOCOLS

### ⚠️ MANDATORY FULL SYSTEM TESTING

**EVERY implementation MUST include:**

```markdown
MANDATORY PROTOCOL: After ANY code modification:
1. Test ENTIRE affected user workflow end-to-end
2. Verify ALL component interactions function correctly
3. Confirm ALL data flows operate as expected
4. Validate ALL error scenarios handle gracefully
5. Check performance metrics remain within baselines
```

### ⚠️ MANDATORY DEBUGGING IMPLEMENTATION

**EVERY function/component MUST include:**

```javascript
// React Component Example
const MyComponent: React.FC<Props> = ({ props }) => {
  console.log('🔧 [MyComponent] Rendering:', { props, timestamp: Date.now() })
  
  useEffect(() => {
    console.log('🔧 [MyComponent] Mounted')
    return () => console.log('🔧 [MyComponent] Unmounted')
  }, [])
  
  const handleAction = (event) => {
    console.log('⚡ [MyComponent] Action triggered:', event)
    const startTime = performance.now()
    
    try {
      // Action logic
      const duration = performance.now() - startTime
      console.log(`✅ [MyComponent] Action completed (${duration.toFixed(2)}ms)`)
    } catch (error) {
      console.error('🚨 [MyComponent] Action failed:', error)
      throw error
    }
  }
  
  return <div onClick={handleAction}>{/* Component JSX */}</div>
}
```

```python
# FastAPI Endpoint Example
@router.post("/api/endpoint")
async def endpoint_handler(request: RequestSchema):
    print(f"⚡ [API] Request received: {request.dict()}")
    start_time = time.time()
    
    try:
        # Endpoint logic
        result = await process_request(request)
        duration = time.time() - start_time
        print(f"✅ [API] Request completed ({duration:.3f}s)")
        return result
    except Exception as e:
        print(f"🚨 [API] Request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### ⚠️ USER EXPERIENCE AUDIT REQUIREMENTS

**Post-implementation audit MUST verify:**

- ✅ **Full Workflow Testing**: Complete user journey from start to finish
- ✅ **Component Verification**: All UI elements respond correctly
- ✅ **Data Persistence**: Information correctly saved and retrieved
- ✅ **Error Recovery**: Graceful handling of all error conditions
- ✅ **Performance Standards**: Sub-100ms response for all operations
- ✅ **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge compatibility
- ✅ **Mobile Responsiveness**: Full functionality on mobile devices
- ✅ **Accessibility**: WCAG 2.1 AA compliance

---

## 📋 SUNNY STACK SPECIFIC PROTOCOLS

### Project Technology Stack
- **Frontend**: Next.js 15.0 + React 19.0 + TypeScript
- **Backend**: FastAPI 0.104.1 + Python 3.11+
- **State**: Zustand 5.0
- **Auth**: NextAuth.js 5.0 + JWT
- **Styling**: Tailwind CSS 3.4
- **Infrastructure**: Cloudflare Tunnel
- **Real-time**: Socket.io

### NEVER START SERVERS IN CLAUDE CODE
```bash
# ❌ PROHIBITED COMMANDS (kills Claude session):
./startup-sunny.sh
npm run dev
npm start
uvicorn main:app
python -m uvicorn
next dev

# ✅ ALLOWED COMMANDS:
git status
git add/commit/push
grep/find/ls
cat/head/tail (for reading)
npm run build (without start)
=======
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
>>>>>>> dev
```

---

<<<<<<< HEAD
## 🔍 UNIVERSAL INVESTIGATION PROTOCOL

### PRE-IMPLEMENTATION INVESTIGATION (MANDATORY)

Before writing ANY code, complete this investigation:

#### 1. SYSTEM STATE ANALYSIS
```markdown
## Current State Investigation
- [ ] Document current component/feature state
- [ ] Map all dependencies and relationships
- [ ] Measure current performance baseline
- [ ] Identify existing patterns and conventions
- [ ] Review related components for consistency
```

#### 2. CHANGE IMPACT ASSESSMENT
```markdown
## Impact Analysis
- [ ] List all components affected by change
- [ ] Assess performance impact (positive/negative)
- [ ] Identify potential breaking changes
- [ ] Evaluate security implications
- [ ] Consider backward compatibility
```

#### 3. IMPLEMENTATION PLANNING
```markdown
## Implementation Strategy
- [ ] Define evidence-based approach
- [ ] Create step-by-step implementation plan
- [ ] Establish success metrics
- [ ] Prepare rollback strategy
- [ ] Document testing approach
```

### INVESTIGATION DOCUMENTATION TEMPLATE
=======
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
>>>>>>> dev

```markdown
# INVESTIGATION: [Feature/Bug/Task Name]
**Date**: [Current Date]
**Investigator**: Claude Code
<<<<<<< HEAD
**Stack**: Next.js + FastAPI

## 1. CURRENT STATE ANALYSIS
### Component Location
- Frontend: `frontend/[path]`
- Backend: `backend/[path]`

### Dependencies
- React components: [list]
- API endpoints: [list]
- State management: [list]

### Performance Baseline
- Load time: [X]ms
- Render time: [X]ms
- API response: [X]ms

## 2. PROBLEM DEFINITION
[Clear problem statement with evidence]

## 3. INVESTIGATION FINDINGS
### Root Cause
[Evidence-based determination]

### Related Issues
[Connected problems or dependencies]

## 4. PROPOSED SOLUTION
### Approach
[Detailed implementation strategy]

### Justification
[Why this approach over alternatives]

## 5. IMPACT ASSESSMENT
### Components Affected
- Frontend: [list with specifics]
- Backend: [list with specifics]
- Database: [changes if any]

### Performance Impact
- Expected improvement/degradation: [metrics]
- Memory impact: [assessment]
- Network impact: [assessment]

## 6. IMPLEMENTATION PLAN
1. [Step with verification]
2. [Step with verification]
3. [Step with verification]

## 7. SUCCESS METRICS
- [ ] Metric 1: [measurable outcome]
- [ ] Metric 2: [measurable outcome]
- [ ] Metric 3: [measurable outcome]

## 8. RISK MITIGATION
### Identified Risks
1. Risk: [description]
   Mitigation: [strategy]
2. Risk: [description]
   Mitigation: [strategy]

### Rollback Plan
[Step-by-step rollback procedure]
=======
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
>>>>>>> dev
```

---

<<<<<<< HEAD
## 🛠️ SUNNY STACK DEVELOPMENT PATTERNS

### React Component Pattern (Next.js)
```typescript
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import type { ComponentProps } from '@/types'

interface MyComponentProps extends ComponentProps {
  data: DataType
  onAction?: (result: ResultType) => void
}

/**
 * MyComponent - Description of component purpose
 * 
 * @param data - Input data for component
 * @param onAction - Callback for action completion
 */
export const MyComponent: React.FC<MyComponentProps> = ({ 
  data, 
  onAction 
}) => {
  // Debug logging for development
  console.log('🔧 [MyComponent] Rendering:', { data })
  
  // Local state
  const [localState, setLocalState] = useState<StateType>(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Global state from Zustand
  const { user, projects, updateProject } = useStore()
  
  // Memoized values for performance
  const computedValue = useMemo(() => {
    console.log('📊 [MyComponent] Computing value')
    return expensiveComputation(data)
  }, [data])
  
  // Lifecycle logging
  useEffect(() => {
    console.log('🔧 [MyComponent] Component mounted')
    
    // Setup logic
    const initialize = async () => {
      try {
        setIsLoading(true)
        const result = await api.get('/endpoint')
        console.log('✅ [MyComponent] Data loaded:', result)
        setLocalState(result)
      } catch (err) {
        console.error('🚨 [MyComponent] Failed to load:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    initialize()
    
    // Cleanup
    return () => {
      console.log('🔧 [MyComponent] Component unmounting')
      // Cleanup logic
    }
  }, [])
  
  // Callbacks with performance tracking
  const handleAction = useCallback(async (event: React.MouseEvent) => {
    console.log('⚡ [MyComponent] Action triggered')
    const startTime = performance.now()
    
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await api.post('/endpoint', {
        data: localState
      })
      
      const duration = performance.now() - startTime
      console.log(`✅ [MyComponent] Action completed (${duration.toFixed(2)}ms)`)
      
      // Update global state
      updateProject(result)
      
      // Call parent callback
      onAction?.(result)
      
    } catch (err) {
      console.error('🚨 [MyComponent] Action failed:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [localState, updateProject, onAction])
  
  // Error boundary
  if (error) {
    return (
      <div className="error-container p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">🚨 Error: {error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    )
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }
  
  // Main render
  return (
    <div className="component-container">
      <h2 className="text-2xl font-bold mb-4">Component Title</h2>
      
      <div className="content-area">
        {computedValue && (
          <div className="computed-display">
            {computedValue}
          </div>
        )}
      </div>
      
      <button
        onClick={handleAction}
        disabled={isLoading}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Perform Action
      </button>
    </div>
  )
}

// Default export for lazy loading
export default MyComponent
```

### FastAPI Endpoint Pattern
```python
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from datetime import datetime
import time

from app.models import ResourceSchema, CreateResourceSchema, UpdateResourceSchema
from app.services import resource_service
from app.auth import get_current_user
from app.utils import logger

router = APIRouter(
    prefix="/api/resources",
    tags=["resources"]
)

@router.get(
    "/",
    response_model=List[ResourceSchema],
    summary="Get all resources",
    description="Retrieve all resources with optional filtering and pagination"
)
async def get_resources(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get all resources with pagination and filtering.
    
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    - **search**: Optional search term
    """
    # Debug logging
    print(f"⚡ [API] GET /resources - User: {current_user.email}")
    print(f"📊 [API] Parameters: skip={skip}, limit={limit}, search={search}")
    
    start_time = time.time()
    
    try:
        # Business logic with service layer
        resources = await resource_service.get_all(
            skip=skip,
            limit=limit,
            search=search,
            user_id=current_user.id
        )
        
        # Performance logging
        duration = time.time() - start_time
        print(f"✅ [API] Retrieved {len(resources)} resources in {duration:.3f}s")
        
        # Add performance header
        if request:
            request.state.performance_time = duration
        
        return resources
        
    except Exception as e:
        print(f"🚨 [API] Error retrieving resources: {e}")
        logger.error(f"Failed to get resources for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve resources"
        )

@router.post(
    "/",
    response_model=ResourceSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create new resource",
    description="Create a new resource for the authenticated user"
)
async def create_resource(
    resource_data: CreateResourceSchema,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """
    Create a new resource.
    
    Returns the created resource with generated ID and timestamps.
    """
    print(f"⚡ [API] POST /resources - User: {current_user.email}")
    print(f"📊 [API] Creating resource: {resource_data.name}")
    
    start_time = time.time()
    
    try:
        # Validate input
        if not resource_data.name or len(resource_data.name) < 3:
            raise ValueError("Resource name must be at least 3 characters")
        
        # Create resource
        new_resource = await resource_service.create(
            resource_data=resource_data,
            user_id=current_user.id
        )
        
        # Add background task if needed
        if background_tasks:
            background_tasks.add_task(
                notify_resource_created,
                resource_id=new_resource.id,
                user_email=current_user.email
            )
        
        duration = time.time() - start_time
        print(f"✅ [API] Resource created: {new_resource.id} in {duration:.3f}s")
        
        return new_resource
        
    except ValueError as e:
        print(f"⚠️ [API] Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"🚨 [API] Error creating resource: {e}")
        logger.error(f"Failed to create resource for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create resource"
        )

@router.put(
    "/{resource_id}",
    response_model=ResourceSchema,
    summary="Update resource",
    description="Update an existing resource"
)
async def update_resource(
    resource_id: str,
    updates: UpdateResourceSchema,
    current_user: User = Depends(get_current_user)
):
    """Update an existing resource."""
    print(f"⚡ [API] PUT /resources/{resource_id} - User: {current_user.email}")
    
    try:
        # Check ownership
        existing = await resource_service.get_by_id(resource_id)
        if not existing or existing.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        # Update resource
        updated = await resource_service.update(
            resource_id=resource_id,
            updates=updates
        )
        
        print(f"✅ [API] Resource updated: {resource_id}")
        return updated
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🚨 [API] Error updating resource: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update resource"
        )

@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete resource",
    description="Delete a resource"
)
async def delete_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a resource."""
    print(f"⚡ [API] DELETE /resources/{resource_id} - User: {current_user.email}")
    
    try:
        # Check ownership
        existing = await resource_service.get_by_id(resource_id)
        if not existing or existing.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        # Delete resource
        await resource_service.delete(resource_id)
        
        print(f"✅ [API] Resource deleted: {resource_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🚨 [API] Error deleting resource: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete resource"
        )
```

### Zustand Store Pattern
```typescript
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { api } from '@/lib/api'

// Types
interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

interface AppState {
  // Authentication State
  user: User | null
  isAuthenticated: boolean
  authToken: string | null
  
  // Application State
  projects: Project[]
  currentProject: Project | null
  
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
  
  // Loading State
  isLoading: {
    auth: boolean
    projects: boolean
    [key: string]: boolean
  }
  
  // Error State
  errors: {
    auth: string | null
    projects: string | null
    [key: string]: string | null
  }
  
  // Actions
  // Auth Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  
  // Project Actions
  loadProjects: () => Promise<void>
  createProject: (data: CreateProjectDto) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  selectProject: (project: Project | null) => void
  
  // UI Actions
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  
  // Utility Actions
  setLoading: (key: string, value: boolean) => void
  setError: (key: string, error: string | null) => void
  clearErrors: () => void
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial State
          user: null,
          isAuthenticated: false,
          authToken: null,
          projects: [],
          currentProject: null,
          sidebarOpen: true,
          theme: 'light',
          notifications: [],
          isLoading: {
            auth: false,
            projects: false
          },
          errors: {
            auth: null,
            projects: null
          },
          
          // Auth Actions
          login: async (email, password) => {
            console.log('🔐 [Store] Login attempt:', email)
            
            set(state => {
              state.isLoading.auth = true
              state.errors.auth = null
            })
            
            try {
              const response = await api.post('/auth/login', {
                email,
                password
              })
              
              console.log('✅ [Store] Login successful')
              
              set(state => {
                state.user = response.user
                state.authToken = response.token
                state.isAuthenticated = true
                state.isLoading.auth = false
              })
              
              // Load user data after login
              get().loadProjects()
              
            } catch (error) {
              console.error('🚨 [Store] Login failed:', error)
              
              set(state => {
                state.errors.auth = error.message
                state.isLoading.auth = false
              })
              
              throw error
            }
          },
          
          logout: () => {
            console.log('🔐 [Store] Logging out')
            
            set(state => {
              state.user = null
              state.authToken = null
              state.isAuthenticated = false
              state.projects = []
              state.currentProject = null
            })
            
            // Clear API token
            api.setToken(null)
          },
          
          refreshAuth: async () => {
            console.log('🔐 [Store] Refreshing authentication')
            
            try {
              const response = await api.post('/auth/refresh')
              
              set(state => {
                state.authToken = response.token
              })
              
              console.log('✅ [Store] Auth refreshed')
              
            } catch (error) {
              console.error('🚨 [Store] Auth refresh failed:', error)
              get().logout()
            }
          },
          
          // Project Actions
          loadProjects: async () => {
            console.log('📊 [Store] Loading projects')
            
            set(state => {
              state.isLoading.projects = true
              state.errors.projects = null
            })
            
            try {
              const projects = await api.get<Project[]>('/projects')
              
              console.log(`✅ [Store] Loaded ${projects.length} projects`)
              
              set(state => {
                state.projects = projects
                state.isLoading.projects = false
              })
              
            } catch (error) {
              console.error('🚨 [Store] Failed to load projects:', error)
              
              set(state => {
                state.errors.projects = error.message
                state.isLoading.projects = false
              })
            }
          },
          
          createProject: async (projectData) => {
            console.log('🎯 [Store] Creating project:', projectData.name)
            
            set(state => {
              state.isLoading.projects = true
              state.errors.projects = null
            })
            
            try {
              const newProject = await api.post<Project>('/projects', projectData)
              
              console.log('✅ [Store] Project created:', newProject.id)
              
              set(state => {
                state.projects.push(newProject)
                state.isLoading.projects = false
              })
              
              // Add success notification
              get().addNotification({
                id: Date.now().toString(),
                type: 'success',
                message: `Project "${newProject.name}" created successfully`
              })
              
              return newProject
              
            } catch (error) {
              console.error('🚨 [Store] Failed to create project:', error)
              
              set(state => {
                state.errors.projects = error.message
                state.isLoading.projects = false
              })
              
              throw error
            }
          },
          
          updateProject: async (id, updates) => {
            console.log('🔄 [Store] Updating project:', id)
            
            try {
              const updated = await api.put<Project>(`/projects/${id}`, updates)
              
              set(state => {
                const index = state.projects.findIndex(p => p.id === id)
                if (index !== -1) {
                  state.projects[index] = updated
                }
                
                if (state.currentProject?.id === id) {
                  state.currentProject = updated
                }
              })
              
              console.log('✅ [Store] Project updated')
              
            } catch (error) {
              console.error('🚨 [Store] Failed to update project:', error)
              throw error
            }
          },
          
          deleteProject: async (id) => {
            console.log('🗑️ [Store] Deleting project:', id)
            
            try {
              await api.delete(`/projects/${id}`)
              
              set(state => {
                state.projects = state.projects.filter(p => p.id !== id)
                
                if (state.currentProject?.id === id) {
                  state.currentProject = null
                }
              })
              
              console.log('✅ [Store] Project deleted')
              
            } catch (error) {
              console.error('🚨 [Store] Failed to delete project:', error)
              throw error
            }
          },
          
          selectProject: (project) => {
            console.log('📁 [Store] Selecting project:', project?.name || 'none')
            
            set(state => {
              state.currentProject = project
            })
          },
          
          // UI Actions
          toggleSidebar: () => {
            set(state => {
              state.sidebarOpen = !state.sidebarOpen
            })
          },
          
          setTheme: (theme) => {
            console.log('🎨 [Store] Setting theme:', theme)
            
            set(state => {
              state.theme = theme
            })
            
            // Apply theme to document
            document.documentElement.classList.toggle('dark', theme === 'dark')
          },
          
          addNotification: (notification) => {
            set(state => {
              state.notifications.push(notification)
            })
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
              get().removeNotification(notification.id)
            }, 5000)
          },
          
          removeNotification: (id) => {
            set(state => {
              state.notifications = state.notifications.filter(n => n.id !== id)
            })
          },
          
          // Utility Actions
          setLoading: (key, value) => {
            set(state => {
              state.isLoading[key] = value
            })
          },
          
          setError: (key, error) => {
            set(state => {
              state.errors[key] = error
            })
          },
          
          clearErrors: () => {
            set(state => {
              state.errors = {
                auth: null,
                projects: null
              }
            })
          }
        }))
      ),
      {
        name: 'sunny-stack-storage',
        partialize: (state) => ({
          user: state.user,
          authToken: state.authToken,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen
        })
      }
    ),
    {
      name: 'SunnyStackStore'
    }
  )
)

// Selectors for performance optimization
export const selectUser = (state: AppState) => state.user
export const selectProjects = (state: AppState) => state.projects
export const selectCurrentProject = (state: AppState) => state.currentProject
export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated
export const selectTheme = (state: AppState) => state.theme
```

---

## 🚦 CRISIS MANAGEMENT PROTOCOLS

### Console Error Crisis Protocol
```markdown
## IMMEDIATE RESPONSE (0-5 MINUTES)
1. **STOP** - Cease all new development
2. **CAPTURE** - Document all error messages and stack traces
3. **COUNT** - Total number of console errors
4. **CATEGORIZE** - Critical vs non-critical errors

## SYSTEMATIC RECOVERY (5-30 MINUTES)
1. **PRIORITIZE** - Fix critical errors first
   - CRITICAL: Blocks functionality
   - HIGH: Degrades UX
   - MEDIUM: Cosmetic issues
   - LOW: Dev warnings

2. **FIX** - Component by component
   - Isolate each fix
   - Test individually
   - Verify no new errors

3. **VERIFY** - Full system check
   - Complete user journey test
   - Cross-browser verification
   - Performance impact check
   - Error-free console confirmation
```

### Performance Degradation Protocol
```markdown
## PERFORMANCE INVESTIGATION
1. **MEASURE** - Current performance metrics
   ```javascript
   const metrics = {
     renderTime: measureRenderTime(),
     responseTime: measureResponseTime(),
     memoryUsage: measureMemoryUsage()
   }
   ```

2. **IDENTIFY** - Bottlenecks
   - React DevTools Profiler
   - Chrome Performance tab
   - Network waterfall
   - Memory snapshots

3. **OPTIMIZE** - Targeted improvements
   - React.memo for expensive components
   - useMemo/useCallback for computations
   - Code splitting with dynamic imports
   - API response caching
   - Image optimization

4. **VERIFY** - Performance restored
   - Metrics within baselines
   - No regression in other areas
   - User experience smooth
```

### Dummy Data Elimination Protocol
```markdown
## AUDIT PROCEDURE
1. **SCAN** - Find all placeholder content
   ```bash
   grep -r "Lorem\|ipsum\|test\|dummy\|TODO" frontend/
   grep -r "example\.com\|foo\|bar\|123" backend/
   ```

2. **VERIFY** - Component by component
   - Check all UI text
   - Verify data sources
   - Confirm API connections
   - Validate assets

3. **REPLACE** - With real data
   - Connect to production APIs
   - Implement proper fetching
   - Add loading states
   - Handle errors gracefully
```

---

## 📈 QUALITY GATES AND CHECKPOINTS

### Pre-Implementation Checklist
```markdown
## Before Writing Code
- [ ] Investigation completed and documented
- [ ] Impact assessment reviewed
- [ ] Implementation plan approved
- [ ] Success metrics defined
- [ ] Rollback strategy prepared
```

### During Implementation Checklist
```markdown
## While Coding
- [ ] Following project conventions
- [ ] Debug logging implemented
- [ ] Error handling in place
- [ ] Performance monitored
- [ ] Tests written/updated
```

### Post-Implementation Checklist
```markdown
## After Coding
- [ ] Full workflow tested
- [ ] No console errors
- [ ] Performance within baselines
- [ ] Documentation updated
- [ ] Code reviewed
```

### Pre-Commit Checklist
```markdown
## Before Committing
- [ ] TypeScript: No errors
- [ ] ESLint: No warnings
- [ ] Tests: All passing
- [ ] Build: Successful
- [ ] Console: Error-free
- [ ] Performance: Within limits
```

---

## 📊 PERFORMANCE STANDARDS

### Frontend Performance Requirements
```typescript
const performanceRequirements = {
  // Core Web Vitals
  FCP: 1500,     // First Contentful Paint < 1.5s
  LCP: 2500,     // Largest Contentful Paint < 2.5s
  FID: 100,      // First Input Delay < 100ms
  CLS: 0.1,      // Cumulative Layout Shift < 0.1
  TTFB: 600,     // Time to First Byte < 600ms
  
  // Custom Metrics
  apiCall: 200,        // API response < 200ms
  stateUpdate: 16,     // State update < 16ms
  routeChange: 300,    // Route transition < 300ms
  searchResults: 500,  // Search results < 500ms
}
```

### Backend Performance Requirements
```python
performance_requirements = {
    "api_response_avg": 200,      # < 200ms average
    "api_response_p95": 500,      # < 500ms 95th percentile
    "api_response_p99": 1000,     # < 1000ms 99th percentile
    "database_query": 30,         # < 30ms per query
    "concurrent_requests": 100,   # Handle 100+ concurrent
    "requests_per_second": 1000,  # Handle 1000+ RPS
    "error_rate": 0.001,         # < 0.1% errors
    "cpu_usage": 70,             # < 70% CPU
    "memory_usage": 512,         # < 512MB RAM
}
=======
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
>>>>>>> dev
```

---

<<<<<<< HEAD
## 🔄 CONTINUOUS IMPROVEMENT

### Session Documentation Requirements
```markdown
# CHAT LOG: [Date] - Sunny Stack Development

## SESSION SUMMARY
- **Objectives**: [What was planned]
- **Completed**: [What was done]
- **Blockers**: [What prevented progress]
- **Next Steps**: [What needs to be done]

## INVESTIGATIONS CONDUCTED
[List all investigations with findings]

## CODE CHANGES
[List all files modified with purpose]

## PATTERNS DISCOVERED
[New patterns or approaches found useful]

## ISSUES ENCOUNTERED
[Problems faced and how they were resolved]

## PERFORMANCE IMPACT
[Metrics before and after changes]

## KNOWLEDGE GAINED
[Learnings to apply in future sessions]
```

### Pattern Extraction Template
```markdown
# PATTERN: [Pattern Name]

## PROBLEM
[What problem does this pattern solve?]

## SOLUTION
[How does the pattern solve it?]

## IMPLEMENTATION
```[language]
[Code example]
```

## WHEN TO USE
[Specific scenarios where this pattern applies]

## WHEN NOT TO USE
[Scenarios where this pattern should be avoided]

## BENEFITS
[Advantages of using this pattern]

## TRADE-OFFS
[Disadvantages or limitations]

## EXAMPLES IN CODEBASE
[Where this pattern is currently used]
=======
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
>>>>>>> dev
```

---

<<<<<<< HEAD
## 🎯 SUNNY STACK SPECIFIC REQUIREMENTS

### Trinity Layout System Requirements
```typescript
// All pages must use TrinityLayout
import { TrinityLayout } from '@/components/trinity/TrinityLayout'

export default function Page() {
  return (
    <TrinityLayout
      title="Page Title"
      showSidebar={true}
      showHeader={true}
    >
      {/* Page content */}
    </TrinityLayout>
  )
}
```

### Authentication Requirements
```typescript
// All protected routes must check authentication
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function ProtectedPage() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <LoadingSpinner />
  }
  
  if (!session) {
    redirect('/login')
  }
  
  return <PageContent user={session.user} />
}
```

### API Integration Requirements
```typescript
// All API calls must use the centralized client
import { api } from '@/lib/api'

// ✅ Correct
const data = await api.get('/endpoint')

// ❌ Wrong
const data = await fetch('/api/endpoint')
```

### Error Handling Requirements
```typescript
// All components must have error boundaries
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Page() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <PageContent />
    </ErrorBoundary>
  )
}
```

---

## 📚 COMMAND REFERENCE

### Investigation Commands
```bash
# Start investigation
"Begin Trinity Method investigation for [feature]. Document current state, analyze impact, propose solution."

# Complete investigation
"Finalize investigation with implementation plan, success metrics, and risk mitigation."
```

### Implementation Commands
```bash
# Implement with full testing
"Implement [feature] with comprehensive debugging, full workflow testing, and performance verification."

# Fix with investigation
"Investigate and fix [issue]. Document root cause, implement solution, verify entire workflow."
```

### Crisis Commands
```bash
# Console errors
"Execute Console Error Crisis Protocol. Stop, assess, fix by priority, verify resolution."

# Performance issues
"Execute Performance Degradation Protocol. Measure, identify bottlenecks, optimize, verify."

# Dummy data
"Execute Dummy Data Elimination Protocol. Scan, verify, replace with real data."
```

### Quality Commands
```bash
# Full system test
"Conduct full system test. Verify all workflows, check performance, confirm zero errors."

# Performance audit
"Conduct performance audit. Measure all metrics, compare to baselines, identify optimizations."

# Security audit
"Conduct security audit. Check auth, validate inputs, verify CORS, test vulnerabilities."
```

---

## 🏁 FINAL CHECKLIST

### Before Completing ANY Task
```markdown
## MANDATORY VERIFICATION
- [ ] Investigation documented
- [ ] Code follows patterns
- [ ] Debug logging added
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Full workflow tested
- [ ] Zero console errors
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Success metrics met
=======
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
>>>>>>> dev
```

---

<<<<<<< HEAD
**Co-Pilot Instructions - Sunny Stack Trinity Method v7.0**
**Professional Development Through Systematic Excellence**

**Remember: No updates without investigation. No changes without Trinity consensus. No shortcuts without consequences.**
=======
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
>>>>>>> dev
