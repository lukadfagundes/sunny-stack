'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Shield, AlertCircle, Loader2, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [requiresMFA, setRequiresMFA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('🔧 [LOGIN] Attempting login for:', email)
      
      // Use the AuthContext login function which handles everything
      const authSuccess = await login(email, password, mfaCode || undefined)
      
      if (!authSuccess) {
        // Check if MFA is required (login returns false for MFA)
        if (!requiresMFA) {
          setRequiresMFA(true)
          setIsLoading(false)
          return
        }
        console.error('🚨 [LOGIN] Authentication failed')
        throw new Error('Authentication failed')
      }
      
      // Get user data from localStorage (set by AuthContext login)
      const storedUser = localStorage.getItem('user')
      let userData = null
      
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser)
        } catch (e) {
          console.error('🚨 [LOGIN] Failed to parse user data')
        }
      }
      
      // Route based on user role and permissions
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
      
      // Debug logging
      console.log('🔐 [LOGIN] Login successful:', {
        hasUser: !!userData,
        userEmail: userData?.email,
        userRole: userData?.role,
        isMaster: userData?.is_master,
        appAccess: userData?.app_access
      })
      
      // Validate user object exists
      if (!userData) {
        console.error('🚨 [LOGIN] User object missing after authentication')
        throw new Error('Authentication state invalid - user data missing')
      }
      
      console.log('✅ [LOGIN] Successful login, redirecting user:', userData.email)
      
      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (userData.is_master === true) {
        console.log('🎯 [LOGIN] Master admin detected, redirecting to HUD')
        router.push('/hud')  // Admin goes to HUD
      } else if (userData.app_access?.includes('sunny')) {
        console.log('🎯 [LOGIN] User has sunny access, redirecting to HUD')
        router.push('/hud')  // Changed from /dashboard to /hud
      } else if (userData.app_access?.includes('client_demo')) {
        console.log('🎯 [LOGIN] Demo user detected, redirecting to demo')
        router.push('/demo')
      } else {
        console.log('🎯 [LOGIN] Default redirect to HUD')
        router.push('/hud')  // Default to HUD instead of dashboard
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4"
          >
            <Sun className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">Sunny Stack</h1>
          <p className="text-gray-600 mt-2">Secure Sign In</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
                required
                disabled={requiresMFA}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                disabled={requiresMFA}
              />
            </div>
          </div>

          {/* MFA Code Input (shown when required) */}
          {requiresMFA && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MFA Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  autoFocus
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Enter the 6-digit code sent to your email
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {requiresMFA ? 'Verifying...' : 'Signing in...'}
              </span>
            ) : (
              <span>{requiresMFA ? 'Verify MFA Code' : 'Sign In'}</span>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Secure authentication system
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a href="/reset-password" className="text-sm text-orange-600 hover:text-orange-700">
              Forgot password?
            </a>
            <span className="text-gray-400">•</span>
            <a href="#" className="text-sm text-orange-600 hover:text-orange-700">
              Contact admin
            </a>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center text-xs text-gray-500">
            <Shield className="h-4 w-4 mr-1" />
            <span>256-bit encryption • SOC 2 compliant</span>
          </div>
        </div>
        
        {/* Subtle Cola Records credit */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">powered by Cola Records</p>
        </div>
      </motion.div>
    </div>
  )
}