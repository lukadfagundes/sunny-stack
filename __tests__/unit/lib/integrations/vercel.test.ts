/**
 * @jest-environment node
 */
/**
 * @file Vercel API Integration Unit Tests
 * @description Tests for Vercel API client: authentication, projects, deployments,
 * domains, failed deployment filtering, and status summary aggregation.
 */

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.VERCEL_API_TOKEN = "test-vercel-token";
  (global.fetch as jest.Mock) = jest.fn();
});

afterAll(() => {
  process.env = originalEnv;
});

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    json: jest.fn().mockResolvedValue(data),
  };
}

function mockErrorResponse(status = 403, statusText = "Forbidden") {
  return {
    ok: false,
    status,
    statusText,
    text: jest.fn().mockResolvedValue("Forbidden"),
    json: jest.fn(),
  };
}

const sampleUser = {
  user: { username: "testuser", email: "test@example.com", uid: "uid-1" },
};

const sampleProjects = [
  {
    id: "p1",
    name: "project-1",
    accountId: "acc-1",
    createdAt: Date.now(),
    framework: "nextjs",
    link: { type: "github", repo: "user/repo-1", repoId: 1 },
  },
  {
    id: "p2",
    name: "project-2",
    accountId: "acc-1",
    createdAt: Date.now(),
    framework: "remix",
    link: { type: "github", repo: "user/repo-2", repoId: 2 },
  },
];

const now = Date.now();
const sampleDeployments = [
  {
    uid: "d1",
    name: "project-1",
    url: "p1.vercel.app",
    state: "READY",
    type: "LAMBDAS",
    created: now - 1000,
    target: "production",
    meta: { githubCommitMessage: "fix: bug", githubCommitAuthorName: "Dev" },
  },
  {
    uid: "d2",
    name: "project-1",
    url: "p1-preview.vercel.app",
    state: "ERROR",
    type: "LAMBDAS",
    created: now - 2000,
    target: "preview",
    meta: {
      githubCommitMessage: "feat: broken",
      githubCommitAuthorName: "Dev",
    },
  },
  {
    uid: "d3",
    name: "project-2",
    url: "p2.vercel.app",
    state: "READY",
    type: "LAMBDAS",
    created: now - 3000,
    target: "production",
    meta: {},
  },
];

const sampleDomains = [
  { name: "example.com", verified: true, created: now, expiresAt: null },
  {
    name: "staging.example.com",
    verified: false,
    created: now,
    expiresAt: null,
  },
];

