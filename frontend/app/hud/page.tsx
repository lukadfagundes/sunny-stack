'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from '@/components/hud/UserMenu'
import ProjectSelector from '@/components/hud/ProjectSelector'
import ProjectContext from '@/components/hud/ProjectContext'
import ClaudeCodeTerminal from '@/components/hud/ClaudeCodeTerminal'
import ProjectMetrics from '@/components/hud/ProjectMetrics'
import QuickActions from '@/components/hud/QuickActions'
import { Menu, X } from 'lucide-react'

export default function ColaRecordsHUD() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedProject, setSelectedProject] = useState('navigator')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    console.log('🔧 [HUD] Cola Records workspace initialized')
    console.log('📊 [HUD] Auth state:', {
      user: user?.email,
      isLoading: isLoading
    })
  }, [])
  
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🔐 [HUD] Authentication required, redirecting')
      router.push('/login')
    } else if (!isLoading && user) {
      console.log('✅ [HUD] User authenticated:', user.email)
    }
  }, [user, isLoading, router])
  
  if (!mounted || isLoading) {
    return (
      <div className="h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-[#8b949e] text-sm font-mono">Initializing workspace...</div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="cola-workspace h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col overflow-hidden font-sans">
      {/* Professional header bar - IDE inspired */}
      <header className="cola-header bg-[#161b22] border-b border-[#30363d] px-2 sm:px-4 h-12 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-6">
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 hover:bg-[#30363d] rounded-md transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {/* Professional branding */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#238636] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">CR</span>
            </div>
            <span className="hidden sm:inline text-sm font-medium text-[#f0f6fc]">Cola Records</span>
            <span className="hidden lg:inline text-xs text-[#8b949e] font-mono">v1.0.0</span>
          </div>
          
          {/* Integrated project selector */}
          <div className="h-full flex items-center border-l border-[#30363d] pl-2 sm:pl-6">
            <ProjectSelector 
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />
          </div>
        </div>
        
        {/* User section */}
        <UserMenu user={user} />
      </header>
      
      {/* Main workspace with responsive layout */}
      <div className="cola-content flex-1 flex relative overflow-hidden">
        {/* Left sidebar - Quick Actions (Desktop: Always visible, Mobile: Slide-over) */}
        <aside className={`
          cola-sidebar-left
          absolute sm:relative
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
          w-64 lg:w-72 xl:w-80
          bg-[#0d1117] 
          border-r border-[#30363d] 
          flex flex-col
          transition-transform duration-300
          z-20 sm:z-10
          h-full
        `}>
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Quick Actions</h2>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="sm:hidden p-1 hover:bg-[#30363d] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <QuickActions project={selectedProject} />
          </div>
          
          {/* Project Context section for mobile/tablet */}
          <div className="lg:hidden border-t border-[#30363d] p-3">
            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Project Context</h3>
            <ProjectContext project={selectedProject} />
          </div>
        </aside>
        
        {/* Overlay for mobile menu */}
        {mobileMenuOpen && (
          <div 
            className="sm:hidden absolute inset-0 bg-black/50 z-10"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Center - Main workspace */}
        <main className="cola-main flex-1 bg-[#0d1117] flex flex-col min-w-0">
          {/* Terminal/Console area */}
          <div className="flex-1 border-b border-[#30363d] min-h-0">
            <ClaudeCodeTerminal project={selectedProject} />
          </div>
          
          {/* Bottom panel - Metrics (Desktop only, Mobile in right panel) */}
          <div className="hidden md:block h-32 lg:h-40 xl:h-48 bg-[#161b22] border-t border-[#30363d]">
            <div className="h-full p-3 overflow-y-auto">
              <ProjectMetrics project={selectedProject} />
            </div>
          </div>
        </main>
        
        {/* Right sidebar - Development Tools (Desktop: Always visible, Portrait: Wide) */}
        <aside className={`
          cola-sidebar-right
          hidden lg:block
          w-64 xl:w-80 2xl:w-96
          bg-[#0d1117] 
          border-l border-[#30363d] 
          flex flex-col
        `}>
          <div className="p-3 border-b border-[#30363d]">
            <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Development Tools</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Project Context for desktop */}
            <div className="bg-[#161b22] rounded-md border border-[#30363d] p-3">
              <h3 className="text-sm font-medium text-[#f0f6fc] mb-2">Project Context</h3>
              <ProjectContext project={selectedProject} />
            </div>
            
            {/* Active Sessions */}
            <div className="bg-[#161b22] rounded-md border border-[#30363d] p-3">
              <h3 className="text-sm font-medium text-[#f0f6fc] mb-2">Active Sessions</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b949e]">Claude Code Terminal</span>
                  <span className="text-[#3fb950]">● Active</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b949e]">Backend Server</span>
                  <span className="text-[#3fb950]">● Running</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b949e]">Frontend Dev</span>
                  <span className="text-[#3fb950]">● Running</span>
                </div>
              </div>
            </div>
            
            {/* System Resources */}
            <div className="bg-[#161b22] rounded-md border border-[#30363d] p-3">
              <h3 className="text-sm font-medium text-[#f0f6fc] mb-2">System Resources</h3>
              <div className="space-y-2">
                <div className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#8b949e]">Memory</span>
                    <span className="text-[#f0f6fc]">2.4 GB / 8 GB</span>
                  </div>
                  <div className="w-full bg-[#30363d] rounded-full h-1.5">
                    <div className="bg-[#238636] h-1.5 rounded-full" style={{width: '30%'}}></div>
                  </div>
                </div>
                <div className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#8b949e]">CPU</span>
                    <span className="text-[#f0f6fc]">15%</span>
                  </div>
                  <div className="w-full bg-[#30363d] rounded-full h-1.5">
                    <div className="bg-[#238636] h-1.5 rounded-full" style={{width: '15%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Metrics for desktop in right panel */}
            <div className="bg-[#161b22] rounded-md border border-[#30363d] p-3">
              <h3 className="text-sm font-medium text-[#f0f6fc] mb-2">Metrics</h3>
              <ProjectMetrics project={selectedProject} />
            </div>
          </div>
        </aside>
        
        {/* Mobile bottom bar for quick actions */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-[#30363d] p-2 z-30">
          <div className="flex justify-around items-center">
            <button className="p-2 hover:bg-[#30363d] rounded-md transition-colors">
              <span className="text-xs">Deploy</span>
            </button>
            <button className="p-2 hover:bg-[#30363d] rounded-md transition-colors">
              <span className="text-xs">Debug</span>
            </button>
            <button className="p-2 hover:bg-[#30363d] rounded-md transition-colors">
              <span className="text-xs">Logs</span>
            </button>
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-2 hover:bg-[#30363d] rounded-md transition-colors"
            >
              <span className="text-xs">Metrics</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Professional status bar */}
      <footer className="cola-footer hidden sm:flex bg-[#161b22] border-t border-[#30363d] px-4 h-6 items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-[#3fb950] rounded-full"></span>
            <span className="text-[#8b949e]">Ready</span>
          </span>
          <span className="text-[#8b949e]">Project: {selectedProject}</span>
          <span className="hidden sm:inline text-[#8b949e]">Branch: main</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden lg:inline text-[#8b949e]">UTF-8</span>
          <span className="hidden md:inline text-[#8b949e]">TypeScript React</span>
          <span className="hidden sm:inline text-[#8b949e]">Ln 1, Col 1</span>
          <span className="text-[#8b949e]">{new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
      
      {/* Mobile metrics panel (slide-over) */}
      {rightPanelOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRightPanelOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#161b22] border-l border-[#30363d] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Project Metrics</h2>
              <button onClick={() => setRightPanelOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProjectMetrics project={selectedProject} />
          </div>
        </div>
      )}
      
      <style jsx global>{`
        /* Portrait orientation optimizations */
        @media screen and (min-width: 768px) and (orientation: portrait) {
          .cola-workspace {
            display: flex;
            flex-direction: column;
          }
          
          .cola-content {
            display: grid;
            grid-template-columns: 280px 1fr 320px;
            gap: 0;
          }
          
          .cola-sidebar-left {
            position: relative;
            transform: translateX(0) !important;
            width: 280px !important;
          }
          
          .cola-sidebar-right {
            display: flex !important;
            width: 320px !important;
          }
          
          .cola-main {
            min-width: 0;
          }
        }
        
        /* Ultra-wide monitors */
        @media screen and (min-width: 2560px) {
          .cola-sidebar-left {
            width: 360px !important;
          }
          
          .cola-sidebar-right {
            width: 400px !important;
          }
        }
        
        /* Mobile landscape optimization */
        @media screen and (max-height: 480px) and (orientation: landscape) {
          .cola-header {
            height: 40px;
          }
          
          .cola-footer {
            display: none;
          }
        }
        
        /* Optimize for exactly 1080x1920 portrait (your monitor) */
        @media screen and (width: 1080px) and (height: 1920px) {
          .cola-sidebar-left {
            width: 300px !important;
          }
          
          .cola-sidebar-right {
            width: 340px !important;
          }
          
          .cola-main {
            /* Remaining space: 1080 - 300 - 340 = 440px */
            min-width: 440px;
          }
        }
      `}</style>
    </div>
  )
}