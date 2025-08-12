'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  email: string
  name: string
  role: string
  app_access: string[]
  permissions: string[]
  is_master: boolean
  is_temporary: boolean
  expires_at?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, mfaCode?: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  checkPermission: (permission: string) => boolean
  checkAppAccess: (app: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('🔧 [AUTH_CONTEXT] Checking authentication state')
      
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      
      // First, try to restore from localStorage
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('🎯 [AUTH_CONTEXT] Restored user from localStorage:', userData.email)
          setUser(userData)
          setIsLoading(false)
          return
        } catch (e) {
          console.error('🚨 [AUTH_CONTEXT] Failed to parse stored user data')
          localStorage.removeItem('user')
        }
      }
      
      if (!token) {
        console.log('🔧 [AUTH_CONTEXT] No token found, user not authenticated')
        setIsLoading(false)
        return
      }

      // Try to validate token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('✅ [AUTH_CONTEXT] User validated from API:', userData.email)
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        console.log('🚨 [AUTH_CONTEXT] Token validation failed, clearing storage')
        // Token invalid, clear storage
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('🚨 [AUTH_CONTEXT] Auth check failed:', error)
      // If API call fails, try to use stored user data
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('🔧 [AUTH_CONTEXT] Using cached user data after API failure:', userData.email)
          setUser(userData)
        } catch (e) {
          console.error('🚨 [AUTH_CONTEXT] Failed to parse cached user data')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, mfaCode?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          mfa_code: mfaCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed')
      }

      if (data.requires_mfa && !mfaCode) {
        // MFA required but not provided
        return false
      }

      // Store tokens and user data
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setUser(data.user)
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      setUser(null)
      router.push('/login')
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) return false

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refresh}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access_token)
        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  const checkPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.is_master) return true
    if (user.permissions.includes('*')) return true
    return user.permissions.includes(permission)
  }

  const checkAppAccess = (app: string): boolean => {
    if (!user) return false
    if (user.is_master) return true
    if (user.app_access.includes('*')) return true
    return user.app_access.includes(app)
  }

  // Auto refresh token before expiry
  useEffect(() => {
    if (!user) return

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken()
      if (!success) {
        await logout()
      }
    }, 25 * 60 * 1000) // Refresh every 25 minutes

    return () => clearInterval(refreshInterval)
  }, [user])

  // Check for temporary user expiration
  useEffect(() => {
    if (!user?.is_temporary || !user.expires_at) return

    const checkExpiry = setInterval(() => {
      const expiryDate = new Date(user.expires_at!)
      if (new Date() > expiryDate) {
        logout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkExpiry)
  }, [user])

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    checkPermission,
    checkAppAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function ProtectedComponent(props: P) {
    const { user, isAuthenticated, isLoading, checkPermission } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      } else if (!isLoading && requiredPermission && !checkPermission(requiredPermission)) {
        router.push('/unauthorized')
      }
    }, [isLoading, isAuthenticated, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    if (requiredPermission && !checkPermission(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}