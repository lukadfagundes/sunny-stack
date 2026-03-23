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

const originalApiKey = process.env.STEAM_API_KEY;
const originalSteamId = process.env.STEAM_ID;

afterAll(() => {
  if (originalApiKey !== undefined) {
    process.env.STEAM_API_KEY = originalApiKey;
  } else {
    delete process.env.STEAM_API_KEY;
  }
  if (originalSteamId !== undefined) {
    process.env.STEAM_ID = originalSteamId;
  } else {
    delete process.env.STEAM_ID;
  }
});

const mockGamesResponse = {
  response: {
    game_count: 5,
    games: [
      { appid: 730, name: "Counter-Strike 2", playtime_forever: 14040, img_icon_url: "icon730", playtime_2weeks: 120 },
      { appid: 570, name: "Dota 2", playtime_forever: 8520, img_icon_url: "icon570" },
      { appid: 440, name: "Team Fortress 2", playtime_forever: 6000, img_icon_url: "icon440", playtime_2weeks: 60 },
      { appid: 1245620, name: "Elden Ring", playtime_forever: 3000, img_icon_url: "icon1245620" },
      { appid: 292030, name: "The Witcher 3", playtime_forever: 2400, img_icon_url: "icon292030" },
      { appid: 413150, name: "Stardew Valley", playtime_forever: 1800, img_icon_url: "icon413150" },
      { appid: 367520, name: "Hollow Knight", playtime_forever: 1200, img_icon_url: "icon367520" },
      { appid: 1091500, name: "Cyberpunk 2077", playtime_forever: 900, img_icon_url: "icon1091500" },
      { appid: 105600, name: "Terraria", playtime_forever: 600, img_icon_url: "icon105600" },
      { appid: 252950, name: "Rocket League", playtime_forever: 300, img_icon_url: "icon252950" },
    ],
  },
};

describe("GET /api/steam", () => {
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

  it("returns null when STEAM_API_KEY is not set", async () => {
    delete process.env.STEAM_API_KEY;
    process.env.STEAM_ID = "76561198012345678";

    const { GET } = await import("@/app/api/steam/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when STEAM_ID is not set", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    delete process.env.STEAM_ID;

    const { GET } = await import("@/app/api/steam/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and returns top 8 games sorted by playtime", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("GetOwnedGames")) {
        return { ok: true, json: async () => mockGamesResponse };
      }
      // appdetails calls — return a header_image for each game
      const match = url.match(/appids=(\d+)/);
      const appid = match ? match[1] : "0";
      return {
        ok: true,
        json: async () => ({
          [appid]: {
            success: true,
            data: { header_image: `https://cdn.steam.com/${appid}/header.jpg` },
          },
        }),
      };
    });

    const { GET } = await import("@/app/api/steam/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.games).toHaveLength(8);
    expect(data.games[0].name).toBe("Counter-Strike 2");
    expect(data.games[0].playtimeMinutes).toBe(14040);
    expect(data.games[0].appid).toBe(730);
    expect(data.games[0].recentlyPlayed).toBe(true);
    expect(data.games[0].headerImage).toBe("https://cdn.steam.com/730/header.jpg");
    expect(data.games[1].name).toBe("Dota 2");
    expect(data.games[1].recentlyPlayed).toBe(false);
    expect(data.games[7].name).toBe("Cyberpunk 2077");
  });

  it("passes API key and Steam ID in URL", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: { games: [] } }),
    });

    const { GET } = await import("@/app/api/steam/route");
    await GET();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("key=TESTAPIKEY"),
      expect.objectContaining({ cache: "no-store" })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("steamid=76561198012345678"),
      expect.any(Object)
    );
  });

  it("returns null on API error", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { GET } = await import("@/app/api/steam/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns null on network error", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/steam/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("handles empty games array", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: { game_count: 0, games: [] } }),
    });

    const { GET } = await import("@/app/api/steam/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.games).toHaveLength(0);
  });
});

