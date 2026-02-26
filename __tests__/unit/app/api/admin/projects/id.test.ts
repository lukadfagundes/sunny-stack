/**
 * @file Admin Projects [id] API Route Unit Tests
 * @description Tests for GET, PUT, DELETE /api/admin/projects/[id]
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
      findFirst: jest.fn(),
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

jest.mock("@prisma/client", () => ({
  ProjectStatus: {
    PLANNING: "PLANNING",
    IN_PROGRESS: "IN_PROGRESS",
    ON_HOLD: "ON_HOLD",
    COMPLETE: "COMPLETE",
    ARCHIVED: "ARCHIVED",
  },
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/projects/[id]/route");
const GET = routeModule.GET;
const PUT = routeModule.PUT;
const DELETE = routeModule.DELETE;

function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function createPutRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

describe("GET /api/admin/projects/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return project with relations", async () => {
    const mockProject = {
      id: "proj-1",
      title: "Test Project",
      status: "ACTIVE",
      quotes: [],
      timeEntries: [],
      discordMessages: [],
    };
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

    const response = await GET({} as any, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project.id).toBe("proj-1");
    expect(data.project.title).toBe("Test Project");
  });

  it("should return 404 when project not found", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await GET({} as any, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should exclude soft-deleted projects", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

    await GET({} as any, createContext("proj-1"));

    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "proj-1", deletedAt: null }),
      }),
    );
  });

  it("should return 500 on database error", async () => {
    (prisma.project.findFirst as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const response = await GET({} as any, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to retrieve project");
  });
});

describe("PUT /api/admin/projects/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update project title", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
    (prisma.project.update as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Updated Title",
    });

    const req = createPutRequest({ title: "Updated Title" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project.title).toBe("Updated Title");
  });

  it("should update project status", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
    (prisma.project.update as jest.Mock).mockResolvedValue({
      id: "proj-1",
      status: "IN_PROGRESS",
    });

    const req = createPutRequest({ status: "IN_PROGRESS" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project.status).toBe("IN_PROGRESS");
  });

  it("should update budget to a number", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
    (prisma.project.update as jest.Mock).mockResolvedValue({
      id: "proj-1",
      budget: 50000,
    });

    const req = createPutRequest({ budget: "50000" });
    await PUT(req, createContext("proj-1"));

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: expect.objectContaining({ budget: 50000 }),
    });
  });

  it("should allow setting budget to null", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
    (prisma.project.update as jest.Mock).mockResolvedValue({
      id: "proj-1",
      budget: null,
    });

    const req = createPutRequest({ budget: null });
    await PUT(req, createContext("proj-1"));

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: expect.objectContaining({ budget: null }),
    });
  });

  it("should update deadline", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
    (prisma.project.update as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const req = createPutRequest({ deadline: "2026-12-31" });
    await PUT(req, createContext("proj-1"));

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: expect.objectContaining({
        deadline: expect.any(Date),
      }),
    });
  });

  it("should return 404 when project not found", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createPutRequest({ title: "Updated" });
    const response = await PUT(req, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 400 for empty title", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const req = createPutRequest({ title: "   " });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Title must be a non-empty string");
  });

  it("should return 400 for invalid status", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const req = createPutRequest({ status: "BAD_STATUS" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("should return 400 for negative budget", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const req = createPutRequest({ budget: "-100" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Budget must be a positive number");
  });

  it("should return 400 for invalid email format", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const req = createPutRequest({ clientEmail: "not-email" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid email format");
  });

  it("should return 400 for invalid deadline format", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const req = createPutRequest({ deadline: "not-a-date" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid deadline format");
  });

  it("should return 500 on database error", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
    (prisma.project.update as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createPutRequest({ title: "Updated" });
    const response = await PUT(req, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to update project");
  });
});

describe("DELETE /api/admin/projects/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should soft delete project", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      title: "Test",
      deletedAt: null,
    });
    (prisma.project.update as jest.Mock).mockResolvedValue({ id: "proj-1" });

    const response = await DELETE({} as any, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Project deleted successfully");
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("should return 404 when project not found", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await DELETE({} as any, createContext("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should return 400 when project already deleted", async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: "proj-1",
      deletedAt: new Date(),
    });

    const response = await DELETE({} as any, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("already deleted");
  });

  it("should return 500 on database error", async () => {
    (prisma.project.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const response = await DELETE({} as any, createContext("proj-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to delete project");
  });
});
