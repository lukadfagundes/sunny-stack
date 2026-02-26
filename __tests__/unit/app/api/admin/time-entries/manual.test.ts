/**
 * @file Admin Manual Time Entry API Route Unit Tests
 * @description Tests for POST /api/admin/time-entries/manual
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
      findUnique: jest.fn(),
    },
    timeEntry: {
      create: jest.fn(),
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

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/time-entries/manual/route");
const POST = routeModule.POST;

function createPostRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

describe("POST /api/admin/time-entries/manual", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a manual time entry", async () => {
    const startedAt = "2026-01-15T09:00:00Z";
    const endedAt = "2026-01-15T11:00:00Z";

    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test Project",
    });
    (prisma.timeEntry.create as jest.Mock).mockResolvedValue({
      id: "te-1",
      projectId: "proj-1",
      description: "Manual entry",
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      durationMinutes: 120,
    });

    const req = createPostRequest({
      projectId: "proj-1",
      description: "Manual entry",
      startedAt,
      endedAt,
      durationMinutes: 120,
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timeEntry.id).toBe("te-1");
    expect(data.timeEntry.durationMinutes).toBe(120);
    expect(data.project.title).toBe("Test Project");
  });

  it("should throw ValidationError for missing projectId", async () => {
    const req = createPostRequest({
      startedAt: "2026-01-15T09:00:00Z",
      endedAt: "2026-01-15T11:00:00Z",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow("Project ID is required");
  });

  it("should throw ValidationError for missing startedAt", async () => {
    const req = createPostRequest({
      projectId: "proj-1",
      endedAt: "2026-01-15T11:00:00Z",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow("Start time is required");
  });

  it("should throw ValidationError for missing endedAt", async () => {
    const req = createPostRequest({
      projectId: "proj-1",
      startedAt: "2026-01-15T09:00:00Z",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow("End time is required");
  });

  it("should throw ValidationError for zero duration", async () => {
    const req = createPostRequest({
      projectId: "proj-1",
      startedAt: "2026-01-15T09:00:00Z",
      endedAt: "2026-01-15T11:00:00Z",
      durationMinutes: 0,
    });

    await expect(POST(req)).rejects.toThrow("Duration must be greater than 0");
  });

  it("should throw ValidationError when project not found", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createPostRequest({
      projectId: "nonexistent",
      startedAt: "2026-01-15T09:00:00Z",
      endedAt: "2026-01-15T11:00:00Z",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow("Project not found");
  });

  it("should throw ValidationError for invalid date format", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
    });

    const req = createPostRequest({
      projectId: "proj-1",
      startedAt: "not-a-date",
      endedAt: "also-not-a-date",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow("Invalid date format");
  });

  it("should throw ValidationError when end time is before start time", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
    });

    const req = createPostRequest({
      projectId: "proj-1",
      startedAt: "2026-01-15T11:00:00Z",
      endedAt: "2026-01-15T09:00:00Z",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow(
      "End time must be after start time",
    );
  });

  it("should throw AppError on database error", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
    });
    (prisma.timeEntry.create as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createPostRequest({
      projectId: "proj-1",
      startedAt: "2026-01-15T09:00:00Z",
      endedAt: "2026-01-15T11:00:00Z",
      durationMinutes: 120,
    });

    await expect(POST(req)).rejects.toThrow(
      "Failed to create manual time entry",
    );
  });
});
