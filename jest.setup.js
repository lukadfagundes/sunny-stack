// jest.setup.js
import "@testing-library/jest-dom";

// Polyfill setImmediate for Jest environment (required by Winston)
if (typeof global.setImmediate === "undefined") {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
  global.clearImmediate = (id) => {
    return clearTimeout(id);
  };
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      reload: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables for testing - NOT REAL SECRETS
process.env.RESEND_API_KEY = "test_api_key_for_jest_testing";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.DATABASE_URL_UNPOOLED =
  "postgresql://test:test@localhost:5432/test_db";
process.env.ADMIN_EMAIL = "test@example.com";

// Suppress console errors during tests (optional, remove if you want to see errors)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
