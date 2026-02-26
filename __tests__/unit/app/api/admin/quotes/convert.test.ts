/**
 * @file Admin Quote Convert API Route Unit Tests
 * @description Tests for POST /api/admin/quotes/[id]/convert
 */

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !init?.status || (init.status >= 200 && init.status < 300),
    })),
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("@/lib/middleware/auth", () => ({
  withAuth: jest.fn((handler: any) => handler),
}));

const mockConvertQuoteToProject = jest.fn();
jest.mock("@/lib/admin/quote-conversion", () => ({
  convertQuoteToProject: mockConvertQuoteToProject,
}));

// Mock error classes
jest.mock("@/lib/errors/app-error", () => {
  class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode = 500, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.name = "AppError";
    }
  }
  class ValidationError extends AppError {
    field?: string;
    constructor(message: string, field?: string) {
      super(message, 400);
      this.name = "ValidationError";
      this.field = field;
    }
  }
  class NotFoundError extends AppError {
    resource: string;
    id: string;
    constructor(resource: string, id: string) {
      super(`${resource} not found: ${id}`, 404);
      this.name = "NotFoundError";
      this.resource = resource;
      this.id = id;
    }
  }
  return { AppError, ValidationError, NotFoundError };
});

const {
  NotFoundError,
  ValidationError,
  AppError,
} = require("@/lib/errors/app-error");

const routeModule = require("@/app/api/admin/quotes/[id]/convert/route");
const POST = routeModule.POST;

function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/quotes/[id]/convert", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should convert quote to project successfully", async () => {
    const mockResult = {
      project: { id: "proj-1", title: "Web App" },
      quote: { id: "q-1", status: "CONVERTED", projectId: "proj-1" },
    };
    mockConvertQuoteToProject.mockResolvedValue(mockResult);

    const response = await POST({} as any, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project.id).toBe("proj-1");
    expect(data.quote.status).toBe("CONVERTED");
    expect(data.message).toBe("Quote converted successfully");
  });

  it("should return 404 when quote not found", async () => {
    mockConvertQuoteToProject.mockRejectedValue(
      new NotFoundError("Quote", "nonexistent"),
    );

    const response = await POST({} as any, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 400 for validation errors (non-pending quote)", async () => {
    mockConvertQuoteToProject.mockRejectedValue(
      new ValidationError(
        "Quote cannot be converted. Current status: CONVERTED",
        "status",
      ),
    );

    const response = await POST({} as any, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("cannot be converted");
  });

  it("should return 500 on unknown errors", async () => {
    mockConvertQuoteToProject.mockRejectedValue(
      new Error("Unknown database error"),
    );

    const response = await POST({} as any, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to convert quote to project");
  });

  it("should pass quoteId to convertQuoteToProject", async () => {
    mockConvertQuoteToProject.mockResolvedValue({
      project: { id: "proj-1" },
      quote: { id: "q-42" },
    });

    await POST({} as any, createContext("q-42"));

    expect(mockConvertQuoteToProject).toHaveBeenCalledWith("q-42");
  });
});
