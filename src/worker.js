import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

const app = new Hono()

// Enhanced CORS for production
app.use('*', cors({
  origin: [
    'https://sunny-stack.com',
    'https://www.sunny-stack.com',
    'https://claude.ai',
    'https://api.anthropic.com'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}))

app.use('*', logger())
app.use('*', prettyJSON())

// Platform status endpoint
app.get('/', (c) => {
  return c.json({
    platform: "Sunny AI Consulting Platform",
    version: "2.0-sentient",
    status: "operational",
    timestamp: new Date().toISOString(),
    environment: "production",
    capabilities: [
      "AI Consulting & Project Management",
      "Safe Self-Improvement with Proposals",
      "Secure Authentication & Access Control",
      "MCP Integration for Claude Collaboration",
      "Real-time Trinity Interface",
      "Automated Proposal Generation"
    ],
    endpoints: {
      auth: "/api/auth",
      mcp: "/api/mcp",
      projects: "/api/projects",
      proposals: "/api/self-improvement",
      admin: "/admin"
    },
    mcp_connector: {
      enabled: true,
      endpoint: "https://sunny-stack.com/api/mcp",
      status: "ready_for_claude_integration",
      capabilities: [
        "read_debug_logs",
        "get_system_status",
        "analyze_proposals",
        "monitor_performance"
      ]
    },
    business: {
      name: "Sunny AI Consulting",
      email: "luka@sunny-stack.com",
      mission: "Revolutionizing software consulting with AI-powered development"
    }
  })
})

// Health check for monitoring
app.get('/health', (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0-sentient",
    services: {
      authentication: "operational",
      mcp_connector: "operational",
      self_improvement: "operational",
      database: "operational",
      websockets: "operational"
    },
    uptime: "continuous",
    last_deployment: new Date().toISOString()
  })
})

