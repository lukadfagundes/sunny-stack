import { fetchGitHubData } from "@/lib/github";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Suppress console.warn/error in tests
beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockFetch.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const MOCK_API_RESPONSE = {
  data: {
    user: {
      avatarUrl: "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
      pinnedItems: {
        nodes: [
          {
            name: "test-repo",
            description: "A test repo",
            url: "https://github.com/test/test-repo",
            stargazerCount: 10,
            forkCount: 2,
            primaryLanguage: { name: "TypeScript", color: "#3178c6" },
          },
        ],
      },
      repositories: {
        totalCount: 5,
        nodes: [
          {
            name: "repo1",
            url: "https://github.com/test/repo1",
            description: "First repo",
            pushedAt: "2026-01-01T00:00:00Z",
            stargazerCount: 15,
            forkCount: 3,
            primaryLanguage: { name: "TypeScript", color: "#3178c6" },
            languages: {
              edges: [
                { size: 1000, node: { name: "TypeScript", color: "#3178c6" } },
              ],
            },
          },
          {
            name: "repo2",
            url: "https://github.com/test/repo2",
            description: "Second repo",
            pushedAt: "2026-02-01T00:00:00Z",
            stargazerCount: 5,
            forkCount: 0,
            primaryLanguage: { name: "JavaScript", color: "#f1e05a" },
            languages: {
              edges: [
                { size: 500, node: { name: "JavaScript", color: "#f1e05a" } },
              ],
            },
          },
        ],
      },
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 365,
          weeks: [
            {
              contributionDays: [
                { contributionCount: 5, date: "2026-01-01", color: "#216e39" },
              ],
            },
          ],
        },
        totalCommitContributions: 200,
        totalPullRequestContributions: 30,
        totalIssueContributions: 10,
        totalRepositoryContributions: 5,
      },
      pullRequests: {
        totalCount: 35,
        nodes: [
          {
            title: "Public PR",
            url: "https://github.com/test/repo1/pull/1",
            mergedAt: "2026-01-15T00:00:00Z",
            repository: { name: "repo1", isPrivate: false },
          },
          {
            title: "Private PR",
            url: "https://github.com/test/private-repo/pull/1",
            mergedAt: "2026-01-10T00:00:00Z",
            repository: { name: "private-repo", isPrivate: true },
          },
        ],
      },
    },
  },
};

describe("fetchGitHubData", () => {
  it("returns fallback data when GITHUB_TOKEN is not set", async () => {
    delete process.env.GITHUB_TOKEN;
    const data = await fetchGitHubData();
    expect(data.avatarUrl).toBe("");
    expect(data.totalCommits).toBe(0);
    expect(data.pinnedRepos).toEqual([]);
    expect(data.publicRepos).toEqual([]);
  });

  it("fetches and parses data correctly when token is set", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    });

    const data = await fetchGitHubData();

    expect(data.avatarUrl).toBe(
      "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
    );
    expect(data.pinnedRepos).toHaveLength(1);
    expect(data.pinnedRepos[0].name).toBe("test-repo");
    expect(data.publicRepos).toHaveLength(2);
    expect(data.totalPublicRepos).toBe(5);
    expect(data.totalStars).toBe(20); // 15 + 5
    expect(data.totalCommits).toBe(200);
    expect(data.totalPRs).toBe(30);
    expect(data.totalIssues).toBe(10);
    expect(data.totalReposCreated).toBe(5);
    expect(data.contributionCalendar.totalContributions).toBe(365);
  });

  it("filters out PRs from private repos", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    });

    const data = await fetchGitHubData();
    expect(data.mergedPRs).toHaveLength(1);
    expect(data.mergedPRs[0].title).toBe("Public PR");
    // totalMergedPRs includes all (public + private)
    expect(data.totalMergedPRs).toBe(35);
  });

  it("returns fallback data on API error (non-ok response)", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const data = await fetchGitHubData();
    expect(data.totalCommits).toBe(0);
    expect(data.pinnedRepos).toEqual([]);
  });

  it("returns fallback data on GraphQL errors", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        errors: [{ message: "Something went wrong" }],
      }),
    });

    const data = await fetchGitHubData();
    expect(data.totalCommits).toBe(0);
  });

  it("returns fallback data on network error", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const data = await fetchGitHubData();
    expect(data.totalCommits).toBe(0);
  });

  it("sends correct authorization header", async () => {
    process.env.GITHUB_TOKEN = "my-secret-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    });

    await fetchGitHubData();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "bearer my-secret-token",
        }),
      }),
    );
  });

  it("aggregates star counts across repos", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    });

    const data = await fetchGitHubData();
    // repo1 has 15 stars, repo2 has 5 stars
    expect(data.totalStars).toBe(20);
  });
});
