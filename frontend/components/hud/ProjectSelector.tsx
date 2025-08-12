'use client'
import { useEffect, useState } from 'react'
import { ChevronDown, Folder, FolderOpen } from 'lucide-react'

interface ProjectSelectorProps {
  selectedProject: string
  onProjectChange: (project: string) => void
}

const projects = [
  { 
    id: 'navigator', 
    name: "Navigator's Helm", 
    status: 'active',
    description: 'Industrial equipment intelligence',
    branch: 'main',
    lastCommit: '2 hours ago'
  },
  { 
    id: 'rinoa', 
    name: 'Rinoa', 
    status: 'planning',
    description: 'Single-user equipment platform',
    branch: 'dev',
    lastCommit: '3 days ago'
  },
  { 
    id: 'onepiece', 
    name: 'One Piece D&D', 
    status: 'concept',
    description: 'Gaming & entertainment project',
    branch: 'concept',
    lastCommit: '1 week ago'
  }
]

export default function ProjectSelector({ selectedProject, onProjectChange }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentProject = projects.find(p => p.id === selectedProject) || projects[0]
  
  useEffect(() => {
    console.log('📊 [PROJECT_SELECTOR] Project changed to:', selectedProject)
  }, [selectedProject])
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'text-[#3fb950]'
      case 'planning':
        return 'text-[#d29922]'
      case 'concept':
        return 'text-[#8b949e]'
      default:
        return 'text-[#8b949e]'
    }
  }
  
  const getStatusIndicator = (status: string) => {
    switch(status) {
      case 'active':
        return '●'
      case 'planning':
        return '○'
      case 'concept':
        return '◌'
      default:
        return '◌'
    }
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 h-8 px-3 rounded-md hover:bg-[#30363d] transition-colors text-sm"
      >
        <FolderOpen className="w-4 h-4 text-[#8b949e]" />
        <span className="text-[#f0f6fc]">{currentProject.name}</span>
        <span className={`${getStatusColor(currentProject.status)} text-xs`}>
          {getStatusIndicator(currentProject.status)}
        </span>
        <ChevronDown className={`w-3 h-3 text-[#8b949e] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-[#161b22] rounded-md border border-[#30363d] shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-[#8b949e] uppercase tracking-wider px-2 py-1">
              Active Projects
            </div>
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectChange(project.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-2 py-2 rounded-md transition-colors ${
                  project.id === selectedProject 
                    ? 'bg-[#30363d]' 
                    : 'hover:bg-[#30363d]'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <Folder className="w-4 h-4 text-[#8b949e] mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-[#f0f6fc] font-medium">
                        {project.name}
                      </span>
                      <span className={`${getStatusColor(project.status)} text-xs`}>
                        {getStatusIndicator(project.status)} {project.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#8b949e] mt-0.5">
                      {project.description}
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-[#8b949e]">
                      <span>Branch: {project.branch}</span>
                      <span>Last commit: {project.lastCommit}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}