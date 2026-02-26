/**
 * @file Admin Time Reports API Route Unit Tests
 * @description Tests for GET /api/admin/reports/time
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
    project: {
      findMany: jest.fn(),
    },
    timeEntry: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("@/lib/middleware/auth", () => ({
  withBotAuth: jest.fn((handler: any) => handler),
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/reports/time/route");
const GET = routeModule.GET;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/reports/time");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return { url: url.toString() } as any;
}

describe("GET /api/admin/reports/time", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return time report with default groupBy (project)", async () => {
    // Mock counts
    (prisma.timeEntry.count as jest.Mock)
      .mockResolvedValueOnce(10) // totalEntries
      .mockResolvedValueOnce(2); // activeEntries
    // Mock completed entries
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValueOnce([
      { durationMinutes: 60 },
      { durationMinutes: 120 },
    ]);
    // Mock groupBy
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([
      {
        projectId: "proj-1",
        _sum: { durationMinutes: 180 },
        _count: { id: 2 },
      },
    ]);
    // Mock project names
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      { id: "proj-1", title: "Test Project" },
    ]);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalTime).toBe(180);
    expect(data.summary.totalEntries).toBe(10);
    expect(data.summary.activeEntries).toBe(2);
    expect(data.breakdown).toHaveLength(1);
    expect(data.breakdown[0].label).toBe("Test Project");
  });

  it("should filter by projectId", async () => {
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(0);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

    const req = createGetRequest({ projectId: "proj-1" });
    await GET(req);

    expect(prisma.timeEntry.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: "proj-1" }),
      }),
    );
  });

  it("should filter by date range", async () => {
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(0);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

    const req = createGetRequest({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    await GET(req);

    expect(prisma.timeEntry.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it("should group by day", async () => {
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(1);
    (prisma.timeEntry.findMany as jest.Mock)
      .mockResolvedValueOnce([{ durationMinutes: 60 }]) // completed entries for totalTime
      .mockResolvedValueOnce([
        // entries for day grouping
        { startedAt: new Date("2026-01-15T10:00:00Z"), durationMinutes: 60 },
      ]);

    const req = createGetRequest({ groupBy: "day" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.breakdown).toBeDefined();
  });

  it("should group by week", async () => {
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(1);
    (prisma.timeEntry.findMany as jest.Mock)
      .mockResolvedValueOnce([{ durationMinutes: 60 }])
      .mockResolvedValueOnce([
        { startedAt: new Date("2026-01-15T10:00:00Z"), durationMinutes: 60 },
      ]);

    const req = createGetRequest({ groupBy: "week" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.breakdown).toBeDefined();
  });

  it("should group by month", async () => {
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(1);
    (prisma.timeEntry.findMany as jest.Mock)
      .mockResolvedValueOnce([{ durationMinutes: 60 }])
      .mockResolvedValueOnce([
        { startedAt: new Date("2026-01-15T10:00:00Z"), durationMinutes: 60 },
      ]);

    const req = createGetRequest({ groupBy: "month" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.breakdown).toBeDefined();
  });

  it("should return 400 for invalid groupBy", async () => {
    const req = createGetRequest({ groupBy: "invalid" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid groupBy");
  });

  it("should return 400 for invalid startDate format", async () => {
    const req = createGetRequest({ startDate: "not-a-date" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid startDate");
  });

  it("should return 400 for invalid endDate format", async () => {
    const req = createGetRequest({ endDate: "not-a-date" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid endDate");
  });

  it("should return 500 on database error", async () => {
    (prisma.timeEntry.count as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate time report");
  });
});
