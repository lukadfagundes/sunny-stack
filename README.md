# Sunny Stack Portfolio

![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![React](https://img.shields.io/badge/React-19.0-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)

A modern, responsive portfolio website showcasing professional web development projects and skills.

## 🚀 Overview

A high-performance portfolio website built with the latest web technologies. Features a clean, modern design with smooth animations, fully responsive layouts, and optimized for both desktop and mobile experiences.

### ✨ Key Features

- **Responsive Design** - Seamless experience across all devices
- **Performance Optimized** - Lightning-fast load times with Next.js 15
- **Type-Safe** - Full TypeScript implementation for reliability
- **Modern UI** - Clean, professional interface with Tailwind CSS
- **Contact Forms** - Integrated contact and quote request systems
- **SEO Ready** - Optimized meta tags and structured data
- **Accessibility** - WCAG AA compliant

## 🛠️ Technology Stack

### Frontend

- **Framework:** Next.js 15.0 (App Router)
- **UI Library:** React 19.0
- **Language:** TypeScript 5.5
- **Styling:** Tailwind CSS 3.4
- **Fonts:** Geist Font Family

### Development Tools

- **Package Manager:** npm
- **Linting:** ESLint
- **Testing:** Jest & React Testing Library
- **E2E Testing:** Playwright
- **Build Tool:** Webpack (via Next.js)

### Deployment & Infrastructure

- **Platform:** Vercel (Next.js Website + API Routes)
- **Database:** PostgreSQL on Raspberry Pi (self-hosted)
- **Bot:** Discord bot on Raspberry Pi (Docker container)
- **CI/CD:** Automated via Vercel + manual Pi deployment
- **Architecture:** Hybrid cloud + self-hosted

See [docs/deployment/](docs/deployment/) for complete deployment guides.

## 🏗️ Architecture

Sunny Stack uses a hybrid cloud + self-hosted architecture optimized for cost and performance:

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│  ┌──────────────────────────────┐   │
│  │   Next.js Website + API      │   │
│  │   https://sunny-stack.com    │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │
              │ DATABASE_URL
              ↓
┌─────────────────────────────────────┐
│      Raspberry Pi (Self-Hosted)     │
│  ┌──────────────────────────────┐   │
│  │   PostgreSQL Container       │   │
│  │   postgres:15-alpine         │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────↓───────────────────┐   │
│  │   Discord Bot Container      │   │
│  │   BOT_API_URL → Vercel       │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Why Hybrid?

- **Vercel:** Handles website and API routes with automatic scaling and global CDN
- **Raspberry Pi:** Runs PostgreSQL database and Discord bot 24/7 at minimal cost
- **Best of Both:** Serverless flexibility + self-hosted control

See [docs/deployment/DEPLOYMENT-OVERVIEW.md](docs/deployment/DEPLOYMENT-OVERVIEW.md) for detailed architecture documentation.

## 📦 Installation

### Prerequisites

- Node.js 20.0 or higher
- npm 10.0 or higher

### Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd sunny-stack
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

   **Required Environment Variables:**

   ```bash
   # Database (for development)
   DATABASE_URL=postgresql://user:password@localhost:5432/sunnystack

   # Email API (Resend)
   RESEND_API_KEY=your_resend_api_key

   # Site URL (for absolute links)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Google OAuth (optional, for NextAuth)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

   See `.env.local.example` for complete list and descriptions.

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
npm run type-check  # Run TypeScript compiler check
```

## 📂 Project Structure

```text
sunny-stack/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── (routes)/       # Page components
│   └── layout.tsx      # Root layout
├── bot/                # Discord bot application
├── components/         # Reusable React components
│   ├── forms/         # Form components
│   └── ui/            # UI components
├── docs/               # Documentation
│   ├── deployment/    # Deployment guides
│   └── *.md          # Setup guides
├── lib/               # Utility functions and helpers
├── hooks/             # Custom React hooks
├── styles/            # Global styles
├── public/            # Static assets
├── __tests__/         # Unit tests
└── e2e/              # End-to-end tests
```

## 🌟 Features

### Pages

- **Home** - Welcome page with hero section
- **About** - Professional background and skills
- **Portfolio** - Project showcase with filtering
- **Resume** - Downloadable CV/Resume
- **Contact** - Get in touch form
- **Quote** - Project quotation system

### Technical Features

- Server-side rendering (SSR) for optimal performance
- Static site generation (SSG) where applicable
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- Font optimization with next/font
- SEO optimization with metadata API
- Progressive Web App (PWA) ready

### Security

Sunny Stack implements comprehensive security controls:

- **Error Monitoring:** Rollbar integration for production error tracking
- **Security Tests:** 29 automated tests covering OWASP Top 5
- **Dependency Scanning:** Dependabot weekly updates (auto-merge patch updates)
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Authentication:** NextAuth.js with Google OAuth
- **Authorization:** Admin-only routes with session validation
- **Input Validation:** Comprehensive sanitization and validation
- **Rate Limiting:** API endpoint protection

For security issues, see [SECURITY.md](.github/SECURITY.md).

## 🤝 Contributing

While this is a personal portfolio project, suggestions and feedback are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to luka@sunny-stack.com.

## 🚀 Deployment

Sunny Stack uses a decoupled deployment architecture optimized for cost and performance:

### Quick Start

#### Next.js Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

**Automatic Deployment:** Push to `main` branch triggers automatic Vercel deployment.

#### Discord Bot (Raspberry Pi)

```bash
# 1. Set up Raspberry Pi (one-time setup)
curl -fsSL https://raw.githubusercontent.com/lukadfagundes/sunny-stack/main/scripts/pi-setup.sh | bash

# 2. Sync environment variables from local to Pi
./scripts/sync-env-to-pi.sh raspberrypi.local pi

# 3. Deploy via GitHub Actions (automatic on push to main)
# Or deploy manually:
cd ~/sunny-stack
docker compose up -d
```

### Architecture Components

**Vercel (Cloud):**

- Next.js website and API routes
- Serverless functions with automatic scaling
- Global CDN for optimal performance
- Environment: Production secrets via Vercel dashboard

**Raspberry Pi (Self-Hosted):**

- PostgreSQL database (Docker container)
- Discord bot (Docker container)
- 24/7 uptime at minimal cost (~$0/month after hardware)
- Environment: `.env.production` file on Pi

### Deployment Documentation

Comprehensive deployment guides are available in [docs/deployment/](docs/deployment/):

- **[DEPLOYMENT-OVERVIEW.md](docs/deployment/DEPLOYMENT-OVERVIEW.md)** - Complete architecture and deployment strategy
- **[RASPBERRY-PI-SETUP.md](docs/deployment/RASPBERRY-PI-SETUP.md)** - Initial Pi setup (one-time)
- **[PI-DEPLOYMENT.md](docs/deployment/PI-DEPLOYMENT.md)** - Pi deployment procedures
- **[GITHUB-ACTIONS-SETUP.md](docs/deployment/GITHUB-ACTIONS-SETUP.md)** - CI/CD configuration
- **[TROUBLESHOOTING.md](docs/deployment/TROUBLESHOOTING.md)** - Common issues and solutions

### CI/CD Pipeline

**Automated Deployments:**

- Push to `main` → Vercel deploys frontend automatically
- Push to `main` → GitHub Actions deploys to Pi automatically
- Health checks and rollback on failure
- Discord notifications for deployment status

See [GITHUB-ACTIONS-SETUP.md](docs/deployment/GITHUB-ACTIONS-SETUP.md) for CI/CD setup details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Luka D. Fagundes**

- GitHub: [@lukadfagundes](https://github.com/YOUR_USERNAME)
- Portfolio: [www.your-site.vercel.app](https://www.your-site.vercel.app)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Open source community for invaluable resources

---

Built with ❤️ by Luka D. Fagundes © 2025

## 🔱 Trinity Method

This project uses the **Trinity Method** - an investigation-first development methodology powered by AI agents.

### Quick Commands

#### Leadership Team

- **Aly (CTO)** - Strategic planning and work order creation

  ```bash
  /trinity-aly
  ```

- **AJ (Implementation Lead)** - Code execution and implementation
  ```bash
  /trinity-aj
  ```

#### Deployment Team

- **TAN (Structure Specialist)** - Directory architecture and organization

  ```bash
  /trinity-tan
  ```

- **ZEN (Knowledge Specialist)** - Documentation and knowledge base

  ```bash
  /trinity-zen
  ```

- **INO (Context Specialist)** - Codebase analysis and context building

  ```bash
  /trinity-ino
  ```

- **Ein (CI/CD Specialist)** - Continuous integration and deployment automation
  ```bash
  /trinity-ein
  ```

#### Audit Team

- **JUNO (Auditor)** - Quality assurance and comprehensive auditing
  ```bash
  /trinity-juno
  ```

### Documentation

**Deployment Guides** (`docs/deployment/`):

- **DEPLOYMENT-OVERVIEW.md** - Architecture and deployment strategy
- **DEPLOYMENT-CHECKLIST.md** - Quick reference checklist
- **PI-PRODUCTION-DEPLOYMENT.md** - Raspberry Pi production deployment
- **PI-TESTING-GUIDE.md** - Pre-production testing workflow
- **GITHUB-ACTIONS-SETUP.md** - CI/CD configuration
- **RASPBERRY-PI-SETUP.md** - Initial Pi setup guide
- **TROUBLESHOOTING.md** - Common issues and solutions
- **SANITIZE-DOCS.md** - Documentation personalization guide

**Trinity Knowledge Base** (`trinity/knowledge-base/`):

- **ARCHITECTURE.md** - System design and technical decisions
- **ISSUES.md** - Known problems and their status
- **To-do.md** - Task tracking and priorities
- **Technical-Debt.md** - Debt management and refactoring plans
- **Trinity.md** - Trinity Method guidelines and protocols

### Session Management

Trinity Method uses investigation-first approach:

1. **Assess** - Understand current state
2. **Investigate** - Deep dive into root causes
3. **Plan** - Create comprehensive strategy
4. **Execute** - Implement with precision
5. **Verify** - Confirm success criteria met

Session archives are stored in `trinity/sessions/` for historical reference.

### Project Info

- **Framework:** React
- **Trinity Version:** 1.0.0
- **Agent Configuration:** `.claude/`
- **Knowledge Base:** `trinity/knowledge-base/`

### Getting Started

1. Review the [Employee Directory](.claude/EMPLOYEE-DIRECTORY.md) for agent details
2. Check [Trinity.md](trinity/knowledge-base/Trinity.md) for methodology guidelines
3. Open Claude Code and invoke agents as needed
4. Agents automatically access project context and documentation

---

_Deployed with Trinity Method SDK v1.0.0_
