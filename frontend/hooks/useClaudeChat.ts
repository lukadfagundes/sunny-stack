'use client'
// This file is deprecated - we now use Claude Web Assistant instead
// The trinity interface connects to the REAL Claude Web (claude.ai)
// Not a fake API chat

export function useClaudeChat() {
  // Deprecated - using real Claude Web instead
  return {
    messages: [],
    sendMessage: async () => {},
    isLoading: false,
    artifacts: [],
    clearConversation: () => {}
  }
}