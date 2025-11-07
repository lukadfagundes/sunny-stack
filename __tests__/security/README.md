# Security Test Suite

OWASP Top 10 security tests for Sunny Stack.

## Test Coverage

- **access-control.test.ts** - A01: Broken Access Control (5 tests)
- **injection-prevention.test.ts** - A03: Injection (5 tests)
- **authentication.test.ts** - A07: Authentication Failures (5 tests)
- **security-headers.test.ts** - A05: Security Misconfiguration (4 tests)
- **csrf-protection.test.ts** - A08: Data Integrity Failures (4 tests)

**Total:** 23 security tests

## Running Tests

```bash
# Run all security tests
npm test -- __tests__/security

# Run specific test file
npm test -- __tests__/security/access-control.test.ts

# Watch mode
npm test -- __tests__/security --watch
```

## CI/CD Integration

Security tests run automatically on every PR via `.github/workflows/test.yml`.
