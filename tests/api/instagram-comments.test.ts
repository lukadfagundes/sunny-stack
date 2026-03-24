export {};

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status ?? 200,
    }),
  },
  NextRequest: jest.fn().mockImplementation((url: string) => ({
    nextUrl: new URL(url),
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const originalEnv = process.env.INSTAGRAM_ACCESS_TOKEN;

afterAll(() => {
  if (originalEnv !== undefined) {
    process.env.INSTAGRAM_ACCESS_TOKEN = originalEnv;
  } else {
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
  }
});

describe("GET /api/instagram/comments", () => {
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
      NextRequest: jest.fn().mockImplementation((url: string) => ({
        nextUrl: new URL(url),
      })),
    }));
  });

  it("returns empty array when postId is missing", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest("http://localhost/api/instagram/comments");
    const response = await GET(request);
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array when INSTAGRAM_ACCESS_TOKEN is not set", async () => {
    delete process.env.INSTAGRAM_ACCESS_TOKEN;

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest(
      "http://localhost/api/instagram/comments?postId=123"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array when postId has invalid format", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest(
      "http://localhost/api/instagram/comments?postId=abc-invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and transforms comments with replies", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "c1",
            text: "Great photo!",
            username: "user1",
            like_count: 3,
            timestamp: "2026-03-20T12:00:00+0000",
            replies: {
              data: [
                {
                  id: "r1",
                  text: "Thanks!",
                  username: "strawhatluka",
                  like_count: 1,
                  timestamp: "2026-03-20T13:00:00+0000",
                },
              ],
            },
          },
          {
            id: "c2",
            text: "Nice!",
            username: "user2",
            like_count: 0,
            timestamp: "2026-03-19T12:00:00+0000",
          },
        ],
      }),
    });

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest(
      "http://localhost/api/instagram/comments?postId=12345"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("c1");
    expect(data[0].text).toBe("Great photo!");
    expect(data[0].username).toBe("user1");
    expect(data[0].likeCount).toBe(3);
    expect(data[0].replies).toHaveLength(1);
    expect(data[0].replies[0].text).toBe("Thanks!");
    expect(data[0].replies[0].username).toBe("strawhatluka");
    expect(data[1].id).toBe("c2");
    expect(data[1].replies).toHaveLength(0);

    // Verify token is sent via Authorization header, not in URL
    expect(mockFetch).toHaveBeenCalledWith(
      expect.not.stringContaining("access_token="),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });

  it("returns empty array on API error", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Unauthorized",
    });

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest(
      "http://localhost/api/instagram/comments?postId=12345"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("returns empty array on network error", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest(
      "http://localhost/api/instagram/comments?postId=12345"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("still works correctly with cache eviction logic", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "c1",
            text: "Test comment",
            username: "testuser",
            like_count: 0,
            timestamp: "2026-03-20T12:00:00+0000",
          },
        ],
      }),
    });

    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/instagram/comments/route");
    const request = new NextRequest(
      "http://localhost/api/instagram/comments?postId=99999"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].text).toBe("Test comment");
  });
});
