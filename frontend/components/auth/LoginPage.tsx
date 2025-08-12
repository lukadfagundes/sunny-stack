'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Shield, AlertCircle, Loader2, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          mfa_code: mfaCode || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed')
      }

      if (data.requires_mfa && !requiresMFA) {
        setRequiresMFA(true)
        setIsLoading(false)
        return
      }

      // Cookies are now set by the API route
      // Route based on user role and permissions
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
      
      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (data.user.is_master) {
        router.push('/admin')
      } else if (data.user.app_access?.includes('sunny')) {
        router.push('/dashboard')
      } else if (data.user.app_access?.includes('client_demo')) {
        router.push('/demo')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
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
          <h1 className="text-3xl font-bold text-gray-800">Sunny Platform</h1>
          <p className="text-gray-600 mt-2">AI-Powered Software Consulting</p>
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
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
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
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
            Secure authentication powered by Sunny
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a href="/reset-password" className="text-sm text-purple-600 hover:text-purple-700">
              Forgot password?
            </a>
            <span className="text-gray-400">•</span>
            <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
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
      </motion.div>
    </div>
  )
}