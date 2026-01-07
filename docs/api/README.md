# API Documentation

Sunny Stack Portfolio provides a comprehensive REST API built with Next.js 15 API Routes. All endpoints follow REST principles and return JSON responses.

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://sunny-stack.com/api`

## Authentication

Most API endpoints are public, but administrative endpoints require authentication via Google OAuth.

### Authentication Flow

1. Client initiates OAuth flow via `/api/auth/signin`
2. Google redirects to `/api/auth/callback/google`
3. Session cookie is set (HTTP-only)
4. Subsequent requests include session cookie automatically

### Protected Endpoints

Protected endpoints require:

- Valid session cookie
- Email must match `ADMIN_EMAIL` environment variable

If authentication fails, endpoints return:

```json
{
  "error": "Unauthorized"
}
```

## API Endpoint Reference

### Public Endpoints

#### Health Check

```http
GET /api/health
```

Returns the API health status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-07T12:00:00.000Z",
  "uptime": 12345
}
```

#### Submit Quote Request

```http
POST /api/send-quote
```

Submit a new quote request from the public website.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "projectType": "Web Development",
  "budgetRange": "$5,000 - $10,000",
  "timeline": "2-3 months",
  "description": "I need a portfolio website",
  "requirements": "Mobile responsive, SEO optimized"
}
```

**Response (Success):**

```json
{
  "success": true,
  "quoteId": "cm1abc123xyz456"
}
```

**Response (Validation Error):**

```json
{
  "error": "Invalid email format"
}
```

**Validation Rules:**

- `name`: Required, 1-100 characters
- `email`: Required, valid email format
- `phone`: Optional, valid phone format
- `company`: Optional, 1-100 characters
- `projectType`: Required
- `budgetRange`: Optional
- `timeline`: Optional
- `description`: Required, 1-2000 characters
- `requirements`: Optional, max 2000 characters

---

### Authentication Endpoints

#### Sign In

```http
GET /api/auth/signin
```

Initiates Google OAuth sign-in flow.

**Response:**
Redirects to Google OAuth consent screen.

#### OAuth Callback

```http
GET /api/auth/callback/google
```

Handles Google OAuth callback and creates session.

**Query Parameters:**

- `code`: OAuth authorization code (provided by Google)
- `state`: CSRF protection token

**Response:**
Redirects to admin dashboard or home page.

#### Get Session

```http
GET /api/auth/session
```

Returns current session information.

**Response (Authenticated):**

```json
{
  "user": {
    "email": "admin@example.com",
    "name": "Admin User",
    "avatar": "https://lh3.googleusercontent.com/..."
  }
}
```

**Response (Not Authenticated):**

```json
{
  "user": null
}
```

#### Sign Out

```http
POST /api/auth/signout
```

Destroys the current session.

**Response:**

```json
{
  "success": true
}
```

---

### Admin Endpoints

All endpoints in this section require authentication.

#### Dashboard Analytics

```http
GET /api/admin/analytics
```

Returns dashboard analytics data.

**Response:**

```json
{
  "quotes": {
    "total": 45,
    "pending": 12,
    "approved": 20,
    "declined": 8,
    "converted": 5
  },
  "projects": {
    "total": 15,
    "planning": 3,
    "inProgress": 7,
    "review": 2,
    "complete": 3,
    "archived": 0
  },
  "recentQuotes": [
    {
      "id": "cm1abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "projectType": "Web Development",
      "status": "PENDING",
      "createdAt": "2026-01-07T10:30:00.000Z"
    }
  ]
}
```

#### System Health

```http
GET /api/admin/health
```

Returns system health status including database and external services.

**Response:**

```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": 45
  },
  "services": {
    "vercel": "operational",
    "discord": "operational",
    "github": "operational"
  }
}
```

---

### Projects API

#### List Projects

```http
GET /api/admin/projects
```

Returns all projects (excluding soft-deleted).

**Query Parameters:**

