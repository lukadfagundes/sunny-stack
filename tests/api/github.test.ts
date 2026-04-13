export {};

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status ?? 200,
    }),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const originalToken = process.env.GITHUB_TOKEN;

afterAll(() => {
  if (originalToken !== undefined) {
    process.env.GITHUB_TOKEN = originalToken;
  } else {
    delete process.env.GITHUB_TOKEN;
  }
});

beforeEach(() => {
  jest.resetModules();
  mockFetch.mockReset();
});

describe("GET /api/github", () => {
  it("returns null when GITHUB_TOKEN is not set", async () => {
    delete process.env.GITHUB_TOKEN;
    const { GET } = await import("@/app/api/github/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toBeNull();
  });

  it("fetches profile data from GitHub GraphQL API", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            avatarUrl:
              "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
            name: "Luka Fagundes",
            bio: "Software developer",
            location: "San Francisco, CA",
            repositories: {
              nodes: [{ pushedAt: "2026-03-20T10:00:00Z" }],
            },
          },
        },
      }),
    });

    const { GET } = await import("@/app/api/github/route");
    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({
      avatarUrl: "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
      name: "Luka Fagundes",
      bio: "Software developer",
      location: "San Francisco, CA",
      lastPushedAt: "2026-03-20T10:00:00Z",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "bearer test-token",
        }),
      }),
    );
  });

  it("returns null on non-ok response", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { GET } = await import("@/app/api/github/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toBeNull();
  });

  it("returns null on GraphQL errors", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        errors: [{ message: "Bad query" }],
      }),
    });

    const { GET } = await import("@/app/api/github/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toBeNull();
  });

  it("returns null on network error", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/github/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toBeNull();
  });

  it("handles null fields gracefully", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            avatarUrl:
              "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
            name: null,
            bio: null,
            location: null,
            repositories: { nodes: [] },
          },
        },
      }),
    });

    const { GET } = await import("@/app/api/github/route");
    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({
      avatarUrl: "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
      name: null,
      bio: null,
      location: null,
      lastPushedAt: null,
    });
  });
});