describe("Vercel Integration", () => {
  describe("vercelRequest (via exported functions)", () => {
    it("should throw when VERCEL_API_TOKEN is not set", async () => {
      delete process.env.VERCEL_API_TOKEN;
      const { getVercelHealth } = await import("@/lib/integrations/vercel");
      await expect(getVercelHealth()).rejects.toThrow(
        "VERCEL_API_TOKEN not configured",
      );
    });

    it("should call fetch with correct Bearer auth header", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(sampleUser),
      );
      const { getVercelHealth } = await import("@/lib/integrations/vercel");
      await getVercelHealth();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.vercel.com/v2/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-vercel-token",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should throw on non-ok HTTP response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockErrorResponse(401, "Unauthorized"),
      );
      const { getVercelHealth } = await import("@/lib/integrations/vercel");
      await expect(getVercelHealth()).rejects.toThrow(
        "Vercel API error: 401 Unauthorized",
      );
    });
  });

  describe("getVercelHealth", () => {
    it("should return authenticated status and user info", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(sampleUser),
      );
      const { getVercelHealth } = await import("@/lib/integrations/vercel");
      const result = await getVercelHealth();
      expect(result).toEqual({
        authenticated: true,
        user: { username: "testuser", email: "test@example.com", uid: "uid-1" },
      });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      const { getVercelHealth } = await import("@/lib/integrations/vercel");
      const logger = (await import("@/lib/logger")).default;
      await expect(getVercelHealth()).rejects.toThrow("Network error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get Vercel health:",
        expect.any(Error),
      );
    });
  });

  describe("getProjects", () => {
    it("should return projects array", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ projects: sampleProjects }),
      );
      const { getProjects } = await import("@/lib/integrations/vercel");
      expect(await getProjects()).toEqual(sampleProjects);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.vercel.com/v9/projects",
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Projects error"),
      );
      const { getProjects } = await import("@/lib/integrations/vercel");
      await expect(getProjects()).rejects.toThrow("Projects error");
    });
  });

  describe("getProjectDeployments", () => {
    it("should return deployments for a specific project", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ deployments: sampleDeployments }),
      );
      const { getProjectDeployments } =
        await import("@/lib/integrations/vercel");
      const result = await getProjectDeployments("p1", 5);
      expect(result).toEqual(sampleDeployments);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.vercel.com/v6/deployments?projectId=p1&limit=5",
        expect.any(Object),
      );
    });

    it("should use default limit of 10", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ deployments: [] }),
      );
      const { getProjectDeployments } =
        await import("@/lib/integrations/vercel");
      await getProjectDeployments("p1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Deployments error"),
      );
      const { getProjectDeployments } =
        await import("@/lib/integrations/vercel");
      await expect(getProjectDeployments("p1")).rejects.toThrow(
        "Deployments error",
      );
    });
  });

  describe("getRecentDeployments", () => {
    it("should return recent deployments across all projects", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ deployments: sampleDeployments }),
      );
      const { getRecentDeployments } =
        await import("@/lib/integrations/vercel");
      const result = await getRecentDeployments(5);
      expect(result).toEqual(sampleDeployments);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.vercel.com/v6/deployments?limit=5",
        expect.any(Object),
      );
    });

    it("should use default limit of 20", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ deployments: [] }),
      );
      const { getRecentDeployments } =
        await import("@/lib/integrations/vercel");
      await getRecentDeployments();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=20"),
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Recent error"));
      const { getRecentDeployments } =
        await import("@/lib/integrations/vercel");
      await expect(getRecentDeployments()).rejects.toThrow("Recent error");
    });
  });

  describe("getFailedDeployments", () => {
    it("should return only ERROR deployments from last 24 hours", async () => {
      const recentError = {
        uid: "e1",
        name: "p1",
        url: "err.vercel.app",
        state: "ERROR",
        type: "LAMBDAS",
        created: Date.now() - 1000,
        target: "preview",
        meta: {},
      };
      const oldError = {
        uid: "e2",
        name: "p1",
        url: "old.vercel.app",
        state: "ERROR",
        type: "LAMBDAS",
        created: Date.now() - 48 * 60 * 60 * 1000,
        target: "preview",
        meta: {},
      };
      const recentReady = {
        uid: "r1",
        name: "p1",
        url: "ok.vercel.app",
        state: "READY",
        type: "LAMBDAS",
        created: Date.now() - 1000,
        target: "production",
        meta: {},
      };
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ deployments: [recentError, oldError, recentReady] }),
      );
      const { getFailedDeployments } =
        await import("@/lib/integrations/vercel");
      const result = await getFailedDeployments();
      expect(result).toHaveLength(1);
      expect(result[0].uid).toBe("e1");
    });

    it("should return empty array when no failures exist", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({
          deployments: [
            {
              uid: "r1",
              name: "p1",
              url: "ok.vercel.app",
              state: "READY",
              type: "LAMBDAS",
              created: Date.now(),
              target: "production",
              meta: {},
            },
          ],
        }),
      );
      const { getFailedDeployments } =
        await import("@/lib/integrations/vercel");
      expect(await getFailedDeployments()).toEqual([]);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed error"));
      const { getFailedDeployments } =
        await import("@/lib/integrations/vercel");
      await expect(getFailedDeployments()).rejects.toThrow("Failed error");
    });
  });

  describe("getDomains", () => {
    it("should return domains array", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ domains: sampleDomains }),
      );
      const { getDomains } = await import("@/lib/integrations/vercel");
      expect(await getDomains()).toEqual(sampleDomains);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Domains error"));
      const { getDomains } = await import("@/lib/integrations/vercel");
      await expect(getDomains()).rejects.toThrow("Domains error");
    });
  });

  describe("getDeployment", () => {
    it("should return a single deployment by ID", async () => {
      const deployment = sampleDeployments[0];
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(deployment),
      );
      const { getDeployment } = await import("@/lib/integrations/vercel");
      const result = await getDeployment("d1");
      expect(result).toEqual(deployment);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.vercel.com/v13/deployments/d1",
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Deployment error"),
      );
      const { getDeployment } = await import("@/lib/integrations/vercel");
      await expect(getDeployment("d1")).rejects.toThrow("Deployment error");
    });
  });

  describe("getVercelStatusSummary", () => {
    it("should aggregate data from all endpoints", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleUser))
        .mockResolvedValueOnce(mockJsonResponse({ projects: sampleProjects }))
        .mockResolvedValueOnce(
          mockJsonResponse({ deployments: sampleDeployments }),
        )
        .mockResolvedValueOnce(
          mockJsonResponse({ deployments: sampleDeployments }),
        )
        .mockResolvedValueOnce(mockJsonResponse({ domains: sampleDomains }));

      const { getVercelStatusSummary } =
        await import("@/lib/integrations/vercel");
      const result = await getVercelStatusSummary();

      expect(result.health).toEqual({ authenticated: true, user: "testuser" });
      expect(result.projects.total).toBe(2);
      expect(result.projects.recentProjects).toHaveLength(2);
      expect(result.deployments.recent).toBe(3);
      expect(result.deployments.production).toBe(2);
      expect(result.domains.total).toBe(2);
      expect(result.domains.verified).toBe(1);
    });

    it("should include failed deployment details in summary", async () => {
      const errorDeployment = {
        uid: "e1",
        name: "p1",
        url: "err.vercel.app",
        state: "ERROR",
        type: "LAMBDAS",
        created: Date.now() - 1000,
        target: "preview",
        meta: { githubCommitMessage: "broken", githubCommitAuthorName: "Dev" },
      };
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleUser))
        .mockResolvedValueOnce(mockJsonResponse({ projects: sampleProjects }))
        .mockResolvedValueOnce(
          mockJsonResponse({ deployments: [errorDeployment] }),
        )
        .mockResolvedValueOnce(
          mockJsonResponse({ deployments: [errorDeployment] }),
        )
        .mockResolvedValueOnce(mockJsonResponse({ domains: sampleDomains }));

      const { getVercelStatusSummary } =
        await import("@/lib/integrations/vercel");
      const result = await getVercelStatusSummary();
      expect(result.deployments.failed).toBe(1);
      expect(result.deployments.failedList[0].commitMessage).toBe("broken");
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Summary error"));
      const { getVercelStatusSummary } =
        await import("@/lib/integrations/vercel");
      const logger = (await import("@/lib/logger")).default;
      await expect(getVercelStatusSummary()).rejects.toThrow("Summary error");
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
