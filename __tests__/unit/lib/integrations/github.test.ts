/**
 * @jest-environment node
 */
/**
 * @file GitHub API Integration Unit Tests
 * @description Tests for GitHub API client: authentication, repositories,
 * workflow runs, pull requests, deployments, and status summary.
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
  process.env.GITHUB_API_TOKEN = "test-gh-token";
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

const sampleRateLimit = {
  rate: {
    limit: 5000,
    remaining: 4999,
    reset: Math.floor(Date.now() / 1000) + 3600,
  },
};
const sampleUser = { login: "testuser", id: 123 };

const sampleRepos = [
  {
    id: 1,
    full_name: "user/repo-1",
    private: false,
    html_url: "https://github.com/user/repo-1",
    description: "Repo 1",
    updated_at: "2024-06-01T00:00:00Z",
    pushed_at: "2024-06-01T00:00:00Z",
    open_issues_count: 2,
    default_branch: "main",
  },
  {
    id: 2,
    full_name: "user/repo-2",
    private: true,
    html_url: "https://github.com/user/repo-2",
    description: "Repo 2",
    updated_at: "2024-05-01T00:00:00Z",
    pushed_at: "2024-05-01T00:00:00Z",
    open_issues_count: 0,
    default_branch: "main",
  },
];

const recentIso = new Date(Date.now() - 1000).toISOString();
const oldIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

const sampleWorkflowRuns = [
  {
    id: 10,
    name: "CI",
    status: "completed",
    conclusion: "success",
    html_url: "https://github.com/user/repo-1/actions/runs/10",
    created_at: recentIso,
    updated_at: recentIso,
    repository: { full_name: "user/repo-1" },
    head_branch: "main",
    event: "push",
  },
  {
    id: 11,
    name: "Deploy",
    status: "completed",
    conclusion: "failure",
    html_url: "https://github.com/user/repo-1/actions/runs/11",
    created_at: recentIso,
    updated_at: recentIso,
    repository: { full_name: "user/repo-1" },
    head_branch: "feat",
    event: "push",
  },
  {
    id: 12,
    name: "Old Fail",
    status: "completed",
    conclusion: "failure",
    html_url: "https://github.com/user/repo-2/actions/runs/12",
    created_at: oldIso,
    updated_at: oldIso,
    repository: { full_name: "user/repo-2" },
    head_branch: "main",
    event: "push",
  },
];

const samplePRs = [
  {
    id: 100,
    number: 5,
    title: "Fix bug",
    state: "open",
    html_url: "https://github.com/user/repo-1/pull/5",
    created_at: recentIso,
    updated_at: recentIso,
    user: { login: "testuser" },
    head: { ref: "fix-bug" },
    base: { ref: "main" },
    draft: false,
  },
];

describe("GitHub Integration", () => {
  describe("githubRequest (via exported functions)", () => {
    it("should throw when GITHUB_API_TOKEN is not set", async () => {
      delete process.env.GITHUB_API_TOKEN;
      const { getGitHubHealth } = await import("@/lib/integrations/github");
      await expect(getGitHubHealth()).rejects.toThrow(
        "GITHUB_API_TOKEN not configured",
      );
    });

    it("should call fetch with correct auth and GitHub-specific headers", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleRateLimit))
        .mockResolvedValueOnce(mockJsonResponse(sampleUser));
      const { getGitHubHealth } = await import("@/lib/integrations/github");
      await getGitHubHealth();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-gh-token",
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          }),
        }),
      );
    });

    it("should throw on non-ok HTTP response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockErrorResponse(401, "Unauthorized"),
      );
      const { getRepositories } = await import("@/lib/integrations/github");
      await expect(getRepositories()).rejects.toThrow(
        "GitHub API error: 401 Unauthorized",
      );
    });
  });

  describe("getGitHubHealth", () => {
    it("should return authenticated status, rate limit, and user info", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleRateLimit))
        .mockResolvedValueOnce(mockJsonResponse(sampleUser));
      const { getGitHubHealth } = await import("@/lib/integrations/github");
      const result = await getGitHubHealth();
      expect(result.authenticated).toBe(true);
      expect(result.rateLimit.limit).toBe(5000);
      expect(result.rateLimit.remaining).toBe(4999);
      expect(result.rateLimit.reset).toBeInstanceOf(Date);
      expect(result.user).toEqual({ login: "testuser", id: 123 });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Health error"));
      const { getGitHubHealth } = await import("@/lib/integrations/github");
      const logger = (await import("@/lib/logger")).default;
      await expect(getGitHubHealth()).rejects.toThrow("Health error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get GitHub health:",
        expect.any(Error),
      );
    });
  });

  describe("getRepositories", () => {
    it("should return repositories array", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(sampleRepos),
      );
      const { getRepositories } = await import("@/lib/integrations/github");
      expect(await getRepositories()).toEqual(sampleRepos);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Repos error"));
      const { getRepositories } = await import("@/lib/integrations/github");
      await expect(getRepositories()).rejects.toThrow("Repos error");
    });
  });

  describe("getRecentWorkflowRuns", () => {
    it("should fetch repos then workflow runs per repo, flatten, sort, and limit", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleRepos))
        .mockResolvedValueOnce(
          mockJsonResponse({
            workflow_runs: [sampleWorkflowRuns[0], sampleWorkflowRuns[1]],
          }),
        )
        .mockResolvedValueOnce(
          mockJsonResponse({ workflow_runs: [sampleWorkflowRuns[2]] }),
        );

      const { getRecentWorkflowRuns } =
        await import("@/lib/integrations/github");
      const result = await getRecentWorkflowRuns(2);
      expect(result).toHaveLength(2);
      // Should be sorted by created_at desc
      expect(new Date(result[0].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(result[1].created_at).getTime(),
      );
    });

    it("should handle workflow fetch failure for individual repos gracefully", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleRepos))
        .mockResolvedValueOnce(mockErrorResponse(500, "Internal Server Error"))
        .mockResolvedValueOnce(
          mockJsonResponse({ workflow_runs: [sampleWorkflowRuns[2]] }),
        );

      const { getRecentWorkflowRuns } =
        await import("@/lib/integrations/github");
      const result = await getRecentWorkflowRuns(20);
      expect(result).toHaveLength(1);
    });

    it("should pass status filter when provided", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse([sampleRepos[0]]))
        .mockResolvedValueOnce(mockJsonResponse({ workflow_runs: [] }));

      const { getRecentWorkflowRuns } =
        await import("@/lib/integrations/github");
      await getRecentWorkflowRuns(20, "completed");
      const workflowUrl = (global.fetch as jest.Mock).mock
        .calls[1][0] as string;
      expect(workflowUrl).toContain("status=completed");
    });

    it("should not include status parameter when not provided", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse([sampleRepos[0]]))
        .mockResolvedValueOnce(mockJsonResponse({ workflow_runs: [] }));

      const { getRecentWorkflowRuns } =
        await import("@/lib/integrations/github");
      await getRecentWorkflowRuns(20);
      const workflowUrl = (global.fetch as jest.Mock).mock
        .calls[1][0] as string;
      expect(workflowUrl).not.toContain("status=");
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Workflows error"),
      );
      const { getRecentWorkflowRuns } =
        await import("@/lib/integrations/github");
      await expect(getRecentWorkflowRuns()).rejects.toThrow("Workflows error");
    });
  });

  describe("getFailedWorkflows", () => {
    it("should return only failed workflows from last 24 hours", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse(sampleRepos))
        .mockResolvedValueOnce(
          mockJsonResponse({ workflow_runs: [sampleWorkflowRuns[1]] }),
        )
        .mockResolvedValueOnce(
          mockJsonResponse({ workflow_runs: [sampleWorkflowRuns[2]] }),
        );

      const { getFailedWorkflows } = await import("@/lib/integrations/github");
      const result = await getFailedWorkflows();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(11);
    });

    it("should return empty array when no failures", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse([sampleRepos[0]]))
        .mockResolvedValueOnce(
          mockJsonResponse({ workflow_runs: [sampleWorkflowRuns[0]] }),
        );

      const { getFailedWorkflows } = await import("@/lib/integrations/github");
      expect(await getFailedWorkflows()).toEqual([]);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Failed workflows error"),
      );
      const { getFailedWorkflows } = await import("@/lib/integrations/github");
      await expect(getFailedWorkflows()).rejects.toThrow(
        "Failed workflows error",
      );
    });
  });

  describe("getOpenPullRequests", () => {
    it("should return open pull requests", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ items: samplePRs }),
      );
      const { getOpenPullRequests } = await import("@/lib/integrations/github");
      const result = await getOpenPullRequests(10);
      expect(result).toEqual(samplePRs);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("per_page=10"),
        expect.any(Object),
      );
    });

    it("should use default limit of 20", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ items: [] }),
      );
      const { getOpenPullRequests } = await import("@/lib/integrations/github");
      await getOpenPullRequests();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("per_page=20"),
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("PRs error"));
      const { getOpenPullRequests } = await import("@/lib/integrations/github");
      await expect(getOpenPullRequests()).rejects.toThrow("PRs error");
    });
  });

  describe("getRepositoryPullRequests", () => {
    it("should return pull requests for a specific repo", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(samplePRs),
      );
      const { getRepositoryPullRequests } =
        await import("@/lib/integrations/github");
      const result = await getRepositoryPullRequests("user", "repo-1", "open");
      expect(result).toEqual(samplePRs);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo-1/pulls?state=open&per_page=20",
        expect.any(Object),
      );
    });

    it("should default state to open", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse([]));
      const { getRepositoryPullRequests } =
        await import("@/lib/integrations/github");
      await getRepositoryPullRequests("user", "repo-1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("state=open"),
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Repo PRs error"),
      );
      const { getRepositoryPullRequests } =
        await import("@/lib/integrations/github");
      await expect(getRepositoryPullRequests("user", "repo-1")).rejects.toThrow(
        "Repo PRs error",
      );
    });
  });

  describe("getRepositoryDeployments", () => {
    it("should return deployments for a repository", async () => {
      const deployments = [
        {
          id: 1,
          sha: "abc",
          ref: "main",
          environment: "production",
          created_at: recentIso,
          updated_at: recentIso,
          statuses_url: "https://api.github.com/...",
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(deployments),
      );
      const { getRepositoryDeployments } =
        await import("@/lib/integrations/github");
      const result = await getRepositoryDeployments("user", "repo-1", 5);
      expect(result).toEqual(deployments);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo-1/deployments?per_page=5",
        expect.any(Object),
      );
    });

    it("should use default limit of 10", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse([]));
      const { getRepositoryDeployments } =
        await import("@/lib/integrations/github");
      await getRepositoryDeployments("user", "repo-1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("per_page=10"),
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Deployments error"),
      );
      const { getRepositoryDeployments } =
        await import("@/lib/integrations/github");
      await expect(getRepositoryDeployments("user", "repo-1")).rejects.toThrow(
        "Deployments error",
      );
    });
  });

  describe("getDeploymentStatus", () => {
    it("should return deployment statuses", async () => {
      const statuses = [
        {
          state: "success",
          description: "Deployed",
          environment: "production",
          created_at: recentIso,
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(statuses));
      const { getDeploymentStatus } = await import("@/lib/integrations/github");
      const result = await getDeploymentStatus("user", "repo-1", 42);
      expect(result).toEqual(statuses);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo-1/deployments/42/statuses",
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Status error"));
      const { getDeploymentStatus } = await import("@/lib/integrations/github");
      await expect(getDeploymentStatus("user", "repo-1", 42)).rejects.toThrow(
        "Status error",
      );
    });
  });

  describe("getWorkflowRun", () => {
    it("should return a specific workflow run", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse(sampleWorkflowRuns[0]),
      );
      const { getWorkflowRun } = await import("@/lib/integrations/github");
      const result = await getWorkflowRun("user", "repo-1", 10);
      expect(result).toEqual(sampleWorkflowRuns[0]);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo-1/actions/runs/10",
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Run error"));
      const { getWorkflowRun } = await import("@/lib/integrations/github");
      await expect(getWorkflowRun("user", "repo-1", 10)).rejects.toThrow(
        "Run error",
      );
    });
  });

  describe("getGitHubStatusSummary", () => {
    it("should aggregate data from all endpoints", async () => {
      // Use URL-based routing instead of sequential mocks since Promise.all is non-deterministic
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/rate_limit"))
          return Promise.resolve(mockJsonResponse(sampleRateLimit));
        if (url.includes("/user/repos"))
          return Promise.resolve(mockJsonResponse(sampleRepos));
        if (url.includes("/user") && !url.includes("/repos"))
          return Promise.resolve(mockJsonResponse(sampleUser));
        if (url.includes("/actions/runs"))
          return Promise.resolve(
            mockJsonResponse({ workflow_runs: [sampleWorkflowRuns[0]] }),
          );
        if (url.includes("/search/issues"))
          return Promise.resolve(
            mockJsonResponse({ items: samplePRs, total_count: 1 }),
          );
        return Promise.resolve(mockJsonResponse({}));
      });

      const { getGitHubStatusSummary } =
        await import("@/lib/integrations/github");
      const result = await getGitHubStatusSummary();

      expect(result.health.authenticated).toBe(true);
      expect(result.health.user).toBe("testuser");
      expect(result.health.rateLimit.remaining).toBe(4999);
      expect(result.repositories.total).toBe(2);
      expect(result.repositories.recentlyUpdated).toHaveLength(2);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Summary error"));
      const { getGitHubStatusSummary } =
        await import("@/lib/integrations/github");
      const logger = (await import("@/lib/logger")).default;
      await expect(getGitHubStatusSummary()).rejects.toThrow("Summary error");
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
