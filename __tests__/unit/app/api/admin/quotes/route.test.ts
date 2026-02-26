/**
 * @file Admin Quotes API Route Unit Tests
 * @description Tests for GET /api/admin/quotes
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
      findMany: jest.fn(),
      count: jest.fn(),
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

jest.mock("@prisma/client", () => ({
  QuoteStatus: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    CONVERTED: "CONVERTED",
  },
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/quotes/route");
const GET = routeModule.GET;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/quotes");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return { url: url.toString() } as any;
}

describe("GET /api/admin/quotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated quotes with default parameters", async () => {
    const mockQuotes = [
      {
        id: "q-1",
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        budgetRange: "$10,000",
        status: "PENDING",
        project: null,
      },
    ];
    (prisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);
    (prisma.quote.count as jest.Mock).mockResolvedValue(1);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quotes).toHaveLength(1);
    expect(data.quotes[0].contactName).toBe("John Doe");
    expect(data.quotes[0].contactEmail).toBe("john@example.com");
    expect(data.quotes[0].budget).toBe("$10,000");
    expect(data.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    });
  });

  it("should filter by status", async () => {
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ status: "PENDING" });
    await GET(req);

    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PENDING" }),
      }),
    );
  });

  it("should filter by email (case-insensitive)", async () => {
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ email: "john" });
    await GET(req);

    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: { contains: "john", mode: "insensitive" },
        }),
      }),
    );
  });

  it("should filter by company (case-insensitive)", async () => {
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ company: "Acme" });
    await GET(req);

    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          company: { contains: "Acme", mode: "insensitive" },
        }),
      }),
    );
  });

  it("should respect pagination parameters", async () => {
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.count as jest.Mock).mockResolvedValue(100);

    const req = createGetRequest({ page: "3", limit: "20" });
    const response = await GET(req);
    const data = await response.json();

    expect(data.pagination.page).toBe(3);
    expect(data.pagination.limit).toBe(20);
    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
  });

  it("should cap limit at 100", async () => {
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ limit: "500" });
    const response = await GET(req);
    const data = await response.json();

    expect(data.pagination.limit).toBe(100);
  });

  it("should return 400 for invalid sort field", async () => {
    const req = createGetRequest({ sort: "invalidField" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid sort field");
  });

  it("should return 400 for invalid status", async () => {
    const req = createGetRequest({ status: "INVALID" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("should return 400 for invalid pagination", async () => {
    const req = createGetRequest({ page: "0" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("positive numbers");
  });

  it("should return 500 on database error", async () => {
    (prisma.quote.findMany as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );
    (prisma.quote.count as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to retrieve quotes");
  });

  it("should support sorting by different fields", async () => {
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ sort: "name", order: "asc" });
    await GET(req);

    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      }),
    );
  });
});
