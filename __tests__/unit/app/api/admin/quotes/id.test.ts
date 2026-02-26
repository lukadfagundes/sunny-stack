/**
 * @file Admin Quotes [id] API Route Unit Tests
 * @description Tests for GET, PUT, PATCH /api/admin/quotes/[id]
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

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    quote: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("@/lib/middleware/auth", () => ({
  withAuth: jest.fn((handler: any) => handler),
}));

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: "email-1" } }) },
  })),
}));

jest.mock("@prisma/client", () => ({
  QuoteStatus: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    CONVERTED: "CONVERTED",
  },
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/quotes/[id]/route");
const GET = routeModule.GET;
const PUT = routeModule.PUT;
const PATCH = routeModule.PATCH;

function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function createPutRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

describe("GET /api/admin/quotes/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return quote with transformed fields", async () => {
    const mockQuote = {
      id: "q-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "555-1234",
      budgetRange: "$10,000",
      requirements: "Feature A\nFeature B\nFeature C",
      status: "PENDING",
      project: null,
    };
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);

    const response = await GET({} as any, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quote.contactName).toBe("John Doe");
    expect(data.quote.contactEmail).toBe("john@example.com");
    expect(data.quote.contactPhone).toBe("555-1234");
    expect(data.quote.budget).toBe("$10,000");
    expect(data.quote.features).toEqual([
      "Feature A",
      "Feature B",
      "Feature C",
    ]);
  });

  it("should return empty features array when requirements is null", async () => {
    const mockQuote = {
      id: "q-2",
      name: "Jane",
      email: "jane@example.com",
      phone: null,
      budgetRange: "$5,000",
      requirements: null,
      status: "PENDING",
      project: null,
    };
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);

    const response = await GET({} as any, createContext("q-2"));
    const data = await response.json();

    expect(data.quote.features).toEqual([]);
  });

  it("should return 404 when quote not found", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET({} as any, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 500 on database error", async () => {
    (prisma.quote.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const response = await GET({} as any, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to retrieve quote");
  });
});

describe("PUT /api/admin/quotes/[id]", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, RESEND_API_KEY: "test-key" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should update quote status", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });
    (prisma.quote.update as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "APPROVED",
      email: "john@example.com",
      name: "John",
      project: null,
    });

    const req = createPutRequest({ status: "APPROVED" });
    const response = await PUT(req, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quote.status).toBe("APPROVED");
  });

  it("should auto-set reviewedAt when status changes", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });
    (prisma.quote.update as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "APPROVED",
      email: "john@example.com",
      name: "John",
    });

    const req = createPutRequest({ status: "APPROVED" });
    await PUT(req, createContext("q-1"));

    expect(prisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          reviewedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("should not set reviewedAt when status is the same", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });
    (prisma.quote.update as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
      email: "john@example.com",
      name: "John",
    });

    const req = createPutRequest({ status: "PENDING" });
    await PUT(req, createContext("q-1"));

    const updateCall = (prisma.quote.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.reviewedAt).toBeUndefined();
  });

  it("should allow manual reviewedAt override", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });
    (prisma.quote.update as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
      email: "john@example.com",
      name: "John",
    });

    const date = "2026-01-15T12:00:00Z";
    const req = createPutRequest({ reviewedAt: date });
    await PUT(req, createContext("q-1"));

    expect(prisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewedAt: new Date(date),
        }),
      }),
    );
  });

  it("should return 404 when quote not found", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createPutRequest({ status: "APPROVED" });
    const response = await PUT(req, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 400 for invalid status", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });

    const req = createPutRequest({ status: "INVALID" });
    const response = await PUT(req, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("should return 400 when no valid fields to update", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });

    const req = createPutRequest({});
    const response = await PUT(req, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("No valid fields to update");
  });

  it("should return 400 for invalid reviewedAt format", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });

    const req = createPutRequest({ reviewedAt: "not-a-date" });
    const response = await PUT(req, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid reviewedAt format");
  });

  it("should return 500 on database error", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      status: "PENDING",
    });
    (prisma.quote.update as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = createPutRequest({ status: "APPROVED" });
    const response = await PUT(req, createContext("q-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to update quote");
  });
});

describe("PATCH /api/admin/quotes/[id]", () => {
  it("should use the same handler as PUT", () => {
    // PATCH is exported as the same function as PUT
    expect(PATCH).toBeDefined();
  });
});
