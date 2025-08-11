import { create } from 'zustand'

interface ClaudeState {
  conversation: any[]
  artifacts: any[]
  activePrompt: string | null
  buildHistory: any[]
  updateConversation: (messages: any[]) => void
  addArtifact: (artifact: any) => void
  setActivePrompt: (prompt: string | null) => void
  addBuildToHistory: (build: any) => void
}

export const useClaudeStore = create<ClaudeState>((set) => ({
  conversation: [],
  artifacts: [],
  activePrompt: null,
  buildHistory: [],
  
  updateConversation: (messages) => set({ conversation: messages }),
  
  addArtifact: (artifact) => set((state) => ({
    artifacts: [...state.artifacts, artifact]
  })),
  
  setActivePrompt: (prompt) => set({ activePrompt: prompt }),
  
  addBuildToHistory: (build) => set((state) => ({
    buildHistory: [...state.buildHistory, build].slice(-10)
  }))
}))