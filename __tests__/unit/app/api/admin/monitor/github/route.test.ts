/**
 * @file GitHub Monitoring API Route Unit Tests
 * @description Tests for GET /api/admin/monitor/github
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

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("@/lib/middleware/auth", () => ({
  withBotAuth: jest.fn((handler: any) => handler),
}));

const mockGetGitHubStatusSummary = jest.fn();
const mockGetGitHubHealth = jest.fn();
jest.mock("@/lib/integrations/github", () => ({
  getGitHubStatusSummary: mockGetGitHubStatusSummary,
  getGitHubHealth: mockGetGitHubHealth,
}));

const routeModule = require("@/app/api/admin/monitor/github/route");
const GET = routeModule.GET;

describe("GET /api/admin/monitor/github", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return GitHub status summary", async () => {
    const mockSummary = {
      workflows: { total: 5, passing: 4, failing: 1 },
      pullRequests: { open: 3, merged: 10 },
      deployments: { latest: "production" },
    };
    mockGetGitHubStatusSummary.mockResolvedValue(mockSummary);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("success");
    expect(data.data).toEqual(mockSummary);
    expect(data.timestamp).toBeDefined();
  });

  it("should return 500 on GitHub API error", async () => {
    mockGetGitHubStatusSummary.mockRejectedValue(
      new Error("GitHub API rate limit"),
    );

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe("error");
    expect(data.error).toBe("GitHub API rate limit");
  });

  it("should return generic error message for non-Error exceptions", async () => {
    mockGetGitHubStatusSummary.mockRejectedValue("string error");

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch GitHub status");
  });
});
