# Error Handling Framework

Centralized error handling system with custom error classes, global error handler, async wrapper, and Winston logging.

## Files Created

1. **`lib/errors/app-error.ts`** - Custom error classes
2. **`lib/errors/handler.ts`** - Global error handler
3. **`lib/errors/async-handler.ts`** - Async handler wrapper
4. **`lib/logger.ts`** - Winston logger configuration

## Usage Examples

### 1. Using Custom Error Classes

```typescript
import {
  ValidationError,
  AuthError,
  DatabaseError,
  NotFoundError,
} from "@/lib/errors/app-error";

// Validation error (400 Bad Request)
throw new ValidationError("Invalid email format", "email");

// Authentication error (401 Unauthorized)
throw new AuthError("Token expired");

// Authorization error (403 Forbidden)
throw new AuthError("Insufficient permissions", 403);

// Database error (500 Internal Server Error)
throw new DatabaseError("Connection timeout", originalError);

// Not Found error (404 Not Found)
throw new NotFoundError("User", "123");
```

### 2. Using in Next.js API Routes

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { asyncHandler } from "@/lib/errors/async-handler";
import { handleErrorResponse } from "@/lib/errors/handler";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;

    // Validate input
    if (!id || id.length < 3) {
      throw new ValidationError("Invalid user ID format", "id");
    }

    // Fetch user from database
    const user = await db.users.findUnique({ where: { id } });

    // Handle not found
    if (!user) {
      throw new NotFoundError("User", id);
    }

    // Return successful response
    return NextResponse.json({ success: true, data: user });
  },
);

// Error handling is automatic - any thrown error will be caught
// and handled by the global error handler
```

### 3. Manual Error Handling

```typescript
// If you need more control, handle errors manually
import { handleError } from "@/lib/errors/handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ... your logic
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
```

### 4. Using the Logger

```typescript
import { logger } from "@/lib/logger";

// Log levels
logger.info("User logged in", { userId: "123" });
logger.warn("API rate limit approaching", { remaining: 10 });
logger.error("Database connection failed", { error: err.message });
logger.debug("Request payload", { body: requestBody });

// Logs are automatically written to:
// - logs/error-YYYY-MM-DD.log (errors only)
// - logs/combined-YYYY-MM-DD.log (all levels)
// - Console (development only)
```

### 5. Error Response Format

#### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response (Development)

```json
{
  "success": false,
  "error": {
    "message": "User not found: 123",
    "statusCode": 404,
    "name": "NotFoundError",
    "stack": "NotFoundError: User not found: 123\n    at ..."
  }
}
```

#### Error Response (Production)

```json
{
  "success": false,
  "error": {
    "message": "User not found: 123",
    "statusCode": 404,
    "name": "NotFoundError"
  }
}
```

Note: Stack traces are excluded in production for security.

## Error Classes Reference

| Class             | Status Code   | Use Case                              |
| ----------------- | ------------- | ------------------------------------- |
| `AppError`        | 500 (default) | Base error class                      |
| `ValidationError` | 400           | Input validation failures             |
| `AuthError`       | 401/403       | Authentication/Authorization failures |
| `DatabaseError`   | 500           | Database operation failures           |
| `NotFoundError`   | 404           | Resource not found                    |

## Logger Configuration

### Log Levels

- **error**: Errors only
- **warn**: Warnings and above
- **info**: Info, warnings, errors (default)
- **debug**: All logs including debug

### Log Rotation

- Files rotate daily
- Logs kept for 14 days
- Max file size: 20MB

### Log Format

- **Production**: JSON (structured logging)
- **Development**: Colorized console + JSON files

## Environment Variables

```bash
# Optional: Set log level (default: info)
LOG_LEVEL=debug

# NODE_ENV determines logging behavior
NODE_ENV=development  # Logs to console + files
NODE_ENV=production   # Logs to files only
```

## Testing

Comprehensive test suite with 95%+ coverage:

```bash
# Run error handling tests
npm test -- __tests__/unit/errors/handler.test.ts

# Run with coverage
npm run test:coverage -- __tests__/unit/errors/handler.test.ts
```

## Best Practices

1. **Always use custom error classes** instead of generic Error
2. **Wrap async route handlers** with `asyncHandler` for automatic error catching
3. **Validate inputs early** and throw `ValidationError` for bad requests
4. **Log errors with context** using structured logging
5. **Never expose sensitive data** in error messages (handled automatically in production)

## Future Enhancements

Potential improvements:

- Error tracking integration (Sentry, Bugsnag, etc.)
- Custom error serialization for different formats
- Rate limiting for error logging
- Error aggregation and reporting
- Webhook notifications for critical errors

---

**Created**: 2025-10-28
**Version**: 1.0.0
**Coverage**: 95.16%
**Status**: Production Ready
