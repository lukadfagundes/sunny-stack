/**
 * @file Admin Sync API Route Unit Tests
 * @description Tests for POST /api/admin/sync
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
    project: { count: jest.fn() },
    quote: { count: jest.fn() },
    timeEntry: { count: jest.fn() },
    monitoringEvent: { count: jest.fn() },
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("@/lib/middleware/auth", () => ({
  withAuth: jest.fn((handler: any) => handler),
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/sync/route");
const POST = routeModule.POST;

function createPostRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

describe("POST /api/admin/sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sync projects", async () => {
    (prisma.project.count as jest.Mock).mockResolvedValue(10);

    const req = createPostRequest({ type: "projects" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.syncType).toBe("projects");
    expect(data.results.projects.synced).toBe(10);
    expect(data.timestamp).toBeDefined();
    expect(data.duration).toBeDefined();
  });

  it("should sync quotes", async () => {
    (prisma.quote.count as jest.Mock).mockResolvedValue(5);

    const req = createPostRequest({ type: "quotes" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.quotes.synced).toBe(5);
  });

  it("should sync time entries", async () => {
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(20);

    const req = createPostRequest({ type: "time" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.timeEntries.synced).toBe(20);
  });

  it("should sync monitoring events", async () => {
    (prisma.monitoringEvent.count as jest.Mock).mockResolvedValue(100);

    const req = createPostRequest({ type: "monitoring" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.monitoring.synced).toBe(100);
  });

  it("should sync all types", async () => {
    (prisma.project.count as jest.Mock).mockResolvedValue(10);
    (prisma.quote.count as jest.Mock).mockResolvedValue(5);
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(20);
    (prisma.monitoringEvent.count as jest.Mock).mockResolvedValue(100);

    const req = createPostRequest({ type: "all" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.syncType).toBe("all");
    expect(data.results.projects).toBeDefined();
    expect(data.results.quotes).toBeDefined();
    expect(data.results.timeEntries).toBeDefined();
    expect(data.results.monitoring).toBeDefined();
  });

  it("should throw ValidationError for invalid sync type", async () => {
    const req = createPostRequest({ type: "invalid" });

    await expect(POST(req)).rejects.toThrow("Invalid sync type");
  });

  it("should throw ValidationError for missing type", async () => {
    const req = createPostRequest({});

    await expect(POST(req)).rejects.toThrow("Invalid sync type");
  });

  it("should throw AppError on database error", async () => {
    (prisma.project.count as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createPostRequest({ type: "projects" });

    await expect(POST(req)).rejects.toThrow("Failed to perform sync operation");
  });
});
