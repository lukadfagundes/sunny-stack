export {};

// Mock next/server before importing the route
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

// Store original env
const originalApiKey = process.env.YOUTUBE_API_KEY;
const originalChannelId = process.env.YOUTUBE_CHANNEL_ID;

afterAll(() => {
  if (originalApiKey !== undefined) {
    process.env.YOUTUBE_API_KEY = originalApiKey;
  } else {
    delete process.env.YOUTUBE_API_KEY;
  }
  if (originalChannelId !== undefined) {
    process.env.YOUTUBE_CHANNEL_ID = originalChannelId;
  } else {
    delete process.env.YOUTUBE_CHANNEL_ID;
  }
});

const mockChannelResponse = {
  items: [
    {
      contentDetails: {
        relatedPlaylists: { uploads: "UU_test_playlist" },
      },
    },
  ],
};

const mockPlaylistResponse = {
  items: [
    {
      snippet: {
        resourceId: { videoId: "vid1" },
        title: "First Video",
        description: "Description of first video",
        thumbnails: { high: { url: "https://i.ytimg.com/vi/vid1/hqdefault.jpg" } },
        publishedAt: "2026-03-20T12:00:00Z",
      },
    },
    {
      snippet: {
        resourceId: { videoId: "vid2" },
        title: "Second Video",
        description: "Description of second video",
        thumbnails: { medium: { url: "https://i.ytimg.com/vi/vid2/mqdefault.jpg" } },
        publishedAt: "2026-03-19T12:00:00Z",
      },
    },
  ],
};

const mockStatsResponse = {
  items: [
    {
      id: "vid1",
      statistics: { viewCount: "1000", likeCount: "50", commentCount: "10" },
    },
    {
      id: "vid2",
      statistics: { viewCount: "500", likeCount: "25" },
    },
  ],
};

describe("GET /api/youtube", () => {
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

  it("returns empty array when YOUTUBE_API_KEY is not set", async () => {
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_CHANNEL_ID;

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array when YOUTUBE_CHANNEL_ID is not set", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    delete process.env.YOUTUBE_CHANNEL_ID;

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and transforms YouTube videos with statistics", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "UC_test";

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockChannelResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPlaylistResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStatsResponse });

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("vid1");
    expect(data[0].title).toBe("First Video");
    expect(data[0].description).toBe("Description of first video");
    expect(data[0].thumbnailUrl).toBe("https://i.ytimg.com/vi/vid1/hqdefault.jpg");
    expect(data[0].viewCount).toBe(1000);
    expect(data[0].likeCount).toBe(50);
    expect(data[0].commentCount).toBe(10);
    expect(data[1].id).toBe("vid2");
    expect(data[1].commentCount).toBe(0); // missing field defaults to 0
  });

  it("returns empty array when channel API fails", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "UC_test";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Forbidden",
    });

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("returns empty array when no uploads playlist found", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "UC_test";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("returns empty array on network error", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "UC_test";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("returns empty array when playlist API fails", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_CHANNEL_ID = "UC_test";

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockChannelResponse })
      .mockResolvedValueOnce({ ok: false, text: async () => "Error" });

    const { GET } = await import("@/app/api/youtube/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });
});
