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

// Save original env values
const originalEnv = { ...process.env };

afterAll(() => {
  process.env = originalEnv;
});

beforeEach(() => {
  jest.resetModules();
  mockFetch.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Clear all relevant env vars
  delete process.env.GITHUB_TOKEN;
  delete process.env.BLUESKY_HANDLE;
  delete process.env.INSTAGRAM_ACCESS_TOKEN;
  delete process.env.YOUTUBE_API_KEY;
  delete process.env.YOUTUBE_CHANNEL_ID;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /api/activity", () => {
  it("returns offline with null lastActivityAt when no env vars are set", async () => {
    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual({ lastActivityAt: null, isOnline: false });
  });

  it("returns most recent activity across platforms", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.BLUESKY_HANDLE = "test.bsky.social";

    const now = new Date();
    const githubDate = new Date(
      now.getTime() - 2 * 60 * 60 * 1000,
    ).toISOString(); // 2 hours ago
    const blueskyDate = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 30 min ago (most recent)

    mockFetch
      // GitHub GraphQL
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              repositories: {
                nodes: [{ pushedAt: githubDate }],
              },
            },
          },
        }),
      })
      // Bluesky
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          feed: [
            {
              post: {
                record: { createdAt: blueskyDate },
              },
            },
          ],
        }),
      });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data.lastActivityAt).toBe(blueskyDate);
    expect(data.isOnline).toBe(true);
  });

  it("returns isOnline=true when activity is within 1 hour", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    const recentDate = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            repositories: {
              nodes: [{ pushedAt: recentDate }],
            },
          },
        },
      }),
    });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data.isOnline).toBe(true);
    expect(data.lastActivityAt).toBe(recentDate);
  });

  it("returns isOnline=false when activity is older than 1 hour", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    const oldDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            repositories: {
              nodes: [{ pushedAt: oldDate }],
            },
          },
        },
      }),
    });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data.isOnline).toBe(false);
    expect(data.lastActivityAt).toBe(oldDate);
  });

  it("handles GitHub API error gracefully", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({ lastActivityAt: null, isOnline: false });
  });

  it("handles Bluesky API error gracefully", async () => {
    process.env.BLUESKY_HANDLE = "test.bsky.social";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({ lastActivityAt: null, isOnline: false });
  });

  it("handles Instagram API error gracefully", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({ lastActivityAt: null, isOnline: false });
  });

  it("handles YouTube with all required env vars", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "test-channel";

    const recentDate = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago

    mockFetch
      // YouTube channels API
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              contentDetails: {
                relatedPlaylists: { uploads: "UU123" },
              },
            },
          ],
        }),
      })
      // YouTube playlistItems API
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              snippet: { publishedAt: recentDate },
            },
          ],
        }),
      });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data.lastActivityAt).toBe(recentDate);
    expect(data.isOnline).toBe(true);
  });

  it("handles network errors gracefully", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({ lastActivityAt: null, isOnline: false });
  });

  it("returns the most recent of all platforms", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.BLUESKY_HANDLE = "test.bsky.social";
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "test-channel";

    const now = Date.now();
    const githubDate = new Date(now - 4 * 60 * 60 * 1000).toISOString();
    const blueskyDate = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const instagramDate = new Date(now - 5 * 60 * 1000).toISOString(); // most recent
    const youtubeDate = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    mockFetch
      // GitHub
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              repositories: { nodes: [{ pushedAt: githubDate }] },
            },
          },
        }),
      })
      // Bluesky
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          feed: [{ post: { record: { createdAt: blueskyDate } } }],
        }),
      })
      // Instagram
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ timestamp: instagramDate }],
        }),
      })
      // YouTube channels
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              contentDetails: {
                relatedPlaylists: { uploads: "UU123" },
              },
            },
          ],
        }),
      })
      // YouTube playlistItems
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ snippet: { publishedAt: youtubeDate } }],
        }),
      });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    expect(data.lastActivityAt).toBe(instagramDate);
    expect(data.isOnline).toBe(true);
  });

  it("ignores platforms with missing env vars", async () => {
    // Only GitHub has env var set
    process.env.GITHUB_TOKEN = "test-token";

    const githubDate = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: {
            repositories: { nodes: [{ pushedAt: githubDate }] },
          },
        },
      }),
    });

    const { GET } = await import("@/app/api/activity/route");
    const res = await GET();
    const data = await res.json();

    // Should only use GitHub's timestamp
    expect(data.lastActivityAt).toBe(githubDate);
    expect(data.isOnline).toBe(true);
    // Only 1 fetch call (GitHub) — other platforms skipped
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