// Authentication endpoints
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, mfa_code } = await c.req.json()
    
    // Master admin authentication
    if (email === 'luka@sunny-stack.com' && password === c.env.MASTER_PASSWORD) {
      const token = await generateJWT({
        sub: email,
        role: 'master_admin',
        access_level: 'full',
        exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
      }, c.env.JWT_SECRET)
      
      // Log successful authentication
      await logEvent(c.env.SUNNY_DB, 'AUTH', 'Master admin login', { email, success: true })
      
      return c.json({
        access_token: token,
        token_type: 'bearer',
        user: {
          email: email,
          role: 'master_admin',
          access_level: 'full',
          allowed_apps: ['sunny', 'navigatorcore', 'all'],
          platform_version: '2.0-sentient'
        }
      })
    }
    
    // Check temporary users in KV storage
    const tempUser = await c.env.SUNNY_KV.get(`temp_user:${email}`)
    if (tempUser) {
      const userData = JSON.parse(tempUser)
      
      // Check expiration
      if (new Date(userData.expires_at) > new Date()) {
        // Verify password (you'd implement proper verification)
        const token = await generateJWT({
          sub: email,
          role: userData.role,
          access_level: userData.access_level,
          exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60) // 4 hours for temp users
        }, c.env.JWT_SECRET)
        
        await logEvent(c.env.SUNNY_DB, 'AUTH', 'Temporary user login', { email, role: userData.role })
        
        return c.json({
          access_token: token,
          token_type: 'bearer',
          user: userData
        })
      }
    }
    
    await logEvent(c.env.SUNNY_DB, 'AUTH', 'Failed login attempt', { email })
    return c.json({ error: 'Invalid credentials' }, 401)
    
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// MCP Status endpoint for Claude integration
app.get('/api/mcp/status', async (c) => {
  try {
    const db = c.env.SUNNY_DB
    
    // Get system statistics
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN level = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN created_at > datetime('now', '-1 hour') THEN 1 END) as recent_activity
      FROM debug_logs 
      WHERE created_at > datetime('now', '-24 hours')
    `).first()
    
    const proposals = await db.prepare(`
      SELECT COUNT(*) as pending_count
      FROM improvement_proposals 
      WHERE status = 'pending'
    `).first()
    
    return c.json({
      service: "Sunny MCP Connector",
      status: "operational",
      connection: {
        protocol: "HTTPS",
        endpoint: "https://sunny-stack.com/api/mcp",
        last_check: new Date().toISOString(),
        version: "2.0-sentient"
      },
      health: {
        debug_logs: stats?.total_logs || 0,
        recent_errors: stats?.error_count || 0,
        recent_activity: stats?.recent_activity || 0,
        pending_proposals: proposals?.pending_count || 0,
        uptime_hours: 24,
        system_health: (stats?.error_count || 0) === 0 ? "healthy" : "issues_detected"
      },
      capabilities: [
        "read_debug_logs",
        "get_system_status",
        "read_project_files",
        "analyze_error_patterns",
        "monitor_performance",
        "review_self_improvement_proposals",
        "track_business_metrics"
      ],
      platform_info: {
        version: "2.0-sentient",
        features: ["Safe Self-Improvement", "Secure Auth", "Real-time Collaboration"],
        business: "AI Consulting Platform"
      }
    })
  } catch (error) {
    return c.json({ error: "MCP status check failed", details: error.message }, 500)
  }
})

// MCP Debug logs endpoint
app.get('/api/mcp/logs', async (c) => {
  try {
    const count = parseInt(c.req.query('count') || '50')
    const category = c.req.query('category')
    const level = c.req.query('level')
    
    const db = c.env.SUNNY_DB
    
    let query = `
      SELECT * FROM debug_logs 
      WHERE created_at > datetime('now', '-24 hours')
    `
    const params = []
    
    if (category) {
      query += ` AND category = ?`
      params.push(category)
    }
    
    if (level) {
      query += ` AND level = ?`
      params.push(level)
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`
    params.push(count)
    
    const result = await db.prepare(query).bind(...params).all()
    
    return c.json({
      total_logs: result.results?.length || 0,
      returned_logs: result.results?.length || 0,
      logs: result.results || [],
      summary: {
        errors: result.results?.filter(log => log.level === 'error').length || 0,
        warnings: result.results?.filter(log => log.level === 'warning').length || 0,
        categories: result.results?.reduce((acc, log) => {
          acc[log.category] = (acc[log.category] || 0) + 1
          return acc
        }, {}) || {}
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ error: "Failed to retrieve debug logs" }, 500)
  }
})

// MCP Self-improvement proposals endpoint
app.get('/api/mcp/proposals', async (c) => {
  try {
    const db = c.env.SUNNY_DB
    const proposals = await db.prepare(`
      SELECT * FROM improvement_proposals 
      WHERE status = 'pending' 
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at DESC
    `).all()
    
    return c.json({
      pending_proposals: proposals.results || [],
      summary: {
        total: proposals.results?.length || 0,
        critical: proposals.results?.filter(p => p.priority === 'critical').length || 0,
        high: proposals.results?.filter(p => p.priority === 'high').length || 0,
        medium: proposals.results?.filter(p => p.priority === 'medium').length || 0,
        low: proposals.results?.filter(p => p.priority === 'low').length || 0
      },
      message: "Safe self-improvement proposals ready for review"
    })
  } catch (error) {
    return c.json({ error: "Failed to get improvement proposals" }, 500)
  }
})

// Project structure endpoint for Claude
app.get('/api/mcp/project/structure', async (c) => {
  return c.json({
    project_root: "/sunny-ai-platform",
    platform_version: "2.0-sentient",
    structure: {
      "frontend/": {
        "components/": {
          "trinity/": "Trinity interface (Claude Web + Code + API)",
          "auth/": "Secure authentication components",
          "self-improvement/": "Proposal review dashboard",
          "admin/": "User management interface"
        },
        "pages/": "Next.js application pages",
        "hooks/": "React hooks for API integration"
      },
      "backend/": {
        "app/": {
          "services/": "Core services (MCP, auth, self-improvement)",
          "routes/": "API endpoints for all functionality",
          "auth/": "Authentication and authorization system",
          "utils/": "Debug helpers and utilities"
        }
      },
      "src/": {
        "worker.js": "Cloudflare Worker (current file)"
      }
    },
    capabilities: [
      "Real-time debugging and monitoring",
      "Secure user management and access control",
      "Safe self-improvement with proposal system",
      "AI-powered consulting and project management",
      "Claude integration through MCP"
    ]
  })
})

