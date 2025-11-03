# Discord Bot API Reference - Time Tracking Endpoints

**Base URL:** `https://your-domain.com/api/admin` (or `http://localhost:3000/api/admin` for local)
**Authentication:** Add `x-api-key: YOUR_BOT_API_KEY` header to all requests

---

## Quick Reference

| Command        | Method | Endpoint                  | Purpose         |
| -------------- | ------ | ------------------------- | --------------- |
| `/time-start`  | POST   | `/time-entries`           | Start timer     |
| `/time-stop`   | POST   | `/time-entries/{id}/stop` | Stop timer      |
| `/time-log`    | GET    | `/time-entries`           | List entries    |
| `/time-report` | GET    | `/reports/time`           | Generate report |

---

## 1. Start Timer

**Discord Command:** `/time-start <project-title> [description]`

**API Call:**

```typescript
POST /api/admin/time-entries
Headers: {
  'x-api-key': 'YOUR_BOT_API_KEY',
  'Content-Type': 'application/json'
}
Body: {
  projectId: string,      // Required - resolved from project title lookup
  description?: string,   // Optional - what user is working on
  loggedVia: 'discord'    // Always 'discord' for bot
}

// Note: Bot first searches for project by title using:
// GET /admin/projects?title={project-title}
// Then uses the returned project ID
```

**Success Response (201):**

```json
{
  "timeEntry": {
    "id": "clxxx...",
    "projectId": "clyyyy...",
    "description": "Working on auth feature",
    "startedAt": "2025-10-31T10:30:00.000Z",
    "endedAt": null,
    "durationMinutes": null,
    "loggedVia": "discord"
  },
  "project": {
    "id": "clyyyy...",
    "title": "E-commerce Platform"
  }
}
```

**Error Responses:**

```json
// 404 - Project not found
{ "error": "Project not found: clxxx..." }

// 409 - Active timer already exists
{
  "error": "Active timer already exists for this project",
  "activeTimerId": "clzzz..."
}

// 400 - Validation error
{ "error": "Description must be 500 characters or less", "field": "description" }
```

**Bot Response Example:**

```
✅ Timer started for project "E-commerce Platform"
📝 Description: Working on auth feature
⏱️ Started at: 10:30 AM
🆔 Timer ID: clxxx...

Use /time-stop to stop this timer.
```

---

## 2. Stop Timer

**Discord Command:** `/time-stop`

**Implementation Logic:**

1. Find active timer for current user/project (query GET /time-entries?status=active)
2. Stop the timer using its ID

**API Call:**

```typescript
POST /api/admin/time-entries/{id}/stop
Headers: {
  'x-api-key': 'YOUR_BOT_API_KEY',
  'Content-Type': 'application/json'
}
Body: {}  // Empty body
```

**Success Response (200):**

```json
{
  "timeEntry": {
    "id": "clxxx...",
    "projectId": "clyyyy...",
    "description": "Working on auth feature",
    "startedAt": "2025-10-31T10:30:00.000Z",
    "endedAt": "2025-10-31T12:15:00.000Z",
    "durationMinutes": 105,
    "loggedVia": "discord"
  },
  "project": {
    "id": "clyyyy...",
    "title": "E-commerce Platform"
  }
}
```

**Error Responses:**

```json
// 404 - Timer not found
{ "error": "TimeEntry not found: clxxx..." }

// 409 - Timer already stopped
{
  "error": "Timer already stopped",
  "timeEntry": {
    "id": "clxxx...",
    "endedAt": "2025-10-31T12:15:00.000Z",
    "durationMinutes": 105
  }
}
```

**Bot Response Example:**

```
⏹️ Timer stopped!
📊 Project: E-commerce Platform
📝 Task: Working on auth feature
⏱️ Duration: 1h 45m (105 minutes)
🕐 10:30 AM → 12:15 PM
```

---

## 3. Manual Time Log

**Discord Command:** `/time-log <project-title> <duration> [description] [started-at]`

**API Call:**

```typescript
POST /api/admin/time-entries/manual
Headers: {
  'x-api-key': 'YOUR_BOT_API_KEY',
  'Content-Type': 'application/json'
}
Body: {
  projectId: string,         // Required - resolved from project title lookup
  durationMinutes: number,   // Required - duration in minutes (1-1440)
  description?: string,      // Optional - what was worked on
  startedAt: string,         // ISO timestamp (defaults to current time minus duration)
  endedAt: string,           // ISO timestamp (calculated from startedAt + duration)
  loggedVia: 'discord'       // Always 'discord' for bot
}

// Note: Bot first searches for project by title using:
// GET /admin/projects?title={project-title}
// Then uses the returned project ID
```

**Success Response (201):**

```json
{
  "timeEntry": {
    "id": "clxxx...",
    "projectId": "clyyyy...",
    "description": "Database optimization",
    "startedAt": "2025-10-31T10:30:00.000Z",
    "endedAt": "2025-10-31T12:15:00.000Z",
    "durationMinutes": 105
  },
  "project": {
    "id": "clyyyy...",
    "title": "E-commerce Platform"
  }
}
```

