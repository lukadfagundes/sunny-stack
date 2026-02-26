/**
 * @file Admin Time Entries API Route Unit Tests
 * @description Tests for POST (start timer) and GET (list) /api/admin/time-entries
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
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
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

const routeModule = require("@/app/api/admin/time-entries/route");
const POST = routeModule.POST;
const GET = routeModule.GET;

function createPostRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/time-entries");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return { url: url.toString() } as any;
}

describe("POST /api/admin/time-entries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start a new time entry", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test Project",
      deletedAt: null,
    });
    (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.timeEntry.create as jest.Mock).mockResolvedValue({
      id: "te-1",
      projectId: "proj-1",
      description: null,
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: null,
      loggedVia: "discord",
    });

    const req = createPostRequest({ projectId: "proj-1" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.timeEntry.id).toBe("te-1");
    expect(data.project.title).toBe("Test Project");
  });

  it("should start timer with description and loggedVia", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
      deletedAt: null,
    });
    (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.timeEntry.create as jest.Mock).mockResolvedValue({
      id: "te-2",
      projectId: "proj-1",
      description: "Working on feature X",
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: null,
      loggedVia: "web",
    });

    const req = createPostRequest({
      projectId: "proj-1",
      description: "Working on feature X",
      loggedVia: "web",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.timeEntry.description).toBe("Working on feature X");
    expect(data.timeEntry.loggedVia).toBe("web");
  });

  it("should return 400 for missing projectId", async () => {
    const req = createPostRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Project ID is required");
  });

  it("should return 404 when project not found", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createPostRequest({ projectId: "nonexistent" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 400 for deleted project", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Deleted",
      deletedAt: new Date(),
    });

    const req = createPostRequest({ projectId: "proj-1" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Cannot start timer for deleted project");
  });

  it("should return 409 when active timer already exists", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
      deletedAt: null,
    });
    (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({
      id: "te-existing",
      endedAt: null,
    });

    const req = createPostRequest({ projectId: "proj-1" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("Active timer already exists");
    expect(data.activeTimerId).toBe("te-existing");
  });

  it("should return 400 for description exceeding 500 characters", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
      deletedAt: null,
    });
    (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createPostRequest({
      projectId: "proj-1",
      description: "A".repeat(501),
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("500 characters or less");
  });

  it("should return 400 for invalid loggedVia", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
      deletedAt: null,
    });
    (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createPostRequest({
      projectId: "proj-1",
      loggedVia: "invalid",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("loggedVia must be one of");
  });

  it("should return 500 on database error", async () => {
    (prisma.project.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createPostRequest({ projectId: "proj-1" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to start time entry");
  });
});

describe("GET /api/admin/time-entries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated time entries with default parameters", async () => {
    const mockEntries = [
      {
        id: "te-1",
        projectId: "proj-1",
        description: "Test",
        startedAt: new Date(),
        endedAt: null,
        durationMinutes: null,
        loggedVia: "discord",
        project: { id: "proj-1", title: "Test", clientName: "Client" },
      },
    ];
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(1);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timeEntries).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("should filter by projectId", async () => {
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ projectId: "proj-1" });
    await GET(req);

    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: "proj-1" }),
      }),
    );
  });

  it("should filter by active status", async () => {
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ status: "active" });
    await GET(req);

    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ endedAt: null }),
      }),
    );
  });

  it("should filter by completed status", async () => {
    (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeEntry.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ status: "completed" });
    await GET(req);

    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ endedAt: { not: null } }),
      }),
    );
  });

  it("should return 400 for invalid status filter", async () => {
    const req = createGetRequest({ status: "invalid" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("should return 400 for invalid pagination", async () => {
    const req = createGetRequest({ page: "-1" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("positive numbers");
  });

  it("should return 500 on database error", async () => {
    (prisma.timeEntry.findMany as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );
    (prisma.timeEntry.count as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to retrieve time entries");
  });
});
