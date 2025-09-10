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
```

---

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

```markdown
# INVESTIGATION: [Feature/Bug/Task Name]
**Date**: [Current Date]
**Investigator**: Claude Code
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
```

---

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
```

---

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
```

---

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
```

---

**Co-Pilot Instructions - Sunny Stack Trinity Method v7.0**
**Professional Development Through Systematic Excellence**

**Remember: No updates without investigation. No changes without Trinity consensus. No shortcuts without consequences.**