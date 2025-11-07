// jest.setup.js
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill setImmediate for Jest environment (required by Winston)
if (typeof global.setImmediate === "undefined") {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
  global.clearImmediate = (id) => {
    return clearTimeout(id);
  };
}

// Polyfill TextEncoder and TextDecoder for Node.js test environment
// Required by undici (used by discord.js and Next.js)
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill Request, Response, and Streams for Next.js in test environment
if (typeof global.Request === "undefined") {
  const { Readable } = require("stream");
  const {
    ReadableStream,
    WritableStream,
    TransformStream,
  } = require("stream/web");

  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;

  const { Request, Response, Headers, fetch } = require("undici");
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
  global.fetch = fetch;
}

// Mock PrismaClient globally for ALL tests
// Integration tests that need real DB should use jest.unmock('@prisma/client') in their test files
const mockQueryRaw = jest.fn();
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: mockQueryRaw,
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    // Add all Prisma model methods as mocks for integration test compatibility
    user: { deleteMany: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    project: { deleteMany: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    quote: { deleteMany: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    proposal: { deleteMany: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    timeEntry: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    discordMessage: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    monitoringEvent: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    apiKey: { deleteMany: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    webhook: { deleteMany: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    systemConfig: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    quoteRequest: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    contactMessage: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    // Store mock functions on the instance for test access
    __mockQueryRaw: mockQueryRaw,
    __mockConnect: mockConnect,
    __mockDisconnect: mockDisconnect,
  })),
  // Export Prisma enums for tests
  QuoteStatus: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    CONVERTED: "CONVERTED",
  },
  ProjectStatus: {
    PLANNING: "PLANNING",
    IN_PROGRESS: "IN_PROGRESS",
    REVIEW: "REVIEW",
    COMPLETE: "COMPLETE",
    ARCHIVED: "ARCHIVED",
  },
  Severity: {
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL",
  },
  EventType: {
    DEPLOYMENT: "DEPLOYMENT",
    UPTIME_CHECK: "UPTIME_CHECK",
    ERROR: "ERROR",
    ALERT: "ALERT",
  },
}));

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
