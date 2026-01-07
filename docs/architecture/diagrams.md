# sunny-stack Visual Documentation

Comprehensive visual documentation for sunny-stack architecture using Mermaid diagrams.

---

## Table of Contents

1. [System Architecture](#1-system-architecture-diagram)
2. [Deployment Architecture](#2-deployment-architecture-diagram)
3. [API Architecture](#3-api-architecture-diagram)
4. [Discord Bot Architecture](#4-discord-bot-architecture-diagram)
5. [Database Schema](#5-database-schema-diagram)
6. [API Flow: Google OAuth Authentication](#6-api-flow-google-oauth-authentication)
7. [API Flow: Quote Submission → Project Conversion](#7-api-flow-quote-submission--project-conversion)
8. [API Flow: Discord Time Logging](#8-api-flow-discord-time-logging)
9. [API Flow: Service Health Monitoring](#9-api-flow-service-health-monitoring)
10. [Development Workflow: Git Branching](#10-development-workflow-git-branching-strategy)
11. [Development Workflow: PR and CI/CD](#11-development-workflow-pr-and-cicd-pipeline)
12. [Development Workflow: Local Development Setup](#12-development-workflow-local-development-setup)

---

## 1. System Architecture Diagram

High-level overview of system components and data flow.

```mermaid
graph TB
    subgraph "External Users"
        U1[Public Visitors]
        U2[Admin User]
        U3[Discord Bot Users]
    end

    subgraph "Vercel (Serverless)"
        subgraph "Next.js App Router"
            WEB[Website Pages<br/>React 19 Server Components]
            API[API Routes<br/>27 Endpoints]
        end

        subgraph "Edge Functions"
            EDGE[Edge Middleware<br/>Auth, Routing]
        end
    end

    subgraph "Raspberry Pi (Self-Hosted)"
        subgraph "PostgreSQL Docker"
            DB[(PostgreSQL 15<br/>Database)]
        end

        subgraph "Discord Bot Docker"
            BOT[Discord.js Bot<br/>19 Commands]
            HEALTH[Health Server<br/>:8080]
        end
    end

    subgraph "External Services"
        DISCORD[Discord Gateway<br/>WebSocket]
        GOOGLE[Google OAuth<br/>Authentication]
        RESEND[Resend<br/>Email Service]
        ROLLBAR[Rollbar<br/>Error Tracking]
    end

    %% User interactions
    U1 -->|HTTPS| WEB
    U2 -->|HTTPS| WEB
    U3 -->|Discord Commands| DISCORD

    %% Next.js flow
    WEB -->|Server Actions| API
    API -->|SQL Queries| DB
    WEB -->|OAuth| GOOGLE
    API -->|Send Emails| RESEND
    API -->|Log Errors| ROLLBAR

    %% Discord bot flow
    DISCORD <-->|WebSocket| BOT
    BOT -->|HTTPS API Calls| API
    BOT -->|Health Check| HEALTH

    %% Database connections
    DB -.->|Connection Pool<br/>max: 20| API

    style WEB fill:#4CAF50
    style API fill:#2196F3
    style DB fill:#FF9800
    style BOT fill:#9C27B0
    style DISCORD fill:#5865F2
```

**Key Components:**

- **Vercel Layer**: Serverless Next.js application with auto-scaling
- **Raspberry Pi Layer**: Self-hosted database and Discord bot
- **External Services**: OAuth, email, error tracking, Discord

**Data Flow:**

1. Public visitors access website via Vercel edge network
2. API routes query PostgreSQL on Raspberry Pi
3. Discord bot maintains WebSocket connection to Discord Gateway
4. Bot calls Vercel API for database operations

---

## 2. Deployment Architecture Diagram

Deployment pipeline and environment configuration.

```mermaid
graph LR
    subgraph "Development"
        DEV[Developer<br/>Local Machine]
        GITDEV[Git Branch<br/>feature/*]
    end

    subgraph "GitHub"
        REPO[GitHub Repository<br/>main branch]
        ACTIONS[GitHub Actions<br/>CI/CD]
    end

    subgraph "Vercel Platform"
        VPREV[Preview Deployment<br/>feature-abc123.vercel.app]
        VPROD[Production Deployment<br/>sunny-stack.com]
    end

    subgraph "Raspberry Pi"
        PI_DB[PostgreSQL<br/>Docker Container]
        PI_BOT[Discord Bot<br/>Docker Container]
        PI_SSH[SSH Deployment]
    end

    subgraph "Monitoring"
        VERCEL_DASH[Vercel Dashboard<br/>Deployment Logs]
        ROLLBAR_DASH[Rollbar Dashboard<br/>Error Tracking]
        DISCORD_ALERTS[Discord Alerts<br/>Notifications]
    end

    %% Development flow
    DEV -->|git push| GITDEV
    GITDEV -->|Pull Request| REPO

    %% CI/CD flow
    REPO -->|Webhook| ACTIONS
    ACTIONS -->|Tests| ACTIONS
    ACTIONS -->|Build| VERCEL_DASH

    %% Vercel deployment
    ACTIONS -->|Deploy Preview| VPREV
    REPO -->|Auto Deploy main| VPROD

    %% Pi deployment
    DEV -->|SSH Deploy| PI_SSH
    PI_SSH -->|Docker Compose| PI_DB
    PI_SSH -->|Docker Compose| PI_BOT

    %% Database connection
    VPROD <-.->|DATABASE_URL| PI_DB
    PI_BOT -->|API Calls| VPROD

    %% Monitoring
    VPROD -->|Logs| VERCEL_DASH
    VPROD -->|Errors| ROLLBAR_DASH
    PI_BOT -->|Alerts| DISCORD_ALERTS
    ACTIONS -->|Status| DISCORD_ALERTS

    style VPROD fill:#00C853
    style PI_DB fill:#FF6F00
    style PI_BOT fill:#AA00FF
    style ACTIONS fill:#2962FF
```

**Deployment Targets:**

1. **Vercel (Automatic)**: Push to `main` → auto-deploy
2. **Raspberry Pi (Manual)**: SSH deployment via Docker Compose

**Environments:**

- **Development**: Local (localhost:3000)
- **Preview**: Vercel preview deployments (per PR)
- **Production**: sunny-stack.com (Vercel) + Pi (DB/Bot)

---

## 3. API Architecture Diagram

API structure and middleware chain.

```mermaid
graph TB
    subgraph "Client Layer"
        BROWSER[Browser<br/>Fetch API]
        BOT_CLIENT[Discord Bot<br/>API Client]
    end

    subgraph "Next.js API Routes"
        subgraph "Public Endpoints"
            PUB_HEALTH[/api/health]
            PUB_QUOTE[/api/send-quote]
        end

        subgraph "Authentication"
            AUTH_SIGNIN[/api/auth/signin]
            AUTH_CALLBACK[/api/auth/callback/google]
            AUTH_SESSION[/api/auth/session]
            AUTH_SIGNOUT[/api/auth/signout]
        end

        subgraph "Admin Endpoints (Protected)"
            ADMIN_ANALYTICS[/api/admin/analytics]
            ADMIN_PROJECTS[/api/admin/projects]
            ADMIN_QUOTES[/api/admin/quotes]
            ADMIN_TIME[/api/admin/time-entries]
            ADMIN_MONITOR[/api/admin/monitor/*]
        end

        subgraph "Discord Integration"
            DISCORD_INT[/api/discord/interactions]
            DISCORD_WH[/api/discord/webhooks]
        end
    end

    subgraph "Middleware Chain"
        MW_AUTH[Admin Auth<br/>Middleware]
        MW_VALIDATE[Zod Validation]
        MW_ERROR[Error Handler]
    end

    subgraph "Business Logic Layer"
        BL_PROJECTS[Project Service]
        BL_QUOTES[Quote Service]
        BL_TIME[Time Tracking Service]
        BL_MONITOR[Monitoring Service]
    end

    subgraph "Data Access Layer"
        PRISMA[Prisma Client<br/>ORM]
        DB[(PostgreSQL<br/>Database)]
    end

    subgraph "External Services"
        GOOGLE[Google OAuth]
        RESEND[Resend Email]
        ROLLBAR[Rollbar Errors]
    end

    %% Client requests
    BROWSER -->|HTTPS| PUB_HEALTH
    BROWSER -->|HTTPS| PUB_QUOTE
    BROWSER -->|HTTPS| AUTH_SIGNIN
    BROWSER -->|HTTPS| ADMIN_PROJECTS
    BOT_CLIENT -->|HTTPS + Bearer Token| ADMIN_TIME

    %% Middleware flow (admin endpoints)
    ADMIN_PROJECTS --> MW_AUTH
    ADMIN_QUOTES --> MW_AUTH
    ADMIN_TIME --> MW_AUTH
    ADMIN_MONITOR --> MW_AUTH

    MW_AUTH --> MW_VALIDATE
    MW_VALIDATE --> BL_PROJECTS
    MW_VALIDATE --> BL_QUOTES
    MW_VALIDATE --> BL_TIME
    MW_VALIDATE --> BL_MONITOR

    %% Business logic to database
    BL_PROJECTS --> PRISMA
    BL_QUOTES --> PRISMA
    BL_TIME --> PRISMA
    BL_MONITOR --> PRISMA
    PRISMA --> DB

    %% Public endpoints
    PUB_QUOTE --> MW_VALIDATE
    MW_VALIDATE --> RESEND
    MW_VALIDATE --> PRISMA

    %% Auth flow
    AUTH_SIGNIN --> GOOGLE
    AUTH_CALLBACK --> GOOGLE
    AUTH_SESSION --> PRISMA

    %% Error handling
    BL_PROJECTS -.->|Errors| MW_ERROR
    BL_QUOTES -.->|Errors| MW_ERROR
    MW_ERROR --> ROLLBAR

    style MW_AUTH fill:#FF9800
    style MW_VALIDATE fill:#4CAF50
    style PRISMA fill:#2196F3
    style DB fill:#FF5722
```

**API Layers:**

1. **Client Layer**: Browser, Discord bot
2. **Middleware Chain**: Auth → Validation → Error Handling
3. **Business Logic**: Service classes for each domain
4. **Data Access**: Prisma ORM → PostgreSQL

**Authentication Flow:**

- Public endpoints: No authentication required
- Admin endpoints: `requireAdmin()` middleware validates session
- Discord endpoints: Bearer token authentication

---

## 4. Discord Bot Architecture Diagram

Discord bot structure and command handling.

```mermaid
graph TB
    subgraph "Discord Platform"
        GATEWAY[Discord Gateway<br/>WebSocket Connection]
        SLASH[Slash Command Interaction]
    end

    subgraph "Discord Bot (Raspberry Pi)"
        subgraph "Core"
            CLIENT[Discord.js Client<br/>Event Emitter]
            LOGGER[Winston Logger<br/>Daily Rotation]
        end

        subgraph "Event Handlers"
            E_READY[ready Event<br/>Bot Startup]
            E_INTERACT[interactionCreate Event<br/>Command Handler]
            E_ERROR[error Event<br/>Error Logging]
        end

        subgraph "Command Registry"
            CMD_REG[Command Collection<br/>19 Commands]
        end

        subgraph "Commands (19 Total)"
            subgraph "Time Tracking"
                CMD_START[/start-timer]
                CMD_STOP[/stop-timer]
                CMD_LOG[/log-time]
            end

            subgraph "Project Management"
                CMD_CREATE[/create-project]
                CMD_LIST[/list-projects]
                CMD_STATUS[/project-status]
            end

            subgraph "Monitoring"
                CMD_HEALTH[/health]
                CMD_MONITOR[/status]
                CMD_ALERTS[/monitor]
            end
        end

        subgraph "Utilities"
            API_CLIENT[API Client<br/>Vercel Integration]
            CIRCUIT[Circuit Breaker<br/>Retry Logic]
            RATE[Rate Limiter<br/>10 req/min]
        end

        subgraph "Health Check"
            HEALTH_SERVER[HTTP Server<br/>:8080/health]
        end
    end

    subgraph "Vercel API"
        API_PROJECTS[/api/admin/projects]
        API_TIME[/api/admin/time-entries]
        API_MONITOR[/api/admin/monitor/status]
    end

    subgraph "Database"
        DB[(PostgreSQL<br/>Raspberry Pi)]
    end

    %% Discord flow
    GATEWAY <-->|WebSocket| CLIENT
    SLASH -->|Interaction| CLIENT

    %% Event handling
    CLIENT -->|Emit| E_READY
    CLIENT -->|Emit| E_INTERACT
    CLIENT -->|Emit| E_ERROR

    E_INTERACT --> CMD_REG
    CMD_REG --> CMD_START
    CMD_REG --> CMD_STOP
    CMD_REG --> CMD_LOG
    CMD_REG --> CMD_CREATE
    CMD_REG --> CMD_LIST
    CMD_REG --> CMD_STATUS
    CMD_REG --> CMD_HEALTH
    CMD_REG --> CMD_MONITOR
    CMD_REG --> CMD_ALERTS

    %% Command execution
    CMD_START --> API_CLIENT
    CMD_STOP --> API_CLIENT
    CMD_LOG --> API_CLIENT
    CMD_CREATE --> API_CLIENT
    CMD_LIST --> API_CLIENT

    API_CLIENT --> CIRCUIT
    CIRCUIT --> RATE
    RATE -->|HTTPS| API_PROJECTS
    RATE -->|HTTPS| API_TIME
    RATE -->|HTTPS| API_MONITOR

    %% API to database
    API_PROJECTS --> DB
    API_TIME --> DB
    API_MONITOR --> DB

    %% Error logging
    E_ERROR --> LOGGER
    API_CLIENT -.->|Errors| LOGGER

    %% Health check
    HEALTH_SERVER -.->|Monitor| CLIENT

    style CLIENT fill:#5865F2
    style CMD_REG fill:#4CAF50
    style API_CLIENT fill:#2196F3
    style DB fill:#FF9800
```

**Bot Components:**

1. **Event Handlers**: ready, interactionCreate, error
2. **Command Registry**: 19 slash commands
3. **API Client**: HTTP client for Vercel API integration
4. **Utilities**: Circuit breaker, rate limiter, retry logic

**Command Flow:**

1. User invokes `/start-timer` in Discord
2. Discord sends interaction to bot via Gateway
3. Bot executes command → calls Vercel API
4. API stores data in PostgreSQL
5. Bot responds to user with confirmation

---

## 5. Database Schema Diagram

Entity-Relationship diagram for PostgreSQL database.

```mermaid
erDiagram
    User ||--o{ Project : manages
    Project ||--o{ Quote : receives
    Quote ||--o{ Proposal : generates
    Project ||--o{ TimeEntry : tracks
    Project ||--o{ DiscordMessage : references

    User {
        string id PK
        string email UK
        string name
        string googleId UK
        string avatar
        datetime createdAt
        datetime updatedAt
    }

    Project {
        string id PK
        string title
        text description
        string clientName
        string clientEmail
        enum status
        decimal budget
        datetime deadline
        string googleDriveFolderId
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    Quote {
        string id PK
        string name
        string email
        string phone
        string company
        string projectType
        string budgetRange
        string timeline
        text description
        text requirements
        enum status
        string projectId FK
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
        datetime reviewedAt
    }

    Proposal {
        string id PK
        string quoteId FK
        string projectId
        text pdfUrl
        datetime sentAt
        datetime createdAt
        datetime updatedAt
    }

    TimeEntry {
        string id PK
        string projectId FK
        text description
        datetime startedAt
        datetime endedAt
        int durationMinutes
        string loggedVia
        datetime createdAt
    }

    MonitoringEvent {
        string id PK
        enum type
        enum severity
        string source
        text message
        json metadata
        datetime timestamp
        datetime createdAt
    }

    MonitoringAlert {
        string id PK
        enum type
        enum severity
        string source
        text message
        datetime timestamp
        boolean acknowledged
        datetime acknowledgedAt
        json metadata
        datetime createdAt
    }

    ServiceHealthCheck {
        string id PK
        string serviceName
        string endpoint
        enum status
        int responseTime
        int statusCode
        datetime lastChecked
        datetime createdAt
    }

    DiscordMessage {
        string id PK
        string discordMessageId UK
        string channelId
        string userId
        text content
        string messageType
        string projectId FK
        json metadata
        datetime timestamp
        datetime createdAt
    }

    ApiKey {
        string id PK
        string name
        string key UK
        datetime expiresAt
        datetime lastUsedAt
        datetime createdAt
    }

    Webhook {
        string id PK
        string name
        string url
        string secret
        array events
        boolean active
        json metadata
        datetime createdAt
        datetime updatedAt
    }

    SystemConfig {
        string id PK
        string key UK
        text value
        text description
        datetime createdAt
        datetime updatedAt
    }
```

**Core Tables:**

- **User**: Admin users (Google OAuth)
- **Project**: Client projects with status tracking
- **Quote**: Quote requests from website
- **Proposal**: Generated PDF proposals
- **TimeEntry**: Time tracking entries

**Monitoring Tables:**

- **MonitoringEvent**: Service monitoring events
- **MonitoringAlert**: Alerts with acknowledgment tracking
- **ServiceHealthCheck**: External service health checks

**Integration Tables:**

- **DiscordMessage**: Audit log of Discord bot messages
- **ApiKey**: API authentication keys
- **Webhook**: Webhook configurations
- **SystemConfig**: System-wide configuration

**Indexes (not shown):**

- Status indexes (projects, quotes)
- Email indexes (users, projects)
- Timestamp indexes (all tables with createdAt)
- Compound indexes (monitoring alerts: source + timestamp)

---

## 6. API Flow: Google OAuth Authentication

Sequence diagram for Google OAuth flow.

```mermaid
sequenceDiagram
    actor User as Admin User
    participant Browser
    participant Vercel as Next.js App<br/>(Vercel)
    participant API as /api/auth
    participant Google as Google OAuth
    participant DB as PostgreSQL<br/>(Pi)

    User->>Browser: Click "Sign in with Google"
    Browser->>Vercel: GET /admin (unauthenticated)
    Vercel->>Browser: Redirect to /api/auth/signin
    Browser->>API: GET /api/auth/signin

    API->>Google: Redirect to Google OAuth consent
    activate Google
    Google->>User: Show consent screen
    User->>Google: Approve access
    Google->>API: Redirect with authorization code
    deactivate Google

    API->>Google: Exchange code for access token
    activate Google
    Google->>API: Return access token + user profile
    deactivate Google

    API->>DB: SELECT user WHERE googleId = ?
    DB->>API: User record (if exists)

    alt User does not exist
        API->>DB: INSERT user (email, name, googleId)
        DB->>API: New user created
    end

    API->>API: Create session token (JWT)
    API->>Browser: Set HTTP-only cookie<br/>(session token)
    Browser->>Vercel: Redirect to /admin/dashboard

    Vercel->>API: GET /api/auth/session<br/>(with session cookie)
    API->>API: Verify JWT token
    API->>Browser: Return user session

    Vercel->>Browser: Render admin dashboard
    Browser->>User: Show dashboard
```

**OAuth Flow Steps:**

1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User approves access
4. Google redirects back with authorization code
5. Exchange code for access token
6. Fetch user profile from Google
7. Create or update user in database
8. Create session token (JWT)
9. Set HTTP-only cookie
10. Redirect to admin dashboard

**Session Management:**

- JWT stored in HTTP-only cookie (XSS protection)
- Session validation on every admin route
- Automatic session refresh (15-day expiry)

---

## 7. API Flow: Quote Submission → Project Conversion

Complex workflow for quote processing.

```mermaid
sequenceDiagram
    actor Client as Potential Client
    participant Form as Quote Form<br/>(Next.js)
    participant API as /api/send-quote
    participant DB as PostgreSQL
    participant Email as Resend<br/>(Email Service)
    participant Discord as Discord Bot
    participant Admin as Admin User

    Client->>Form: Fill quote request form
    Form->>Form: Validate with Zod schema
    Form->>API: POST /api/send-quote<br/>{name, email, description, ...}

    API->>API: Validate request body

    API->>DB: INSERT INTO quotes<br/>(status: PENDING)
    activate DB
    DB->>API: Quote created (id: quote-123)
    deactivate DB

    par Send notifications
        API->>Email: Send confirmation email to client
        activate Email
        Email->>Client: "Quote received" email
        deactivate Email
    and
        API->>Email: Send notification to admin
        activate Email
        Email->>Admin: "New quote request" email
        deactivate Email
    and
        API->>Discord: POST /api/discord/notifications
        activate Discord
        Discord->>Admin: Discord embed: "New Quote"
        deactivate Discord
    end

    API->>Form: 200 OK {success: true}
    Form->>Client: Show success message

    Note over Admin: Admin reviews quote

    Admin->>Form: Click "Convert to Project"
    Form->>API: POST /api/admin/quotes/:id/convert

    API->>DB: BEGIN TRANSACTION
    activate DB
    API->>DB: UPDATE quotes SET status = 'CONVERTED'
    API->>DB: INSERT INTO projects<br/>(from quote data)
    API->>DB: INSERT INTO proposals<br/>(projectId, quoteId)
    API->>DB: COMMIT TRANSACTION
    DB->>API: Transaction complete
    deactivate DB

    API->>Email: Send proposal PDF to client
    activate Email
    Email->>Client: Proposal email with PDF
    deactivate Email

    API->>Discord: POST notification<br/>"Quote converted to project"
    activate Discord
    Discord->>Admin: Discord alert
    deactivate Discord

    API->>Form: 200 OK {project: {...}}
    Form->>Admin: Redirect to project page
```

**Quote Flow:**

1. Client submits quote via public form
2. Quote stored in database (status: PENDING)
3. Notifications sent (email + Discord)
4. Admin reviews quote in dashboard
5. Admin clicks "Convert to Project"
6. Transaction: Update quote + Create project + Create proposal
7. Proposal PDF emailed to client
8. Discord notification to admin

**Key Features:**

- **Atomic Transaction**: Quote conversion uses database transaction
- **Parallel Notifications**: Email and Discord sent concurrently
- **Soft Delete**: Quotes never hard-deleted (deletedAt timestamp)
- **Status Tracking**: PENDING → APPROVED/DECLINED → CONVERTED

---

## 8. API Flow: Discord Time Logging

Time tracking via Discord bot slash commands.

```mermaid
sequenceDiagram
    actor User as Discord User
    participant Discord as Discord Gateway
    participant Bot as Discord Bot<br/>(Pi)
    participant API as Vercel API<br/>/api/admin/time-entries
    participant DB as PostgreSQL<br/>(Pi)

    User->>Discord: /start-timer project:sunny-stack

    Discord->>Bot: InteractionCreate event
    Bot->>Bot: Parse command:<br/>start-timer

    Bot->>API: POST /api/admin/time-entries/manual<br/>{projectId, startedAt, loggedVia: 'discord'}
    activate API

    API->>API: Validate Bearer token
    API->>API: Validate request body (Zod)

    API->>DB: SELECT project WHERE id = ?
    activate DB
    DB->>API: Project found
    deactivate DB

    API->>DB: INSERT INTO time_entries<br/>{projectId, startedAt, endedAt: null}
    activate DB
    DB->>API: TimeEntry created (id: entry-123)
    deactivate DB

    API->>Bot: 201 Created {id, projectId, startedAt}
    deactivate API

    Bot->>Discord: Reply: "⏱️ Timer started for **sunny-stack**"
    Discord->>User: Show ephemeral message

    Note over User: User works on project...

    User->>Discord: /stop-timer

    Discord->>Bot: InteractionCreate event
    Bot->>Bot: Parse command:<br/>stop-timer

    Bot->>API: POST /api/admin/time-entries/:id/stop
    activate API

    API->>DB: SELECT time_entries WHERE id = ? AND endedAt IS NULL
    activate DB
    DB->>API: Active time entry found
    deactivate DB

    API->>API: Calculate duration:<br/>(now - startedAt) = 45 minutes

    API->>DB: UPDATE time_entries<br/>SET endedAt = now,<br/>durationMinutes = 45
    activate DB
    DB->>API: Time entry updated
    deactivate DB

    API->>Bot: 200 OK {durationMinutes: 45}
    deactivate API

    Bot->>Discord: Reply: "✅ Stopped timer.<br/>Duration: 45 minutes"
    Discord->>User: Show ephemeral message
```

**Time Tracking Flow:**

1. User invokes `/start-timer` with project autocomplete
2. Bot calls Vercel API to create time entry (startedAt, endedAt: null)
3. Bot confirms timer started
4. User works on project
5. User invokes `/stop-timer`
6. Bot calls API to update time entry (endedAt: now)
7. API calculates duration in minutes
8. Bot confirms timer stopped with duration

**Features:**

- **Autocomplete**: Project list fetched from API for autocomplete
- **Active Timer Check**: Only one active timer per user
- **Manual Entry**: `/log-time` command for manual time entries
- **Reporting**: `/time-report` command for time summaries

---

## 9. API Flow: Service Health Monitoring

Automated health checks for external services.

```mermaid
sequenceDiagram
    participant Cron as Cron Job<br/>(Vercel Cron)
    participant API as /api/admin/monitor
    participant Services as External APIs
    participant DB as PostgreSQL
    participant Discord as Discord Bot
    participant Admin as Admin User

    Note over Cron: Every 5 minutes

    Cron->>API: GET /api/admin/monitor/services

    par Health Check: GitHub
        API->>Services: GET https://api.github.com/status
        activate Services
        Services->>API: {status: 'operational'}
        deactivate Services
        API->>API: Record response time: 120ms
    and Health Check: Vercel
        API->>Services: GET https://api.vercel.com/v1/status
        activate Services
        Services->>API: {status: 'operational'}
        deactivate Services
        API->>API: Record response time: 95ms
    and Health Check: Cloudflare
        API->>Services: GET https://api.cloudflare.com/client/v4/status
        activate Services
        Services->>API: {status: 'operational'}
        deactivate Services
        API->>API: Record response time: 80ms
    and Health Check: Fly.io
        API->>Services: GET https://api.fly.io/graphql (health)
        activate Services
        Services->>API: {status: 'operational'}
        deactivate Services
        API->>API: Record response time: 110ms
    end

    loop For each service
        API->>DB: INSERT INTO service_health_checks<br/>{serviceName, status, responseTime}
    end

    alt Any service degraded/down
        API->>DB: INSERT INTO monitoring_alerts<br/>{severity: ERROR, acknowledged: false}
        API->>Discord: POST webhook: Service down alert
        Discord->>Admin: 🚨 Alert: Cloudflare degraded
    end

    API->>Cron: 200 OK {healthyServices: 4, degradedServices: 0}

    Note over Admin: Admin checks dashboard

    Admin->>API: GET /api/admin/monitor/status
    API->>DB: SELECT service_health_checks<br/>ORDER BY lastChecked DESC<br/>LIMIT 10
    DB->>API: Latest health checks
    API->>Admin: JSON {services: [...]}

    alt Admin acknowledges alert
        Admin->>API: POST /api/admin/monitor/alerts/:id/acknowledge
        API->>DB: UPDATE monitoring_alerts<br/>SET acknowledged = true
        DB->>API: Alert updated
        API->>Admin: 200 OK
    end
```

**Monitoring Flow:**

1. Cron job triggers every 5 minutes
2. API performs health checks for 4 services in parallel
3. Results stored in database (service_health_checks table)
4. If any service is degraded/down, create monitoring alert
5. Send Discord webhook for critical alerts
6. Admin views monitoring dashboard
7. Admin acknowledges alerts to clear notifications

**Monitored Services:**

- **GitHub API**: Repository status, API availability
- **Vercel API**: Deployment status, build health
- **Cloudflare API**: DNS, CDN status
- **Fly.io API**: Container health (if used)

**Alert Severity:**

- **INFO**: Successful health checks
- **WARNING**: Slow response time (>500ms)
- **ERROR**: Service degraded
- **CRITICAL**: Service down

---

## 10. Development Workflow: Git Branching Strategy

Git flow for feature development.

```mermaid
gitGraph
    commit id: "Initial commit"
    branch dev
    checkout dev
    commit id: "Setup project"

    branch feature/quote-form
    checkout feature/quote-form
    commit id: "Add quote form UI"
    commit id: "Add form validation"
    commit id: "Add API integration"

    checkout dev
    merge feature/quote-form tag: "PR #1 merged"

    branch feature/discord-bot
    checkout feature/discord-bot
    commit id: "Add Discord.js client"
    commit id: "Add slash commands"
    commit id: "Add API integration"

    checkout dev
    merge feature/discord-bot tag: "PR #2 merged"

    checkout main
    merge dev tag: "v1.0.0 release"

    checkout dev
    branch hotfix/auth-bug
    checkout hotfix/auth-bug
    commit id: "Fix OAuth callback"

    checkout main
    merge hotfix/auth-bug tag: "Hotfix: v1.0.1"

    checkout dev
    merge hotfix/auth-bug
```

**Branch Strategy:**

- **main**: Production-ready code (protected)
- **dev**: Development integration branch
- **feature/\***: Feature branches (merged to dev via PR)
- **hotfix/\***: Emergency fixes (merged to main + dev)

**Workflow:**

1. Create feature branch from `dev`
2. Develop feature with commits
3. Open PR: `feature/x` → `dev`
4. Code review + CI/CD tests
5. Merge to `dev` (squash or merge commit)
6. When ready for release: `dev` → `main`
7. Hotfixes: `hotfix/x` → `main` + `dev`

---

## 11. Development Workflow: PR and CI/CD Pipeline

Pull request workflow with GitHub Actions.

```mermaid
flowchart TD
    START([Developer: git push feature/x]) --> PR[Open Pull Request]

    PR --> GH_WEBHOOK[GitHub Webhook]
    GH_WEBHOOK --> ACTIONS_START[GitHub Actions Triggered]

    ACTIONS_START --> LINT[ESLint]
    ACTIONS_START --> TYPE[Type Check]
    ACTIONS_START --> UNIT[Jest Unit Tests]
    ACTIONS_START --> E2E[Playwright E2E Tests]

    LINT --> LINT_RESULT{Passed?}
    TYPE --> TYPE_RESULT{Passed?}
    UNIT --> UNIT_RESULT{Passed?}
    E2E --> E2E_RESULT{Passed?}

    LINT_RESULT -->|No| FAIL[❌ CI Failed]
    TYPE_RESULT -->|No| FAIL
    UNIT_RESULT -->|No| FAIL
    E2E_RESULT -->|No| FAIL

    LINT_RESULT -->|Yes| BUILD
    TYPE_RESULT -->|Yes| BUILD
    UNIT_RESULT -->|Yes| BUILD
    E2E_RESULT -->|Yes| BUILD

    BUILD[Build Next.js App] --> BUILD_RESULT{Success?}
    BUILD_RESULT -->|No| FAIL
    BUILD_RESULT -->|Yes| VERCEL_PREVIEW

    VERCEL_PREVIEW[Deploy Vercel Preview] --> PREVIEW_URL[Preview URL:<br/>feature-abc.vercel.app]

    PREVIEW_URL --> CODE_REVIEW[Code Review]
    FAIL --> FIX[Fix Issues]
    FIX --> PR

    CODE_REVIEW --> APPROVED{Approved?}
    APPROVED -->|No| CHANGES[Request Changes]
    CHANGES --> FIX

    APPROVED -->|Yes| MERGE[Merge to dev]
    MERGE --> VERCEL_PROD{On main branch?}

    VERCEL_PROD -->|No| DONE([Development Build])
    VERCEL_PROD -->|Yes| DEPLOY_PROD[Deploy to Production]

    DEPLOY_PROD --> HEALTH_CHECK[Health Check]
    HEALTH_CHECK --> HEALTH_OK{Healthy?}

    HEALTH_OK -->|No| ROLLBACK[Auto Rollback]
    ROLLBACK --> DISCORD_ALERT[Discord Alert:<br/>Deployment Failed]

    HEALTH_OK -->|Yes| DISCORD_SUCCESS[Discord Alert:<br/>Deployment Success]
    DISCORD_SUCCESS --> DONE_PROD([Production Deployed])

    style FAIL fill:#f44336
    style BUILD fill:#4CAF50
    style DEPLOY_PROD fill:#2196F3
    style DONE_PROD fill:#00C853
```

**CI/CD Stages:**

1. **Linting**: ESLint checks code quality
2. **Type Check**: TypeScript compilation (currently disabled)
3. **Unit Tests**: Jest unit tests (passWithNoTests)
4. **E2E Tests**: Playwright end-to-end tests
5. **Build**: Next.js production build
6. **Preview Deploy**: Vercel preview deployment (per PR)
7. **Code Review**: Manual review by team
8. **Merge**: Merge to dev (or main for hotfixes)
9. **Production Deploy**: Vercel auto-deploy on main push
10. **Health Check**: Verify deployment health
11. **Notifications**: Discord alerts for success/failure

**Rollback Strategy:**

- Vercel preserves last 10 deployments
- One-click rollback via Vercel dashboard
- Automatic rollback on health check failure (if configured)

---

## 12. Development Workflow: Local Development Setup

Local development environment setup flow.

```mermaid
flowchart TD
    START([New Developer]) --> CLONE[git clone sunny-stack]

    CLONE --> NODE_CHECK{Node.js 22<br/>installed?}
    NODE_CHECK -->|No| INSTALL_NODE[Install Node.js 22]
    INSTALL_NODE --> NODE_CHECK
    NODE_CHECK -->|Yes| NPM_INSTALL

    NPM_INSTALL[npm install] --> ENV_CHECK{.env.local<br/>exists?}

    ENV_CHECK -->|No| COPY_ENV[cp .env.example .env.local]
    COPY_ENV --> FILL_ENV[Fill required env vars:<br/>- DATABASE_URL<br/>- GOOGLE_CLIENT_ID<br/>- GOOGLE_CLIENT_SECRET]
    FILL_ENV --> ENV_CHECK

    ENV_CHECK -->|Yes| DB_CHOICE{Database<br/>choice?}

    DB_CHOICE -->|Local PostgreSQL| START_LOCAL_DB[docker compose up -d postgres]
    DB_CHOICE -->|Use Pi Database| CONNECT_PI[DATABASE_URL=pi-ip:5432]

    START_LOCAL_DB --> MIGRATE
    CONNECT_PI --> MIGRATE

    MIGRATE[npx prisma migrate dev] --> SEED{Seed<br/>database?}
    SEED -->|Yes| RUN_SEED[npx prisma db seed]
    SEED -->|No| STUDIO
    RUN_SEED --> STUDIO

    STUDIO{Open Prisma<br/>Studio?}
    STUDIO -->|Yes| OPEN_STUDIO[npx prisma studio<br/>localhost:5555]
    STUDIO -->|No| START_DEV
    OPEN_STUDIO --> START_DEV

    START_DEV[npm run dev] --> DEV_RUNNING[Next.js running<br/>localhost:3000]

    DEV_RUNNING --> BOT_CHOICE{Run Discord<br/>bot locally?}

    BOT_CHOICE -->|Yes| BOT_ENV[Set bot env vars:<br/>- DISCORD_BOT_TOKEN<br/>- BOT_API_URL=localhost:3000]
    BOT_ENV --> BOT_START[npm run bot:dev]
    BOT_START --> BOT_RUNNING[Bot running<br/>Health: localhost:8080]

    BOT_CHOICE -->|No| READY
    BOT_RUNNING --> READY

    READY([✅ Ready to Develop]) --> DEV_TASKS{Development<br/>task?}

    DEV_TASKS -->|Add feature| CREATE_BRANCH[git checkout -b feature/x]
    DEV_TASKS -->|Fix bug| CREATE_BRANCH
    DEV_TASKS -->|Run tests| RUN_TESTS[npm test]
    DEV_TASKS -->|Check types| RUN_TYPE[npm run type-check]
    DEV_TASKS -->|Lint| RUN_LINT[npm run lint]

    CREATE_BRANCH --> CODE[Write code]
    CODE --> TEST[npm test]
    TEST --> COMMIT[git commit]
    COMMIT --> PUSH[git push origin feature/x]
    PUSH --> PR[Create Pull Request]

    style READY fill:#00C853
    style PR fill:#2196F3
```

**Setup Steps:**

1. Clone repository
2. Install Node.js 22
3. Run `npm install`
4. Create `.env.local` from `.env.example`
5. Start PostgreSQL (local Docker or connect to Pi)
6. Run Prisma migrations
7. Seed database (optional)
8. Start Next.js dev server (`npm run dev`)
9. Start Discord bot (optional, `npm run bot:dev`)
10. Ready to develop!

**Common Commands:**

```bash
# Development
npm run dev              # Start Next.js (localhost:3000)
npm run bot:dev          # Start Discord bot locally

# Database
npx prisma migrate dev   # Create and apply migration
npx prisma studio        # Open database GUI (localhost:5555)
npx prisma db seed       # Seed test data

# Testing
npm test                 # Run Jest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript compilation check
npm run lint:fix         # Auto-fix linting issues
```

---

## Diagram Source Files

All diagrams are embedded in this document using Mermaid syntax. To edit:

1. **GitHub**: Markdown files with Mermaid blocks render automatically
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Mermaid Live Editor**: https://mermaid.live/ (paste Mermaid code)
4. **Export**: Use Mermaid CLI to export as PNG/SVG if needed

---

**Last Updated:** 2026-01-07
**Maintained By:** APO (Documentation Specialist)
**Diagram Count:** 12 comprehensive Mermaid diagrams
