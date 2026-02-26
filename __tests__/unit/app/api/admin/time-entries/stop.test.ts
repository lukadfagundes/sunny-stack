/**
 * @file Admin Time Entry Stop API Route Unit Tests
 * @description Tests for POST /api/admin/time-entries/[id]/stop
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
    timeEntry: {
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
  withBotAuth: jest.fn((handler: any) => handler),
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/time-entries/[id]/stop/route");
const POST = routeModule.POST;

function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/time-entries/[id]/stop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should stop an active time entry and calculate duration", async () => {
    const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
      id: "te-1",
      projectId: "proj-1",
      description: "Working on tests",
      startedAt,
      endedAt: null,
      durationMinutes: null,
      loggedVia: "discord",
      project: { id: "proj-1", title: "Test Project" },
    });
    (prisma.timeEntry.update as jest.Mock).mockResolvedValue({
      id: "te-1",
      projectId: "proj-1",
      description: "Working on tests",
      startedAt,
      endedAt: new Date(),
      durationMinutes: 60,
      loggedVia: "discord",
    });

    const response = await POST({} as any, createContext("te-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timeEntry.id).toBe("te-1");
    expect(data.timeEntry.durationMinutes).toBe(60);
    expect(data.project.title).toBe("Test Project");

    expect(prisma.timeEntry.update).toHaveBeenCalledWith({
      where: { id: "te-1" },
      data: {
        endedAt: expect.any(Date),
        durationMinutes: expect.any(Number),
      },
      select: expect.any(Object),
    });
  });

  it("should return 404 when time entry not found", async () => {
    (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST({} as any, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 409 when timer is already stopped", async () => {
    const endedAt = new Date();
    (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
      id: "te-1",
      startedAt: new Date(Date.now() - 3600000),
      endedAt,
      durationMinutes: 60,
      project: { id: "proj-1", title: "Test" },
    });

    const response = await POST({} as any, createContext("te-1"));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Timer already stopped");
    expect(data.timeEntry.durationMinutes).toBe(60);
  });

  it("should return 400 when id is missing", async () => {
    const response = await POST({} as any, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Time entry ID is required");
  });

  it("should return 500 on database error", async () => {
    (prisma.timeEntry.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const response = await POST({} as any, createContext("te-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to stop time entry");
  });
});
