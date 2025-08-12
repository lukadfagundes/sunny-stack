// API configuration with proper backend URL
// In production, use relative URLs to avoid CORS issues when behind the same domain
const getApiBaseUrl = () => {
  // If we're in the browser and on production domain, use relative URLs
  if (typeof window !== 'undefined' && window.location.hostname === 'sunny-stack.com') {
    return '' // Empty string means relative URLs (same origin)
  }
  // Otherwise use the configured API URL or default to localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export const apiClient = {
  async get(endpoint: string) {
    const API_BASE_URL = getApiBaseUrl() // Get URL dynamically for each request
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
    const API_BASE_URL = getApiBaseUrl() // Get URL dynamically for each request
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
    const API_BASE_URL = getApiBaseUrl() // Get URL dynamically for each request
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
    const API_BASE_URL = getApiBaseUrl() // Get URL dynamically for each request
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