- `status`: Filter by status (optional)
  - Values: `PLANNING`, `IN_PROGRESS`, `REVIEW`, `COMPLETE`, `ARCHIVED`

**Response:**

```json
{
  "projects": [
    {
      "id": "cm1abc123",
      "title": "Portfolio Website",
      "description": "Modern portfolio for freelance developer",
      "clientName": "John Doe",
      "clientEmail": "john@example.com",
      "status": "IN_PROGRESS",
      "budget": "5000.00",
      "deadline": "2026-02-15T00:00:00.000Z",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-07T12:00:00.000Z"
    }
  ]
}
```

#### Create Project

```http
POST /api/admin/projects
```

Creates a new project.

**Request Body:**

```json
{
  "title": "E-commerce Website",
  "description": "Full-featured online store",
  "clientName": "Jane Smith",
  "clientEmail": "jane@example.com",
  "status": "PLANNING",
  "budget": 15000.0,
  "deadline": "2026-06-01"
}
```

**Response:**

```json
{
  "project": {
    "id": "cm1xyz789",
    "title": "E-commerce Website",
    "status": "PLANNING",
    "createdAt": "2026-01-07T12:30:00.000Z"
  }
}
```

#### Get Project

```http
GET /api/admin/projects/[id]
```

Returns a single project with related data.

**Response:**

```json
{
  "project": {
    "id": "cm1abc123",
    "title": "Portfolio Website",
    "description": "Modern portfolio for freelance developer",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "status": "IN_PROGRESS",
    "budget": "5000.00",
    "deadline": "2026-02-15T00:00:00.000Z",
    "quotes": [],
    "timeEntries": [
      {
        "id": "cm1time001",
        "description": "Initial setup",
        "startedAt": "2026-01-05T09:00:00.000Z",
        "endedAt": "2026-01-05T11:00:00.000Z",
        "durationMinutes": 120
      }
    ],
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-07T12:00:00.000Z"
  }
}
```

#### Update Project

```http
PATCH /api/admin/projects/[id]
```

Updates an existing project.

**Request Body:**

```json
{
  "status": "REVIEW",
  "description": "Updated description"
}
```

**Response:**

```json
{
  "project": {
    "id": "cm1abc123",
    "status": "REVIEW",
    "updatedAt": "2026-01-07T12:45:00.000Z"
  }
}
```

#### Delete Project

```http
DELETE /api/admin/projects/[id]
```

Soft-deletes a project (sets `deletedAt` timestamp).

**Response:**

```json
{
  "success": true
}
```

---

### Quotes API

#### List Quotes

```http
GET /api/admin/quotes
```

Returns all quotes (excluding soft-deleted).

**Query Parameters:**

- `status`: Filter by status (optional)
  - Values: `PENDING`, `APPROVED`, `DECLINED`, `CONVERTED`

**Response:**

```json
{
  "quotes": [
    {
      "id": "cm1quote001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "projectType": "Web Development",
      "budgetRange": "$5,000 - $10,000",
      "timeline": "2-3 months",
      "description": "Portfolio website project",
      "status": "PENDING",
      "createdAt": "2026-01-07T10:00:00.000Z"
    }
  ]
}
```

#### Get Quote

```http
GET /api/admin/quotes/[id]
```

Returns a single quote with related data.

**Response:**

```json
{
  "quote": {
    "id": "cm1quote001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "projectType": "Web Development",
    "budgetRange": "$5,000 - $10,000",
    "timeline": "2-3 months",
    "description": "Portfolio website project",
    "requirements": "Mobile responsive, SEO optimized",
    "status": "PENDING",
    "projectId": null,
    "proposals": [],
    "createdAt": "2026-01-07T10:00:00.000Z",
    "updatedAt": "2026-01-07T10:00:00.000Z"
  }
}
```

#### Update Quote

```http
PATCH /api/admin/quotes/[id]
```

Updates a quote (typically to change status).

**Request Body:**

```json
{
  "status": "APPROVED",
  "reviewedAt": "2026-01-07T12:00:00.000Z"
}
```

**Response:**

