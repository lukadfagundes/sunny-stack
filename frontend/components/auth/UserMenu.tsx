'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated || !user) return null

  const handleLogout = async () => {
    console.log('🚪 LOGOUT: Initiating sign-out for', user.email)
    setShowLogoutConfirm(false)
    setIsOpen(false)
    await logout()
    console.log('✅ LOGOUT: Sign-out complete, redirecting to login')
  }

  const getUserInitials = (email: string) => {
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master_admin':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'developer':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin':
        return '👑'
      case 'admin':
        return '🛡️'
      case 'developer':
        return '⚡'
      default:
        return '👤'
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-amber-100 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
            {getUserInitials(user.email)}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">{user.name || user.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)} font-semibold flex items-center gap-1`}>
              <span>{getRoleIcon(user.role)}</span>
              <span>{user.role.replace('_', ' ').toUpperCase()}</span>
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {getUserInitials(user.email)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/hud')
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-3"
                >
                  <span>🥤</span>
                  <span>Cola Records HUD</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/settings')
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-3"
                >
                  <span>⚙️</span>
                  <span>Account Settings</span>
                </button>

                {/* Admin-only options */}
                {(user.role === 'master_admin' || user.role === 'admin') && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        router.push('/admin')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-3"
                    >
                      <span>🛡️</span>
                      <span>Admin Panel</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        router.push('/admin/users')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-3"
                    >
                      <span>👥</span>
                      <span>User Management</span>
                    </button>
                  </>
                )}

                <div className="border-t border-gray-200 my-2"></div>

                {/* Help & Support */}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    window.open('https://docs.sunny-stack.com', '_blank')
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-3"
                >
                  <span>📚</span>
                  <span>Documentation</span>
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                {/* Sign Out */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 font-medium"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Session Info Footer */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Session Active</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>Secure</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">🚪</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sign Out?</h3>
                  <p className="text-sm text-gray-600">Confirm you want to end your session</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                You'll need to sign in again to access protected features. All unsaved changes will be preserved.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}