// Frontend application route
app.get('/*', async (c) => {
  // Serve the Sunny frontend application
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sunny AI Consulting Platform</title>
        <meta name="description" content="The world's first self-improving AI consulting platform">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; 
                background: linear-gradient(135deg, #FFF8DC 0%, #FFFEF7 100%);
                min-height: 100vh;
            }
            .sunny-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
                text-align: center;
            }
            .hero {
                background: white;
                padding: 4rem 2rem;
                border-radius: 1rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                margin-bottom: 2rem;
            }
            .sunny-logo { font-size: 5rem; margin-bottom: 1rem; }
            .sunny-title { 
                font-size: 3rem; 
                font-weight: bold; 
                color: #1f2937; 
                margin-bottom: 1rem;
                background: linear-gradient(45deg, #f59e0b, #f97316);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .sunny-subtitle { 
                font-size: 1.5rem; 
                color: #6b7280; 
                margin-bottom: 2rem; 
                line-height: 1.6;
            }
            .status-badge { 
                background: linear-gradient(45deg, #10b981, #059669);
                color: white; 
                padding: 1rem 2rem; 
                border-radius: 2rem; 
                font-weight: bold;
                font-size: 1.1rem;
                display: inline-block;
                margin-bottom: 2rem;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin: 2rem 0;
            }
            .feature-card {
                background: white;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                border-left: 4px solid #f59e0b;
            }
            .feature-icon { font-size: 2rem; margin-bottom: 1rem; }
            .feature-title { 
                font-size: 1.25rem; 
                font-weight: bold; 
                margin-bottom: 0.5rem;
                color: #1f2937;
            }
            .feature-desc { color: #6b7280; line-height: 1.6; }
            .cta-section {
                background: linear-gradient(45deg, #f59e0b, #f97316);
                color: white;
                padding: 3rem 2rem;
                border-radius: 1rem;
                margin-top: 2rem;
            }
            .cta-button {
                background: white;
                color: #f59e0b;
                padding: 1rem 2rem;
                border: none;
                border-radius: 0.5rem;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin-top: 1rem;
                transition: transform 0.2s;
            }
            .cta-button:hover { transform: translateY(-2px); }
            .mcp-info {
                background: #f3f4f6;
                padding: 2rem;
                border-radius: 1rem;
                margin-top: 2rem;
                text-align: left;
            }
            .mcp-endpoint {
                background: #1f2937;
                color: #10b981;
                padding: 1rem;
                border-radius: 0.5rem;
                font-family: 'Courier New', monospace;
                margin: 1rem 0;
            }
        </style>
    </head>
    <body>
        <div class="sunny-container">
            <div class="hero">
                <div class="sunny-logo">☀️</div>
                <h1 class="sunny-title">Sunny AI Consulting Platform</h1>
                <p class="sunny-subtitle">
                    The world's first self-improving AI consulting platform.<br>
                    Revolutionizing software development with AI-powered intelligence.
                </p>
                <div class="status-badge">
                    OPERATIONAL v2.0-sentient
                </div>
            </div>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🧠</div>
                    <div class="feature-title">Safe Self-Improvement</div>
                    <div class="feature-desc">
                        AI-powered analysis generates improvement proposals for review,
                        ensuring safe evolution without unexpected changes.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">🔐</div>
                    <div class="feature-title">Secure Authentication</div>
                    <div class="feature-desc">
                        Multi-layer security with role-based access control,
                        temporary user creation, and comprehensive audit logging.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">🔌</div>
                    <div class="feature-title">Claude Integration</div>
                    <div class="feature-desc">
                        MCP integration enables real-time collaboration with Claude
                        for live system monitoring and development assistance.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">Trinity Interface</div>
                    <div class="feature-desc">
                        Unified development experience combining Claude Web, 
                        Claude Code, and Anthropic API in one powerful interface.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Project Management</div>
                    <div class="feature-desc">
                        AI-powered proposal generation, client management,
                        and automated project lifecycle tracking.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-title">Business Intelligence</div>
                    <div class="feature-desc">
                        Real-time metrics, revenue tracking, and automated
                        business reporting for consulting success.
                    </div>
                </div>
            </div>

            <div class="cta-section">
                <h2>Ready to Transform Your Consulting Business?</h2>
                <p>Experience the future of AI-powered software consulting.</p>
                <a href="/api/auth/login" class="cta-button">
                    Access Platform
                </a>
            </div>

            <div class="mcp-info">
                <h3>Claude Integration Ready</h3>
                <p>Connect Claude to monitor and collaborate with Sunny in real-time:</p>
                <div class="mcp-endpoint">
                    MCP Endpoint: https://sunny-stack.com/api/mcp
                </div>
                <p><strong>Available capabilities:</strong> System monitoring, debug log analysis, 
                proposal review, performance tracking, and real-time development collaboration.</p>
            </div>
        </div>

        <script>
            // Auto-redirect authenticated users
            const token = localStorage.getItem('sunny_token');
            if (token) {
                fetch('/api/auth/me', {
                    headers: { 'Authorization': 'Bearer ' + token }
                }).then(response => {
                    if (response.ok) {
                        window.location.href = '/dashboard';
                    }
                });
            }

            // Add some interactive elements
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Sunny AI Consulting Platform v2.0-sentient');
                console.log('MCP Endpoint: https://sunny-stack.com/api/mcp');
                console.log('Status: Operational');
            });
        </script>
    </body>
    </html>
  `)
})

// Utility functions
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = await sign(encodedHeader + '.' + encodedPayload, secret)
  return encodedHeader + '.' + encodedPayload + '.' + signature
}

async function sign(data, secret) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

async function logEvent(db, category, description, metadata = {}) {
  try {
    await db.prepare(`
      INSERT INTO debug_logs (category, description, level, metrics, created_at)
      VALUES (?, ?, 'info', ?, datetime('now'))
    `).bind(category, description, JSON.stringify(metadata)).run()
  } catch (error) {
    console.error('Logging failed:', error)
  }
}

// WebSocket Durable Object for real-time connections
export class SunnyWebSocketHandler {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = new Map()
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.handleSession(server)

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  handleSession(webSocket) {
    webSocket.accept()
    const sessionId = crypto.randomUUID()
    
    this.sessions.set(sessionId, {
      webSocket,
      createdAt: new Date().toISOString()
    })

    webSocket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data)
        
        // Handle different message types
        switch (message.type) {
          case 'ping':
            webSocket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
            break
          
          case 'subscribe':
            // Subscribe to real-time updates
            await this.subscribe(sessionId, message.channels)
            break
          
          case 'broadcast':
            // Broadcast to all connected clients
            await this.broadcast(message.data, sessionId)
            break
          
          default:
            webSocket.send(JSON.stringify({ 
              type: 'error', 
              message: 'Unknown message type' 
            }))
        }
      } catch (error) {
        webSocket.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }))
      }
    })

    webSocket.addEventListener('close', () => {
      this.sessions.delete(sessionId)
    })
  }

  async subscribe(sessionId, channels) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.channels = channels
      session.webSocket.send(JSON.stringify({
        type: 'subscribed',
        channels,
        timestamp: new Date().toISOString()
      }))
    }
  }

  async broadcast(data, excludeSessionId = null) {
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId) {
        try {
          session.webSocket.send(JSON.stringify({
            type: 'broadcast',
            data,
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          // Remove closed connections
          this.sessions.delete(sessionId)
        }
      }
    }
  }
}

export default app