```json
{
  "quote": {
    "id": "cm1quote001",
    "status": "APPROVED",
    "reviewedAt": "2026-01-07T12:00:00.000Z",
    "updatedAt": "2026-01-07T12:00:00.000Z"
  }
}
```

#### Convert Quote to Project

```http
POST /api/admin/quotes/[id]/convert
```

Converts a quote to a project.

**Request Body:**

```json
{
  "title": "John Doe Portfolio",
  "budget": 7500.0,
  "deadline": "2026-03-15"
}
```

**Response:**

```json
{
  "project": {
    "id": "cm1project123",
    "title": "John Doe Portfolio",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "status": "PLANNING",
    "budget": "7500.00",
    "deadline": "2026-03-15T00:00:00.000Z",
    "createdAt": "2026-01-07T12:30:00.000Z"
  },
  "quote": {
    "id": "cm1quote001",
    "status": "CONVERTED",
    "projectId": "cm1project123"
  }
}
```

---

### Time Tracking API

#### List Time Entries

```http
GET /api/admin/time-entries
```

Returns all time entries.

**Query Parameters:**

- `projectId`: Filter by project (optional)

**Response:**

```json
{
  "timeEntries": [
    {
      "id": "cm1time001",
      "projectId": "cm1project123",
      "description": "Initial setup and configuration",
      "startedAt": "2026-01-07T09:00:00.000Z",
      "endedAt": "2026-01-07T11:30:00.000Z",
      "durationMinutes": 150,
      "loggedVia": "discord",
      "createdAt": "2026-01-07T09:00:00.000Z"
    }
  ]
}
```

#### Create Manual Time Entry

```http
POST /api/admin/time-entries/manual
```

Manually log time for a project.

**Request Body:**

```json
{
  "projectId": "cm1project123",
  "description": "Client meeting and requirements gathering",
  "startedAt": "2026-01-07T14:00:00.000Z",
  "endedAt": "2026-01-07T15:30:00.000Z"
}
```

**Response:**

```json
{
  "timeEntry": {
    "id": "cm1time002",
    "projectId": "cm1project123",
    "description": "Client meeting and requirements gathering",
    "startedAt": "2026-01-07T14:00:00.000Z",
    "endedAt": "2026-01-07T15:30:00.000Z",
    "durationMinutes": 90,
    "loggedVia": "manual",
    "createdAt": "2026-01-07T15:30:00.000Z"
  }
}
```

#### Stop Time Entry

```http
POST /api/admin/time-entries/[id]/stop
```

Stops an active time entry (sets `endedAt` timestamp).

**Response:**

```json
{
  "timeEntry": {
    "id": "cm1time003",
    "endedAt": "2026-01-07T16:00:00.000Z",
    "durationMinutes": 120
  }
}
```

#### Time Report

```http
GET /api/admin/time-entries/report
```

Returns aggregated time tracking data.

**Query Parameters:**

- `projectId`: Filter by project (optional)
- `startDate`: Start date for report (optional, ISO 8601)
- `endDate`: End date for report (optional, ISO 8601)

**Response:**

```json
{
  "totalMinutes": 450,
  "totalHours": 7.5,
  "byProject": [
    {
      "projectId": "cm1project123",
      "projectTitle": "Portfolio Website",
      "totalMinutes": 300,
      "totalHours": 5.0,
      "entries": 3
    }
  ],
  "byDate": [
    {
      "date": "2026-01-07",
      "totalMinutes": 450,
      "totalHours": 7.5,
      "entries": 3
    }
  ]
}
```

---

### Monitoring API

#### Service Status

```http
GET /api/admin/monitor/status
```

Returns overall service status.

**Response:**

```json
{
  "status": "operational",
  "services": {
    "vercel": "operational",
    "cloudflare": "operational",
    "github": "operational",
    "discord": "operational"
  },
  "lastChecked": "2026-01-07T12:00:00.000Z"
}
```

#### Service Health Checks

```http
GET /api/admin/monitor/services
```

