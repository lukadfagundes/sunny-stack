// API configuration with proper backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session management
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },
  
  async post(endpoint: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },

  async put(endpoint: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
}

// MCP-specific API calls
export const mcpApi = {
  async getStatus() {
    return apiClient.get('/api/mcp/status')
  },
  
  async getLogs(count = 50, category?: string, level?: string) {
    const params = new URLSearchParams()
    params.append('count', count.toString())
    if (category) params.append('category', category)
    if (level) params.append('level', level)
    
    return apiClient.get(`/api/mcp/logs?${params.toString()}`)
  },
  
  async getProjectStructure(maxDepth = 3) {
    return apiClient.get(`/api/mcp/project/structure?max_depth=${maxDepth}`)
  },
  
  async readFile(filePath: string) {
    return apiClient.get(`/api/mcp/project/file?file_path=${encodeURIComponent(filePath)}`)
  },
  
  async analyzeErrors(timeframeMinutes = 30) {
    return apiClient.get(`/api/mcp/errors/analysis?timeframe_minutes=${timeframeMinutes}`)
  },
  
  async monitorPerformance(durationSeconds = 30) {
    return apiClient.post('/api/mcp/performance/monitor', { duration_seconds: durationSeconds })
  },

  async executeTools(toolName: string, parameters: any = {}) {
    return apiClient.post('/api/mcp/tools/execute', { tool_name: toolName, parameters })
  },

  async getHealth() {
    return apiClient.get('/api/mcp/health')
  },

  async addLogEntry(category: string, description: string, metrics: any = {}) {
    return apiClient.post('/api/mcp/log', { category, description, metrics })
  }
}

// Claude Integration API
export const claudeApi = {
  async sendPrompt(prompt: string, projectContext?: any) {
    return apiClient.post('/api/claude/prompt', {
      prompt,
      project_context: projectContext
    })
  },

  async getArtifacts(promptId: string) {
    return apiClient.get(`/api/claude/artifacts/${promptId}`)
  },

  async getBuildStatus(buildId: string) {
    return apiClient.get(`/api/claude/build/${buildId}`)
  }
}

// Project Management API
export const projectApi = {
  async listProjects() {
    return apiClient.get('/api/projects')
  },

  async getProject(projectId: string) {
    return apiClient.get(`/api/projects/${projectId}`)
  },

  async createProject(projectData: any) {
    return apiClient.post('/api/projects', projectData)
  },

  async updateProject(projectId: string, projectData: any) {
    return apiClient.put(`/api/projects/${projectId}`, projectData)
  },

  async deleteProject(projectId: string) {
    return apiClient.delete(`/api/projects/${projectId}`)
  }
}

// Metrics API
export const metricsApi = {
  async getMetrics(timeframe = '24h') {
    return apiClient.get(`/api/metrics?timeframe=${timeframe}`)
  },

  async trackEvent(eventType: string, data: any) {
    return apiClient.post('/api/metrics/track', {
      event_type: eventType,
      data
    })
  }
}