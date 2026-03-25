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

const originalHandle = process.env.BLUESKY_HANDLE;

afterAll(() => {
  if (originalHandle !== undefined) {
    process.env.BLUESKY_HANDLE = originalHandle;
  } else {
    delete process.env.BLUESKY_HANDLE;
  }
});

const mockFeedResponse = {
  feed: [
    {
      post: {
        uri: "at://did:plc:abc123/app.bsky.feed.post/3k4duaz5vfs2b",
        author: { handle: "strawhatluka.bsky.social" },
        record: {
          text: "Check out https://example.com #dev",
          createdAt: "2026-03-20T12:00:00.000Z",
          facets: [
            {
              index: { byteStart: 10, byteEnd: 29 },
              features: [
                { $type: "app.bsky.richtext.facet#link", uri: "https://example.com" },
              ],
            },
            {
              index: { byteStart: 30, byteEnd: 34 },
              features: [
                { $type: "app.bsky.richtext.facet#tag", tag: "dev" },
              ],
            },
          ],
        },
        embed: {
          $type: "app.bsky.embed.external#view",
          external: {
            uri: "https://example.com",
            title: "Example Site",
            description: "A great site",
            thumb: "https://cdn.bsky.app/img/thumb.jpg",
          },
        },
        likeCount: 15,
        replyCount: 3,
        repostCount: 7,
      },
    },
  ],
};

describe("GET /api/bluesky", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.resetModules();
    jest.mock("next/server", () => ({
      NextResponse: {
        json: (data: unknown, init?: { status?: number }) => ({
          json: async () => data,
          status: init?.status ?? 200,
        }),
      },
    }));
  });

  it("returns null when BLUESKY_HANDLE is not set", async () => {
    delete process.env.BLUESKY_HANDLE;

    const { GET } = await import("@/app/api/bluesky/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and transforms the latest Bluesky post", async () => {
    process.env.BLUESKY_HANDLE = "strawhatluka.bsky.social";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedResponse,
    });

    const { GET } = await import("@/app/api/bluesky/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.text).toBe("Check out https://example.com #dev");
    expect(data.likeCount).toBe(15);
    expect(data.replyCount).toBe(3);
    expect(data.repostCount).toBe(7);
    expect(data.permalink).toBe(
      "https://bsky.app/profile/strawhatluka.bsky.social/post/3k4duaz5vfs2b"
    );
    expect(data.createdAt).toBe("2026-03-20T12:00:00.000Z");
    // Facets
    expect(data.facets).toHaveLength(2);
    expect(data.facets[0].features[0].$type).toBe("app.bsky.richtext.facet#link");
    expect(data.facets[1].features[0].tag).toBe("dev");
    // Embed
    expect(data.embed).not.toBeNull();
    expect(data.embed.type).toBe("external");
    expect(data.embed.external.title).toBe("Example Site");
    expect(data.embed.external.thumb).toBe("https://cdn.bsky.app/img/thumb.jpg");
  });

  it("returns null when feed is empty", async () => {
    process.env.BLUESKY_HANDLE = "strawhatluka.bsky.social";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feed: [] }),
    });

    const { GET } = await import("@/app/api/bluesky/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
  });

  it("returns null on API error", async () => {
    process.env.BLUESKY_HANDLE = "strawhatluka.bsky.social";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Not Found",
    });

    const { GET } = await import("@/app/api/bluesky/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns null on network error", async () => {
    process.env.BLUESKY_HANDLE = "strawhatluka.bsky.social";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/bluesky/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("defaults missing counts to 0", async () => {
    process.env.BLUESKY_HANDLE = "strawhatluka.bsky.social";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feed: [
          {
            post: {
              uri: "at://did:plc:abc123/app.bsky.feed.post/xyz",
              author: { handle: "strawhatluka.bsky.social" },
              record: { text: "No stats", createdAt: "2026-03-20T12:00:00.000Z" },
            },
          },
        ],
      }),
    });

    const { GET } = await import("@/app/api/bluesky/route");
    const response = await GET();
    const data = await response.json();

    expect(data.likeCount).toBe(0);
    expect(data.replyCount).toBe(0);
    expect(data.repostCount).toBe(0);
    expect(data.facets).toEqual([]);
    expect(data.embed).toBeNull();
  });
});