**Bot Response Example:**

```
✅ Time Entry Logged
Logged 1h 45m for **E-commerce Platform**

Duration: 1h 45m
Time Period: 10:30 AM - 12:15 PM
Description: Database optimization

Entry ID: clxxx...
```

---

## 4. Time Report

**Discord Command:** `/time-report [project-title] [period]`

**API Call:**

```typescript
GET /api/admin/time-entries/report?period={period}&projectId={id}
Headers: {
  'x-api-key': 'YOUR_BOT_API_KEY'
}
```

**Query Parameters:**

- `period` (optional, default: 'all') - Time period filter:
  - `today` - Today only
  - `week` - This week
  - `month` - This month
  - `all` - All time
- `projectId` (optional) - Filter by specific project

**Note:** Bot first searches for project by title using:

```typescript
GET /admin/projects?title={project-title}
```

Then uses the returned project ID in the report query

**Success Response (200):**

```json
{
  "totalMinutes": 485,
  "entryCount": 12,
  "projectBreakdown": [
    {
      "projectId": "clyyyy...",
      "projectTitle": "E-commerce Platform",
      "totalMinutes": 250,
      "entryCount": 5
    },
    {
      "projectId": "clzzzz...",
      "projectTitle": "Marketing Website",
      "totalMinutes": 235,
      "entryCount": 7
    }
  ],
  "recentEntries": [
    {
      "id": "clxxx...",
      "projectTitle": "E-commerce Platform",
      "description": "Database optimization",
      "durationMinutes": 105,
      "startedAt": "2025-10-31T10:30:00.000Z"
    }
  ]
}
```

**Bot Response Example:**

```
⏱️ Time Tracking Report - All Time

Total Time: 8h 5m
Total Entries: 12

📊 Project Breakdown
E-commerce Platform
4h 10m (51.5%) • 5 entries

Marketing Website
3h 55m (48.5%) • 7 entries

🕒 Recent Entries
E-commerce Platform - Database optimization
1h 45m • 2 hours ago

Report generated at 11/2/2025, 9:05:00 AM
```

---

## Helper Functions for Bot

### Convert Minutes to Human-Readable

```javascript
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

// Examples:
formatDuration(105); // "1h 45m"
formatDuration(60); // "1h"
formatDuration(45); // "45m"
```

### Format Timestamp

```javascript
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Example:
formatTime("2025-10-31T10:30:00.000Z"); // "10:30 AM"
```

### Find Active Timer

```javascript
async function findActiveTimer(projectId) {
  const response = await fetch(
    `${API_BASE}/time-entries?status=active&projectId=${projectId}&limit=1`,
    {
      headers: { "x-api-key": BOT_API_KEY },
    },
  );

  const data = await response.json();
  return data.timeEntries[0] || null;
}
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message here",
  "field": "fieldName" // Optional - for validation errors
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created (for POST /time-entries)
- `400` - Validation error (bad input)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not found (project/timer doesn't exist)
- `409` - Conflict (active timer exists, timer already stopped)
- `500` - Server error

**Bot Error Response Template:**

```
❌ Error: {error message}

Need help? Try:
• /time-log - View your recent timers
• /project-list - View available projects
```

---

## Environment Setup

Add to bot's `.env` file:

```bash
# API Configuration
API_BASE_URL=https://your-domain.com/api/admin
BOT_API_KEY=your_secret_api_key_here

# For local development
# API_BASE_URL=http://localhost:3000/api/admin
```

---

## Rate Limiting

The bot auth middleware does NOT have rate limiting currently. If needed, rate limiting can be added via `withRateLimit()` middleware:

```typescript
export const POST = withRateLimit(
  withBotAuth(handler),
  { limit: 30, windowMs: 60000 }, // 30 requests per minute
);
```

---

## Best Practices

1. **Always Store Timer ID**: When starting a timer, save the `timeEntry.id` in your database/cache for that user/channel.

2. **Handle Active Timers**: Before starting a new timer, check if one is already active:

   ```javascript
   const active = await findActiveTimer(projectId);
   if (active) {
     // Ask user if they want to stop existing timer first
   }
   ```

3. **Graceful Degradation**: If API is down, queue commands and retry.

4. **User Feedback**: Always show clear success/error messages with actionable next steps.

5. **Pagination**: For `/time-log`, limit to 10 entries per page for Discord embed limits.

---

## Testing Checklist

- [ ] Start timer for valid project
- [ ] Try to start duplicate timer (should fail 409)
- [ ] Stop active timer
- [ ] Try to stop already-stopped timer (should fail 409)
- [ ] List all time entries
- [ ] List entries filtered by project
- [ ] List only active entries
- [ ] Generate report grouped by project
- [ ] Generate report grouped by week
- [ ] Test with invalid API key (should fail 401)
- [ ] Test with deleted project (should fail 400/404)

---

**Questions?** Check the full implementation details in `TIME-TRACKING-API-IMPLEMENTATION.md`