Returns detailed health check data for all monitored services.

**Response:**

```json
{
  "services": [
    {
      "serviceName": "Vercel",
      "endpoint": "https://api.vercel.com/v1/status",
      "status": "operational",
      "responseTime": 145,
      "statusCode": 200,
      "lastChecked": "2026-01-07T12:00:00.000Z"
    },
    {
      "serviceName": "Cloudflare",
      "endpoint": "https://api.cloudflare.com/client/v4/user",
      "status": "operational",
      "responseTime": 89,
      "statusCode": 200,
      "lastChecked": "2026-01-07T12:00:00.000Z"
    }
  ]
}
```

#### Monitoring Alerts

```http
GET /api/admin/monitor/alerts
```

Returns recent monitoring alerts.

**Query Parameters:**

- `acknowledged`: Filter by acknowledged status (optional, boolean)

**Response:**

```json
{
  "alerts": [
    {
      "id": "cm1alert001",
      "type": "SERVICE_DOWN",
      "severity": "CRITICAL",
      "source": "Cloudflare",
      "message": "Cloudflare API returning 503 errors",
      "timestamp": "2026-01-07T11:45:00.000Z",
      "acknowledged": false,
      "metadata": {
        "statusCode": 503,
        "endpoint": "https://api.cloudflare.com/client/v4/user"
      },
      "createdAt": "2026-01-07T11:45:00.000Z"
    }
  ]
}
```

#### GitHub Status

```http
GET /api/admin/monitor/github
```

Returns GitHub API status and recent events.

**Response:**

```json
{
  "status": "operational",
  "rateLimitRemaining": 4850,
  "rateLimitTotal": 5000,
  "recentEvents": [
    {
      "type": "push",
      "repository": "sunny-stack",
      "branch": "main",
      "timestamp": "2026-01-07T11:30:00.000Z"
    }
  ]
}
```

---

### Proposals API

#### List Proposals

```http
GET /api/admin/proposals
```

Returns all generated proposals.

**Response:**

```json
{
  "proposals": [
    {
      "id": "cm1proposal001",
      "quoteId": "cm1quote001",
      "projectId": "cm1project123",
      "pdfUrl": "data:application/pdf;base64,...",
      "sentAt": "2026-01-07T12:00:00.000Z",
      "createdAt": "2026-01-07T11:55:00.000Z"
    }
  ]
}
```

---

### Discord Integration API

#### Discord Interactions

```http
POST /api/discord/interactions
```

Handles Discord slash command interactions (webhook endpoint).

**Headers:**

- `X-Signature-Ed25519`: Discord signature
- `X-Signature-Timestamp`: Request timestamp

**Request Body:**

```json
{
  "type": 2,
  "data": {
    "name": "project",
    "options": [
      {
        "name": "status",
        "type": 1
      }
    ]
  }
}
```

**Response:**
Discord interaction response (varies by command).

#### Discord Webhooks

```http
POST /api/discord/webhooks
```

Handles Discord webhooks for notifications.

---

### Test Endpoints (Development Only)

#### Test Notification

```http
POST /api/admin/test-notification
```

Sends a test Discord notification.

**Request Body:**

```json
{
  "type": "quote",
  "message": "Test notification"
}
```

**Response:**

```json
{
  "success": true,
  "messageId": "1234567890123456789"
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

### Validation Error (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Unauthorized (401)

```json
{
  "error": "Unauthorized"
}
```

### Forbidden (403)

```json
{
  "error": "Forbidden: Admin access required"
}
```

### Not Found (404)

```json
{
  "error": "Resource not found"
}
```

### Internal Server Error (500)

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. This is planned for future releases.

## Versioning

The API is currently unversioned. Breaking changes will be announced and documented.

## Support

For API support and questions:

- Check the [Architecture Documentation](../architecture/overview.md)
- Review [Known Issues](../../trinity/knowledge-base/ISSUES.md)
- Contact: luka@sunny-stack.com

---

**Last Updated:** 2026-01-07
**API Version:** 2.0.2
