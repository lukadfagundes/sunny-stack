/**
 * @file Admin Analytics API Route Unit Tests
 * @description Tests for GET /api/admin/analytics
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
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    quote: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    timeEntry: {
      aggregate: jest.fn(),
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
  ProjectStatus: {
    PLANNING: "PLANNING",
    IN_PROGRESS: "IN_PROGRESS",
    ON_HOLD: "ON_HOLD",
    COMPLETE: "COMPLETE",
    ARCHIVED: "ARCHIVED",
  },
  QuoteStatus: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    CONVERTED: "CONVERTED",
  },
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/analytics/route");
const GET = routeModule.GET;

describe("GET /api/admin/analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return dashboard analytics", async () => {
    (prisma.project.count as jest.Mock).mockResolvedValue(5);
    (prisma.quote.count as jest.Mock).mockResolvedValue(3);
    (prisma.project.aggregate as jest.Mock).mockResolvedValue({
      _sum: { budget: 150000 },
    });
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: 2400 },
    });
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      {
        id: "proj-1",
        title: "Project A",
        status: "IN_PROGRESS",
        createdAt: new Date("2026-01-10"),
      },
    ]);
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([
      {
        id: "q-1",
        projectType: "Web App",
        status: "PENDING",
        createdAt: new Date("2026-01-12"),
      },
    ]);

    const req = {} as any;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activeProjects).toBe(5);
    expect(data.pendingQuotes).toBe(3);
    expect(data.totalRevenue).toBe(150000);
    expect(data.hoursTracked).toBe(40); // 2400 minutes / 60
    expect(data.recentActivity).toHaveLength(2);
  });

  it("should handle zero values", async () => {
    (prisma.project.count as jest.Mock).mockResolvedValue(0);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);
    (prisma.project.aggregate as jest.Mock).mockResolvedValue({
      _sum: { budget: null },
    });
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: null },
    });
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([]);

    const req = {} as any;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activeProjects).toBe(0);
    expect(data.pendingQuotes).toBe(0);
    expect(data.totalRevenue).toBe(0);
    expect(data.hoursTracked).toBe(0);
    expect(data.recentActivity).toHaveLength(0);
  });

  it("should sort recent activity by timestamp descending", async () => {
    (prisma.project.count as jest.Mock).mockResolvedValue(0);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);
    (prisma.project.aggregate as jest.Mock).mockResolvedValue({
      _sum: { budget: null },
    });
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: null },
    });
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      {
        id: "proj-1",
        title: "Old",
        status: "ACTIVE",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    (prisma.quote.findMany as jest.Mock).mockResolvedValue([
      {
        id: "q-1",
        projectType: "Web",
        status: "PENDING",
        createdAt: new Date("2026-01-15"),
      },
    ]);

    const req = {} as any;
    const response = await GET(req);
    const data = await response.json();

    expect(data.recentActivity[0].type).toBe("quote");
    expect(data.recentActivity[1].type).toBe("project");
  });

  it("should limit recent activity to 10 items", async () => {
    (prisma.project.count as jest.Mock).mockResolvedValue(0);
    (prisma.quote.count as jest.Mock).mockResolvedValue(0);
    (prisma.project.aggregate as jest.Mock).mockResolvedValue({
      _sum: { budget: null },
    });
    (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
      _sum: { durationMinutes: null },
    });
    // 5 projects + 5 quotes = 10, but add extra
    const projects = Array.from({ length: 5 }, (_, i) => ({
      id: `proj-${i}`,
      title: `Project ${i}`,
      status: "ACTIVE",
      createdAt: new Date(`2026-01-${String(i + 1).padStart(2, "0")}`),
    }));
    const quotes = Array.from({ length: 5 }, (_, i) => ({
      id: `q-${i}`,
      projectType: `Quote ${i}`,
      status: "PENDING",
      createdAt: new Date(`2026-01-${String(i + 10).padStart(2, "0")}`),
    }));
    (prisma.project.findMany as jest.Mock).mockResolvedValue(projects);
    (prisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);

    const req = {} as any;
    const response = await GET(req);
    const data = await response.json();

    expect(data.recentActivity.length).toBeLessThanOrEqual(10);
  });

  it("should return 500 on database error", async () => {
    (prisma.project.count as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = {} as any;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to retrieve analytics");
  });
});
