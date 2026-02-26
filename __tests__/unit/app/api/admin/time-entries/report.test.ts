/**
 * @file Admin Time Entries Report API Route Unit Tests
 * @description Tests for GET /api/admin/time-entries/report
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
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
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

const routeModule = require("@/app/api/admin/time-entries/report/route");
const GET = routeModule.GET;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/time-entries/report");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return { url: url.toString() } as any;
}

describe("GET /api/admin/time-entries/report", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return report with default period (all)", async () => {
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: 480 },
      _count: { id: 5 },
    });
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([
      {
        projectId: "proj-1",
        _sum: { durationMinutes: 480 },
        _count: { id: 5 },
      },
    ]);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: "te-1",
        description: "Work",
        durationMinutes: 60,
        startedAt: new Date(),
        project: { id: "proj-1", title: "Test Project" },
      },
    ]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      { id: "proj-1", title: "Test Project" },
    ]);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalMinutes).toBe(480);
    expect(data.entryCount).toBe(5);
    expect(data.projectBreakdown).toHaveLength(1);
    expect(data.projectBreakdown[0].projectTitle).toBe("Test Project");
    expect(data.recentEntries).toHaveLength(1);
  });

  it("should filter by period (today, week, month)", async () => {
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: 0 },
      _count: { id: 0 },
    });
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

    for (const period of ["today", "week", "month"]) {
      const req = createGetRequest({ period });
      const response = await GET(req);
      expect(response.status).toBe(200);
    }
  });

  it("should filter by projectId", async () => {
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: 120 },
      _count: { id: 2 },
    });
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

    const req = createGetRequest({ projectId: "proj-1" });
    await GET(req);

    expect(prisma.timeEntry.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: "proj-1" }),
      }),
    );
  });

  it("should search by projectTitle when single match", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValueOnce([
      { id: "proj-1", title: "Test Project", clientName: "Client" },
    ]);
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: 60 },
      _count: { id: 1 },
    });
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

    const req = createGetRequest({ projectTitle: "Test" });
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  it("should return empty report when no projects match title", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValueOnce([]);

    const req = createGetRequest({ projectTitle: "Nonexistent" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalMinutes).toBe(0);
    expect(data.entryCount).toBe(0);
  });

  it("should return 400 when multiple projects match title", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValueOnce([
      { id: "proj-1", title: "Project A", clientName: "Client A" },
      { id: "proj-2", title: "Project AB", clientName: "Client B" },
    ]);

    const req = createGetRequest({ projectTitle: "Project" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Multiple projects found");
    expect(data.projects).toHaveLength(2);
  });

  it("should return 400 for invalid period", async () => {
    const req = createGetRequest({ period: "invalid" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid period");
  });

  it("should return 500 on database error", async () => {
    (prisma.timeEntry.aggregate as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate time report");
  });

  it("should handle null durationMinutes in totals", async () => {
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: null },
      _count: { id: 0 },
    });
    (prisma.timeEntry.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(data.totalMinutes).toBe(0);
  });
});
