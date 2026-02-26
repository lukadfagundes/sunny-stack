/**
 * @file Admin Projects API Route Unit Tests
 * @description Tests for GET and POST /api/admin/projects
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

const routeModule = require("@/app/api/admin/projects/route");
const GET = routeModule.GET;
const POST = routeModule.POST;

// Helper to create mock NextRequest for GET with search params
function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/projects");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return {
    url: url.toString(),
    nextUrl: { searchParams: url.searchParams },
  } as any;
}

// Helper to create mock NextRequest for POST with body
function createPostRequest(body: any) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as any;
}

describe("GET /api/admin/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated projects with default parameters", async () => {
    const mockProjects = [
      { id: "1", title: "Project A", status: "ACTIVE", clientName: "Client A" },
    ];
    (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
    (prisma.project.count as jest.Mock).mockResolvedValue(1);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projects).toHaveLength(1);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    });
  });

  it("should respect pagination parameters", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(100);

    const req = createGetRequest({ page: "2", limit: "10" });
    const response = await GET(req);
    const data = await response.json();

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it("should cap limit at 100", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ limit: "500" });
    const response = await GET(req);
    const data = await response.json();

    expect(data.pagination.limit).toBe(100);
  });

  it("should filter by status", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ status: "PLANNING" });
    await GET(req);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PLANNING" }),
      }),
    );
  });

  it("should filter by title (case-insensitive contains)", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ title: "test" });
    await GET(req);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: "test", mode: "insensitive" },
        }),
      }),
    );
  });

  it("should support exact title match", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ title: "Test Project", exact: "true" });
    await GET(req);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { equals: "Test Project", mode: "insensitive" },
        }),
      }),
    );
  });

  it("should support sorting", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest({ sort: "title", order: "asc" });
    await GET(req);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { title: "asc" },
      }),
    );
  });

  it("should return 400 for invalid sort field", async () => {
    const req = createGetRequest({ sort: "invalidField" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid sort field");
  });

  it("should return 400 for invalid pagination", async () => {
    const req = createGetRequest({ page: "0" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("positive numbers");
  });

  it("should return 400 for invalid status filter", async () => {
    const req = createGetRequest({ status: "INVALID_STATUS" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("should exclude soft-deleted projects", async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    const req = createGetRequest();
    await GET(req);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it("should return 500 on database error", async () => {
    (prisma.project.findMany as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );
    (prisma.project.count as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to retrieve projects");
  });
});

describe("POST /api/admin/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a project with required fields", async () => {
    const mockProject = {
      id: "proj-1",
      title: "New Project",
      clientName: "John Doe",
      clientEmail: "john@example.com",
      status: "PLANNING",
    };
    (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

    const req = createPostRequest({
      title: "New Project",
      clientName: "John Doe",
      clientEmail: "john@example.com",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.project.id).toBe("proj-1");
    expect(data.project.title).toBe("New Project");
  });

  it("should create a project with all fields", async () => {
    const mockProject = {
      id: "proj-2",
      title: "Full Project",
      clientName: "Jane",
      clientEmail: "jane@example.com",
      description: "Full description",
      status: "IN_PROGRESS",
      budget: 50000,
      deadline: new Date("2026-12-31"),
    };
    (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

    const req = createPostRequest({
      title: "Full Project",
      clientName: "Jane",
      clientEmail: "jane@example.com",
      description: "Full description",
      status: "IN_PROGRESS",
      budget: "50000",
      deadline: "2026-12-31",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.project.id).toBe("proj-2");
  });

  it("should return 400 for missing title", async () => {
    const req = createPostRequest({
      clientName: "John",
      clientEmail: "john@example.com",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Title is required");
  });

  it("should return 400 for missing clientName", async () => {
    const req = createPostRequest({
      title: "Test",
      clientEmail: "john@example.com",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Client name is required");
  });

  it("should return 400 for missing clientEmail", async () => {
    const req = createPostRequest({
      title: "Test",
      clientName: "John",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Client email is required");
  });

  it("should return 400 for invalid email format", async () => {
    const req = createPostRequest({
      title: "Test",
      clientName: "John",
      clientEmail: "not-an-email",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid email format");
  });

  it("should return 400 for invalid status", async () => {
    const req = createPostRequest({
      title: "Test",
      clientName: "John",
      clientEmail: "john@example.com",
      status: "BAD_STATUS",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("should return 400 for negative budget", async () => {
    const req = createPostRequest({
      title: "Test",
      clientName: "John",
      clientEmail: "john@example.com",
      budget: "-100",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Budget must be a positive number");
  });

  it("should return 400 for invalid deadline format", async () => {
    const req = createPostRequest({
      title: "Test",
      clientName: "John",
      clientEmail: "john@example.com",
      deadline: "not-a-date",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid deadline format");
  });

  it("should return 500 on database error", async () => {
    (prisma.project.create as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createPostRequest({
      title: "Test",
      clientName: "John",
      clientEmail: "john@example.com",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create project");
  });

  it("should trim whitespace from title and email", async () => {
    (prisma.project.create as jest.Mock).mockResolvedValue({ id: "proj-3" });

    const req = createPostRequest({
      title: "  My Project  ",
      clientName: "  John  ",
      clientEmail: "JOHN@EXAMPLE.COM",
    });
    await POST(req);

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "My Project",
        clientName: "John",
        clientEmail: "john@example.com",
      }),
    });
  });
});
