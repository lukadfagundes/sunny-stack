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

const originalClientId = process.env.SPOTIFY_CLIENT_ID;
const originalClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const originalRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

afterAll(() => {
  if (originalClientId !== undefined) {
    process.env.SPOTIFY_CLIENT_ID = originalClientId;
  } else {
    delete process.env.SPOTIFY_CLIENT_ID;
  }
  if (originalClientSecret !== undefined) {
    process.env.SPOTIFY_CLIENT_SECRET = originalClientSecret;
  } else {
    delete process.env.SPOTIFY_CLIENT_SECRET;
  }
  if (originalRefreshToken !== undefined) {
    process.env.SPOTIFY_REFRESH_TOKEN = originalRefreshToken;
  } else {
    delete process.env.SPOTIFY_REFRESH_TOKEN;
  }
});

const mockTokenResponse = {
  access_token: "mock-access-token",
  token_type: "Bearer",
  expires_in: 3600,
};

const mockTopTrackResponse = {
  items: [
    {
      id: "track123",
      name: "Test Song",
      artists: [{ name: "Test Artist" }, { name: "Featured Artist" }],
      album: {
        name: "Test Album",
        images: [
          {
            url: "https://i.scdn.co/image/album-large.jpg",
            width: 640,
            height: 640,
          },
          {
            url: "https://i.scdn.co/image/album-small.jpg",
            width: 64,
            height: 64,
          },
        ],
      },
      external_urls: {
        spotify: "https://open.spotify.com/track/track123",
      },
    },
  ],
};

describe("GET /api/spotify/top-track", () => {
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

  it("returns null when SPOTIFY_CLIENT_ID is not set", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when SPOTIFY_CLIENT_SECRET is not set", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when SPOTIFY_REFRESH_TOKEN is not set", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes token and fetches top track successfully", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "test-refresh-token";

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopTrackResponse,
      });

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.id).toBe("track123");
    expect(data.name).toBe("Test Song");
    expect(data.artist).toBe("Test Artist, Featured Artist");
    expect(data.albumName).toBe("Test Album");
    expect(data.albumImageUrl).toBe("https://i.scdn.co/image/album-large.jpg");
    expect(data.spotifyUrl).toBe("https://open.spotify.com/track/track123");
  });

  it("returns null on token refresh failure", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "test-refresh-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Invalid client",
    });

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns null on API error", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "test-refresh-token";

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        text: async () => "Forbidden",
      });

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns null on network error", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "test-refresh-token";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns null when feed is empty", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "test-refresh-token";

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

    const { GET } = await import("@/app/api/spotify/top-track/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
  });
});
