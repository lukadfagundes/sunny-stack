'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LogOut, User, Settings, Shield, Terminal } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  user: {
    email: string
    role?: string
    name?: string
    is_master?: boolean
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSignOut = async () => {
    try {
      console.log('🔧 [USER_MENU] Signing out user:', user.email)
      
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      
      // Clear session storage
      sessionStorage.clear()
      
      // Redirect to landing page
      router.push('/')
      
      console.log('✅ [USER_MENU] Sign out successful')
    } catch (error) {
      console.error('🚨 [USER_MENU] Sign out error:', error)
    }
  }
  
  const isAdmin = user.is_master || user.role === 'admin' || user.email === 'luka@sunny-stack.com'
  
  // Display proper full name for Luka
  const displayName = user.email === 'luka@sunny-stack.com' 
    ? 'Luka Fagundes' 
    : (user.name || user.email.split('@')[0])
  
  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 h-8 px-3 rounded-md hover:bg-[#30363d] transition-colors"
      >
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <Shield className="w-3 h-3 text-[#f85149]" />
          )}
          <span className="text-sm text-[#f0f6fc]">
            {displayName}
          </span>
          <ChevronDown className={`w-3 h-3 text-[#8b949e] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {/* Professional dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-[#161b22] rounded-md border border-[#30363d] shadow-lg overflow-hidden z-50">
          {/* User info section */}
          <div className="px-3 py-2 border-b border-[#30363d]">
            <div className="text-sm text-[#f0f6fc] font-medium">
              {displayName}
            </div>
            <div className="text-xs text-[#8b949e] mt-0.5">
              {user.email}
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-1 mt-1">
                <Shield className="w-3 h-3 text-[#f85149]" />
                <span className="text-xs text-[#f85149]">Administrator</span>
              </div>
            )}
          </div>
          
          {/* Menu items */}
          <div className="py-1">
            <button 
              className="w-full text-left px-3 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#30363d] flex items-center space-x-2 transition-colors"
              onClick={() => console.log('Opening terminal settings')}
            >
              <Terminal className="w-4 h-4 text-[#8b949e]" />
              <span>Terminal Settings</span>
            </button>
            
            <button 
              className="w-full text-left px-3 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#30363d] flex items-center space-x-2 transition-colors"
              onClick={() => console.log('Opening preferences')}
            >
              <Settings className="w-4 h-4 text-[#8b949e]" />
              <span>Preferences</span>
            </button>
            
            <button 
              className="w-full text-left px-3 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#30363d] flex items-center space-x-2 transition-colors"
              onClick={() => console.log('Opening profile')}
            >
              <User className="w-4 h-4 text-[#8b949e]" />
              <span>Profile</span>
            </button>
            
            <div className="border-t border-[#30363d] my-1"></div>
            
            <button 
              onClick={handleSignOut}
              className="w-full text-left px-3 py-1.5 text-sm text-[#f85149] hover:bg-[#30363d] flex items-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}