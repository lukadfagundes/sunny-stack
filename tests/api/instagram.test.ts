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
const originalEnv = process.env.INSTAGRAM_ACCESS_TOKEN;

afterAll(() => {
  if (originalEnv !== undefined) {
    process.env.INSTAGRAM_ACCESS_TOKEN = originalEnv;
  } else {
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
  }
});

describe("GET /api/instagram", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.resetModules();
    // Re-apply the mock after resetModules
    jest.mock("next/server", () => ({
      NextResponse: {
        json: (data: unknown, init?: { status?: number }) => ({
          json: async () => data,
          status: init?.status ?? 200,
        }),
      },
    }));
  });

  it("returns empty array when INSTAGRAM_ACCESS_TOKEN is not set", async () => {
    delete process.env.INSTAGRAM_ACCESS_TOKEN;

    const { GET } = await import("@/app/api/instagram/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and filters IMAGE posts from Instagram API", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "1",
            media_type: "IMAGE",
            media_url: "https://cdn.instagram.com/photo1.jpg",
            caption: "First post",
            timestamp: "2026-03-20T12:00:00+0000",
            permalink: "https://instagram.com/p/abc",
            like_count: 42,
            comments_count: 5,
          },
          {
            id: "2",
            media_type: "VIDEO",
            media_url: "https://cdn.instagram.com/video1.mp4",
            caption: "A video",
            timestamp: "2026-03-19T12:00:00+0000",
            permalink: "https://instagram.com/p/def",
          },
          {
            id: "3",
            media_type: "IMAGE",
            media_url: "https://cdn.instagram.com/photo2.jpg",
            timestamp: "2026-03-18T12:00:00+0000",
            permalink: "https://instagram.com/p/ghi",
          },
        ],
      }),
    });

    const { GET } = await import("@/app/api/instagram/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("1");
    expect(data[0].imageUrl).toBe("https://cdn.instagram.com/photo1.jpg");
    expect(data[0].caption).toBe("First post");
    expect(data[0].likeCount).toBe(42);
    expect(data[0].commentsCount).toBe(5);
    expect(data[1].id).toBe("3");
    expect(data[1].caption).toBe("");
    expect(data[1].likeCount).toBe(0);
    expect(data[1].commentsCount).toBe(0);

    // Verify token is sent via Authorization header, not in URL
    expect(mockFetch).toHaveBeenCalledWith(
      expect.not.stringContaining("access_token="),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("returns empty array on API error", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Unauthorized",
    });

    const { GET } = await import("@/app/api/instagram/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("returns empty array on network error", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/instagram/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });
});
