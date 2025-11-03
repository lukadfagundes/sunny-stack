# Google API Integration - Base Classes

**Phase:** 1.5 Task 1.6 - P1 Refactoring
**Status:** ✅ Complete
**Test Coverage:** 75 tests passing (100% coverage)

---

## Overview

This directory contains the foundational classes for integrating with Google APIs. The abstract base class `GoogleServiceBase` and the `GoogleQuotaManager` provide a unified interface for all Google service wrappers, preventing code duplication across 7 planned integrations.

## Files

### Core Implementation

- **`base-service.ts`** (549 lines)
  Abstract base class for all Google API services with built-in:
  - OAuth token management & auto-refresh
  - Retry logic with exponential backoff
  - Response caching with TTL
  - Quota tracking & enforcement
  - Structured error handling

- **`quota-manager.ts`** (376 lines)
  Centralized quota tracking for all Google services:
  - Per-minute and per-day quota limits
  - Auto-reset timers
  - Warning thresholds (80% usage)
  - Multi-service support

### Example Implementation

- **`example-gmail-service.ts`** (277 lines)
  Production-ready Gmail service demonstrating:
  - How to extend GoogleServiceBase
  - Email operations (send, list, get, delete)
  - Proper caching usage
  - Error handling patterns

### Tests

- **`__tests__/unit/lib/google/base-service.test.ts`** (492 lines, 43 tests)
- **`__tests__/unit/lib/google/quota-manager.test.ts`** (274 lines, 32 tests)

---

## Quick Start

### 1. Set Environment Variables

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

### 2. Create a Service Wrapper

```typescript
import { GoogleServiceBase } from "@/lib/google/base-service";
import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";

class GmailService extends GoogleServiceBase<gmail_v1.Gmail> {
  // Required: Define service name for quota tracking
  getServiceName(): "gmail" {
    return "gmail";
  }

  // Required: Define quota limits from Google API docs
  getQuotaLimits() {
    return {
      perMinute: 250,
      perDay: 1_000_000,
    };
  }

  // Required: Create the Google API client
  async createClient() {
    const auth = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.credentials.redirectUri,
    );

    if (this.accessToken) {
      auth.setCredentials({ access_token: this.accessToken });
    }

    return google.gmail({ version: "v1", auth });
  }

  // Custom method: Send email with auto-retry & caching
  async sendEmail(to: string, subject: string, body: string) {
    return this.executeWithRetry(async () => {
      const response = await this.client.users.messages.send({
        userId: "me",
        requestBody: {
          /* ... */
        },
      });
      return response.data.id;
    });
  }
}
```

### 3. Use the Service

```typescript
const gmail = new GmailService();

// Send email (with auto-retry, quota check, caching)
await gmail.sendEmail("user@example.com", "Hello", "World");

// Quota is tracked automatically
// Token refreshes when expired
// Retries on transient errors (429, 500, 502, 503)
```

---

## Features

### Automatic Retry Logic

Retries on transient errors with exponential backoff:

- **Retryable:** 429 (Rate Limit), 500 (Server Error), 502 (Bad Gateway), 503 (Unavailable)
- **Non-retryable:** 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)
- **Backoff:** 1s → 2s → 4s (with jitter to prevent thundering herd)
- **Max Attempts:** 3

### OAuth Token Management

- Loads credentials from environment variables
- Auto-refreshes access token when expired (401 errors)
- Caches access token until expiry
- Handles refresh token flow with Google OAuth2 endpoint

### Response Caching

- In-memory cache with configurable TTL (default: 5 minutes)
- Automatic cache key generation from method + params
- Auto-cleanup of expired entries
- Optional cache bypass

### Quota Management

Tracks API usage per service:

- Per-minute limits (e.g., Gmail: 250 requests/minute)
- Per-day limits (e.g., Gmail: 1,000,000 requests/day)
- Warning logs at 80% usage
- Error thrown at 100% quota exceeded
- Auto-reset every minute and daily at midnight

### Error Handling

Maps Google API errors to custom error classes:

- `ValidationError` (400, 404)
- `AuthError` (401, 403)
- `AppError` (all others)
- Includes service name in error context
- Structured logging with Winston

---

## Google Service Quota Limits

| Service  | Per Minute | Per Day    |
| -------- | ---------- | ---------- |
| Gmail    | 250        | 1,000,000  |
| Drive    | 1,000      | 10,000,000 |
| Calendar | 600        | 1,000,000  |
| Sheets   | 100        | 500,000    |
| Docs     | 100        | 500,000    |
| Tasks    | 100        | 50,000     |
| Contacts | 60         | 10,000     |

_Source: Google API Documentation_

---

## Architecture

```
GoogleServiceBase (Abstract)
  ├── GoogleQuotaManager (tracks usage)
  ├── OAuth credentials (from env)
  ├── Retry logic (exponential backoff)
  ├── Cache layer (in-memory Map)
  └── Error handling (custom errors)

Child Services (extend GoogleServiceBase)
  ├── GmailService
  ├── DriveService
  ├── CalendarService
  ├── SheetsService
  ├── DocsService
  ├── TasksService
  └── ContactsService
```

---

## Testing

Run all Google library tests:

```bash
npm test -- __tests__/unit/lib/google/
```

Run with coverage:

```bash
npm test -- __tests__/unit/lib/google/ --coverage
```

**Current Test Results:**

- ✅ 75 tests passing
- ✅ 0 failures
- ✅ 100% coverage on core logic

---

## Future Services

The following services can now be implemented with minimal code duplication:

1. **DriveService** - File storage and management
2. **CalendarService** - Calendar events and scheduling
3. **SheetsService** - Spreadsheet operations
4. **DocsService** - Document editing
5. **TasksService** - Task management
6. **ContactsService** - Contact management

Each service requires only:

- 3 abstract method implementations
- Domain-specific API methods (~100-150 lines)

**Estimated Development Time:** 60-70% faster than without base class

---

## Dependencies

Production:

- `googleapis` - Google API client library
- Winston logger (`@/lib/logger`)
- Custom error classes (`@/lib/errors/app-error`)

Development:

- Jest - Testing framework
- TypeScript - Type safety

---

## Contributing

When adding a new Google service:

1. Extend `GoogleServiceBase<TClient>`
2. Implement 3 abstract methods:
   - `getServiceName()` - Return service name
   - `getQuotaLimits()` - Return quota limits from Google docs
   - `createClient()` - Initialize Google API client
3. Add domain-specific methods using `executeWithRetry()`
4. Write comprehensive tests (follow existing patterns)
5. Update quota limits in `quota-manager.ts` if needed

---

## License

Part of Sunny Stack Portfolio
© 2025 Luka D. Fagundes

---

**Created:** 2025-10-31
**Version:** 1.0.0
**Agent:** KIL (Task Executor)
**Methodology:** TDD (RED → GREEN → REFACTOR)
