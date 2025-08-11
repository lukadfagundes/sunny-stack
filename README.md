# ☀️ Sunny AI Platform

> Revolutionary AI-powered consulting platform with real-time human-AI collaboration

## 🌟 Overview

Sunny is a cutting-edge AI consulting platform that combines human expertise with AI intelligence to deliver unprecedented consulting services. Features real-time MCP (Model Context Protocol) integration for live collaboration between human consultants and AI partners.

## 🚀 Live Platform

**Production URL**: https://sunny-stack.com

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with Trinity Interface
- **Port**: 3000
- **Features**: Real-time MCP status, project management, client dashboards
- **UI**: Modern, responsive design with dark/light themes

### Backend  
- **Framework**: FastAPI with async support
- **Port**: 8000
- **Features**: MCP connector, JWT authentication, business logic APIs
- **Database**: SQLite with migration support

### Infrastructure
- **Deployment**: Cloudflare Tunnel (secure, no exposed ports)
- **Domain**: sunny-stack.com
- **Monitoring**: Real-time MCP integration with system metrics
- **Security**: JWT authentication, role-based access control

## 🔧 Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn
- Git
- Cloudflare account (for deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/[username]/sunny-ai-platform.git
cd sunny-ai-platform

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Environment configuration
cp .env.example .env
# Configure your API keys and settings in .env
```

### Running Locally

```bash
# Start all services (Windows)
.\STARTUP_SUNNY.bat

# Or individually (IMPORTANT: Follow this order):
# 1. Start Cloudflare Tunnel
cloudflared tunnel --config C:\Users\lukaf\.cloudflared\sunny-config.yml run

# 2. Start Backend (wait for tunnel connection)
cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Start Frontend (after backend is ready)
cd frontend && npm run dev -- --port 3000
```

**⚠️ CRITICAL**: Services must start in order: Tunnel → Backend → Frontend

## 🌐 Deployment

The platform uses Cloudflare Tunnel for secure, zero-trust deployment:

```bash
# Deploy to production
.\deploy_sunny_production.bat

# Verify deployment
.\verify_deployment.bat
```

## 🔌 MCP Integration

Sunny features Model Context Protocol integration for real-time AI collaboration:

- **Status Endpoint**: `/api/mcp/status`
- **Health Check**: `/api/mcp/health`
- **Capabilities**:
  - Live system monitoring
  - Debug log access
  - Project file reading
  - Error pattern analysis
  - Performance metrics
  - Real-time collaboration

## 📊 API Documentation

When running locally:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **MCP Status**: http://localhost:8000/api/mcp/status

## 🛠️ Management Scripts

### Core Scripts
- `STARTUP_SUNNY.bat` - Full production startup (correct service order)
- `STOP_SUNNY.bat` - Graceful shutdown of all services
- `RESTART_SUNNY.bat` - Restart all services

### Diagnostics
- `check_status.bat` - System health check
- `enhanced_debug.bat` - Comprehensive debugging
- `diagnose_mcp_error.bat` - MCP service diagnostics
- `verify_deployment.bat` - Production verification

### Utilities
- `repair_mcp_service.bat` - Fix MCP service issues
- `test_mcp_authenticated.bat` - Test MCP with auth
- `setup_github.bat` - Initialize Git repository

## 🎯 Features

### For Consultants
- **Project Management**: Track client projects and deliverables
- **Proposal Engine**: AI-powered proposal generation
- **Client Analytics**: Deep insights and recommendations
- **Metrics Tracking**: Performance and success metrics

### For Clients
- **NavigatorCore Integration**: Seamless API integration
- **Real-time Updates**: Live project status and progress
- **Secure Access**: Role-based authentication
- **Performance Monitoring**: Track optimization metrics

### For AI Partners
- **MCP Connector**: Real-time system access
- **Debug Logs**: Complete visibility into operations
- **Self-Improvement**: Continuous learning and optimization
- **Error Analysis**: Pattern recognition and prevention

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Secure environment variables
- Cloudflare Tunnel encryption
- No exposed ports to internet

## 🤝 Contributing

We welcome contributions to advance AI-human collaboration:

### Areas of Interest
- Client integration patterns
- Performance optimizations
- Security enhancements
- Documentation improvements
- Testing coverage
- UI/UX improvements

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📁 Project Structure

```
sunny-ai-platform/
├── frontend/           # Next.js frontend application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   └── public/        # Static assets
├── backend/           # FastAPI backend service
│   ├── app/          # Application code
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utilities
│   └── venv/         # Python virtual environment
├── scripts/          # Management scripts
├── docs/            # Documentation
└── .cloudflared/    # Tunnel configuration
```

## 📄 License

MIT License - Open for innovation and collaboration

## 🌟 Vision

Sunny represents the evolution of consulting services - where human creativity and strategic thinking combine with AI intelligence and 24/7 monitoring to deliver unprecedented value to clients.

### Our Mission
Transform how businesses leverage AI by creating seamless human-AI collaboration that delivers:
- **24/7 Availability**: AI partners never sleep
- **Human Expertise**: Strategic thinking and creativity
- **Real-time Insights**: Instant analysis and recommendations
- **Continuous Improvement**: Self-optimizing platform

## 📞 Contact

For questions, partnerships, or support:
- **Platform**: https://sunny-stack.com
- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues

---

**The future of consulting is here.** ☀️🚀

*Built with passion for the next generation of AI-powered business services.*