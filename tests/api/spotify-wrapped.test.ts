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

const mockTracksResponse = {
  items: [
    {
      id: "t1",
      name: "Song One",
      artists: [{ name: "Artist A" }],
      album: {
        name: "Album A",
        images: [{ url: "https://i.scdn.co/image/album-a.jpg", width: 640, height: 640 }],
      },
      external_urls: { spotify: "https://open.spotify.com/track/t1" },
    },
    {
      id: "t2",
      name: "Song Two",
      artists: [{ name: "Artist B" }, { name: "Artist C" }],
      album: {
        name: "Album B",
        images: [{ url: "https://i.scdn.co/image/album-b.jpg", width: 640, height: 640 }],
      },
      external_urls: { spotify: "https://open.spotify.com/track/t2" },
    },
  ],
};

const mockArtistsResponse = {
  items: [
    {
      id: "a1",
      name: "Artist A",
      images: [{ url: "https://i.scdn.co/image/artist-a.jpg", width: 640, height: 640 }],
      genres: ["pop", "indie pop"],
      external_urls: { spotify: "https://open.spotify.com/artist/a1" },
    },
    {
      id: "a2",
      name: "Artist B",
      images: [{ url: "https://i.scdn.co/image/artist-b.jpg", width: 640, height: 640 }],
      genres: ["pop", "dance pop"],
      external_urls: { spotify: "https://open.spotify.com/artist/a2" },
    },
    {
      id: "a3",
      name: "Artist C",
      images: [],
      genres: [],
      external_urls: { spotify: "https://open.spotify.com/artist/a3" },
    },
  ],
};

describe("GET /api/spotify/wrapped", () => {
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

  it("returns null when env vars are not set", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    const { GET } = await import("@/app/api/spotify/wrapped/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and transforms tracks, artists, and genres", async () => {
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
        json: async () => mockTracksResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockArtistsResponse,
      });

    const { GET } = await import("@/app/api/spotify/wrapped/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    // Tracks
    expect(data.tracks).toHaveLength(2);
    expect(data.tracks[0].id).toBe("t1");
    expect(data.tracks[0].name).toBe("Song One");
    expect(data.tracks[0].artist).toBe("Artist A");
    expect(data.tracks[1].artist).toBe("Artist B, Artist C");
    // Artists
    expect(data.artists).toHaveLength(3);
    expect(data.artists[0].name).toBe("Artist A");
    expect(data.artists[0].genres).toEqual(["pop", "indie pop"]);
    expect(data.artists[2].imageUrl).toBe(""); // no images
    expect(data.artists[2].genres).toEqual([]); // no genres
  });

  it("aggregates genres by frequency", async () => {
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
        json: async () => mockTracksResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockArtistsResponse,
      });

    const { GET } = await import("@/app/api/spotify/wrapped/route");
    const response = await GET();
    const data = await response.json();

    // "pop" appears in both Artist A and Artist B → should be first
    expect(data.topGenres[0]).toBe("pop");
    expect(data.topGenres).toContain("indie pop");
    expect(data.topGenres).toContain("dance pop");
  });

  it("returns current year in response", async () => {
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

    const { GET } = await import("@/app/api/spotify/wrapped/route");
    const response = await GET();
    const data = await response.json();

    expect(data.year).toBe(new Date().getFullYear());
  });

  it("returns null on token refresh failure", async () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "test-refresh-token";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Invalid client",
    });

    const { GET } = await import("@/app/api/spotify/wrapped/route");
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockArtistsResponse,
      });

    const { GET } = await import("@/app/api/spotify/wrapped/route");
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

    const { GET } = await import("@/app/api/spotify/wrapped/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });
});
