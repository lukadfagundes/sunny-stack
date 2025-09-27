// lib/trinity-debug.ts - Trinity Method debugging utilities

export class TrinityDebugger {
  private module: string
  private enabled: boolean

  constructor(module: string) {
    this.module = module
    this.enabled = process.env.NODE_ENV === 'development'
  }

  entry(functionName: string, params?: unknown) {
    if (this.enabled) {
      console.log(`[ENTRY] ${functionName}`, {
        params,
        timestamp: Date.now(),
        module: this.module,
        stack: 'Next.js 15/React 19/TypeScript',
        sessionId: this.generateSessionId()
      })
    }
  }

  success(functionName: string, result?: unknown) {
    if (this.enabled) {
      console.log(`[SUCCESS] ${functionName}`, {
        result,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  error(functionName: string, error: Error) {
    // Always log errors, even in production
    console.error(`[ERROR] ${functionName}`, {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      module: this.module
    })
  }

  warning(functionName: string, message: string, data?: unknown) {
    if (this.enabled) {
      console.warn(`[WARNING] ${functionName}`, {
        message,
        data,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  info(functionName: string, message: string, data?: unknown) {
    if (this.enabled) {
      console.log(`[INFO] ${functionName}`, {
        message,
        data,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  performance(functionName: string, startTime: number) {
    const duration = Date.now() - startTime
    if (this.enabled && duration > 100) {
      // Log slow operations (>100ms)
      console.warn(`[PERFORMANCE] ${functionName}`, {
        duration: `${duration}ms`,
        timestamp: Date.now(),
        module: this.module,
        slow: duration > 500 ? 'CRITICAL' : 'WARNING'
      })
    }
  }

  stateChange(functionName: string, oldState: unknown, newState: unknown) {
    if (this.enabled) {
      console.log(`[STATE] ${functionName}`, {
        oldState,
        newState,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  apiCall(endpoint: string, method: string, data?: unknown) {
    if (this.enabled) {
      console.log(`[API] ${method} ${endpoint}`, {
        data,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  apiResponse(endpoint: string, status: number, response?: unknown) {
    if (this.enabled) {
      console.log(`[API RESPONSE] ${endpoint}`, {
        status,
        response,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  validation(fieldName: string, value: unknown, isValid: boolean, error?: string) {
    if (this.enabled) {
      console.log(`[VALIDATION] ${fieldName}`, {
        value,
        isValid,
        error,
        timestamp: Date.now(),
        module: this.module
      })
    }
  }

  private generateSessionId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('trinity-session-id')
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        window.sessionStorage.setItem('trinity-session-id', sessionId)
      }
      return sessionId
    }
    return 'server-session'
  }
}

// Factory function for creating debuggers
export function createDebugger(module: string): TrinityDebugger {
  return new TrinityDebugger(module)
}

// Pre-configured debuggers for common modules
export const debuggers = {
  api: new TrinityDebugger('API'),
  validation: new TrinityDebugger('Validation'),
  forms: new TrinityDebugger('Forms'),
  navigation: new TrinityDebugger('Navigation'),
  auth: new TrinityDebugger('Auth'),
  performance: new TrinityDebugger('Performance')
}