describe("GET /api/steam/achievements", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.resetModules();
    jest.mock("next/server", () => ({
      NextRequest: class {
        nextUrl: URL;
        constructor(url: string) {
          this.nextUrl = new URL(url);
        }
      },
      NextResponse: {
        json: (data: unknown, init?: { status?: number }) => ({
          json: async () => data,
          status: init?.status ?? 200,
        }),
      },
    }));
  });

  function createRequest(appid?: string) {
    const url = appid
      ? `http://localhost:3000/api/steam/achievements?appid=${appid}`
      : "http://localhost:3000/api/steam/achievements";
    return { nextUrl: new URL(url) };
  }

  it("returns null when env vars are missing", async () => {
    delete process.env.STEAM_API_KEY;
    delete process.env.STEAM_ID;

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest("730") as never);
    const data = await response.json();

    expect(data).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when appid is missing", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest() as never);
    const data = await response.json();

    expect(data).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns earned achievements with metadata from both APIs", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("GetPlayerAchievements")) {
        return {
          ok: true,
          json: async () => ({
            playerstats: {
              steamID: "76561198012345678",
              gameName: "Counter-Strike 2",
              success: true,
              achievements: [
                { apiname: "ach1", achieved: 1, unlocktime: 1700000000 },
                { apiname: "ach2", achieved: 0, unlocktime: 0 },
                { apiname: "ach3", achieved: 1, unlocktime: 1690000000 },
                { apiname: "ach4", achieved: 0, unlocktime: 0 },
                { apiname: "ach5", achieved: 1, unlocktime: 1680000000 },
              ],
            },
          }),
        };
      }
      if (url.includes("GetSchemaForGame")) {
        return {
          ok: true,
          json: async () => ({
            game: {
              availableGameStats: {
                achievements: [
                  { name: "ach1", displayName: "First Blood", description: "Get your first kill", icon: "https://steam.com/ach1.jpg", icongray: "https://steam.com/ach1_gray.jpg", hidden: 0 },
                  { name: "ach2", displayName: "Double Kill", description: "Get two kills", icon: "https://steam.com/ach2.jpg", icongray: "https://steam.com/ach2_gray.jpg", hidden: 0 },
                  { name: "ach3", displayName: "Hat Trick", description: "Get three kills", icon: "https://steam.com/ach3.jpg", icongray: "https://steam.com/ach3_gray.jpg", hidden: 0 },
                  { name: "ach4", displayName: "Rampage", description: "Get four kills", icon: "https://steam.com/ach4.jpg", icongray: "https://steam.com/ach4_gray.jpg", hidden: 0 },
                  { name: "ach5", displayName: "Ace", description: "Get five kills", icon: "https://steam.com/ach5.jpg", icongray: "https://steam.com/ach5_gray.jpg", hidden: 0 },
                ],
              },
            },
          }),
        };
      }
      return { ok: false };
    });

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest("730") as never);
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.achieved).toBe(3);
    expect(data.total).toBe(5);
    expect(data.achievements).toHaveLength(3);
    // Sorted by unlocktime descending (most recent first)
    expect(data.achievements[0].displayName).toBe("First Blood");
    expect(data.achievements[0].icon).toBe("https://steam.com/ach1.jpg");
    expect(data.achievements[0].description).toBe("Get your first kill");
    expect(data.achievements[0].unlocktime).toBe(1700000000);
    expect(data.achievements[1].displayName).toBe("Hat Trick");
    expect(data.achievements[2].displayName).toBe("Ace");
  });

  it("returns null when Steam API reports success false", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("GetPlayerAchievements")) {
        return {
          ok: true,
          json: async () => ({
            playerstats: {
              error: "Profile is not public",
              success: false,
            },
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest("730") as never);
    const data = await response.json();

    expect(data).toBeNull();
  });

  it("falls back to apiname when schema is unavailable", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("GetPlayerAchievements")) {
        return {
          ok: true,
          json: async () => ({
            playerstats: {
              success: true,
              achievements: [
                { apiname: "ach1", achieved: 1, unlocktime: 1700000000 },
                { apiname: "ach2", achieved: 0, unlocktime: 0 },
              ],
            },
          }),
        };
      }
      // Schema fetch fails
      return { ok: false, status: 500 };
    });

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest("730") as never);
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.achieved).toBe(1);
    expect(data.total).toBe(2);
    expect(data.achievements[0].displayName).toBe("ach1");
    expect(data.achievements[0].icon).toBe("");
  });

  it("returns null when game has no achievements", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("GetPlayerAchievements")) {
        return { ok: false, status: 400 };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest("730") as never);
    const data = await response.json();

    expect(data).toBeNull();
  });

  it("returns null on network error", async () => {
    process.env.STEAM_API_KEY = "TESTAPIKEY";
    process.env.STEAM_ID = "76561198012345678";

    mockFetch.mockRejectedValue(new Error("Network error"));

    const { GET } = await import("@/app/api/steam/achievements/route");
    const response = await GET(createRequest("730") as never);
    const data = await response.json();

    expect(data).toBeNull();
  });
});
