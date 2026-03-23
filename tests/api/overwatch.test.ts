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

const originalBattletag = process.env.OVERWATCH_BATTLETAG;

afterAll(() => {
  if (originalBattletag !== undefined) {
    process.env.OVERWATCH_BATTLETAG = originalBattletag;
  } else {
    delete process.env.OVERWATCH_BATTLETAG;
  }
});

const mockStatsResponse = {
  heroes: {
    ana: { time_played: 50000, games_played: 200, games_won: 110, winrate: 55 },
    mercy: { time_played: 40000, games_played: 180, games_won: 95, winrate: 52.8 },
    kiriko: { time_played: 30000, games_played: 150, games_won: 80, winrate: 53.3 },
    "junker-queen": { time_played: 20000, games_played: 100, games_won: 55, winrate: 55 },
    tracer: { time_played: 15000, games_played: 80, games_won: 42, winrate: 52.5 },
    widowmaker: { time_played: 10000, games_played: 60, games_won: 28, winrate: 46.7 },
    reinhardt: { time_played: 8000, games_played: 50, games_won: 30, winrate: 60 },
  },
};

describe("GET /api/overwatch", () => {
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

  it("returns null when OVERWATCH_BATTLETAG is not set", async () => {
    delete process.env.OVERWATCH_BATTLETAG;

    const { GET } = await import("@/app/api/overwatch/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and returns top 5 heroes sorted by time_played", async () => {
    process.env.OVERWATCH_BATTLETAG = "TestPlayer#1234";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsResponse,
    });

    const { GET } = await import("@/app/api/overwatch/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.heroes).toHaveLength(5);
    expect(data.heroes[0].name).toBe("Ana");
    expect(data.heroes[1].name).toBe("Mercy");
    expect(data.heroes[2].name).toBe("Kiriko");
    expect(data.heroes[3].name).toBe("Junker Queen");
    expect(data.heroes[4].name).toBe("Tracer");
  });

  it("formats hero names correctly", async () => {
    process.env.OVERWATCH_BATTLETAG = "TestPlayer#1234";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        heroes: {
          "junker-queen": { time_played: 50000, games_played: 200, games_won: 100, winrate: 50 },
          ana: { time_played: 40000, games_played: 180, games_won: 90, winrate: 50 },
        },
      }),
    });

    const { GET } = await import("@/app/api/overwatch/route");
    const response = await GET();
    const data = await response.json();

    expect(data.heroes[0].name).toBe("Junker Queen");
    expect(data.heroes[1].name).toBe("Ana");
  });

  it("converts BattleTag # to - in URL", async () => {
    process.env.OVERWATCH_BATTLETAG = "TestPlayer#1234";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ heroes: {} }),
    });

    const { GET } = await import("@/app/api/overwatch/route");
    await GET();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("TestPlayer-1234"),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("returns null on API error", async () => {
    process.env.OVERWATCH_BATTLETAG = "TestPlayer#1234";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { GET } = await import("@/app/api/overwatch/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns null on network error", async () => {
    process.env.OVERWATCH_BATTLETAG = "TestPlayer#1234";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { GET } = await import("@/app/api/overwatch/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("handles empty heroes object", async () => {
    process.env.OVERWATCH_BATTLETAG = "TestPlayer#1234";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ heroes: {} }),
    });

    const { GET } = await import("@/app/api/overwatch/route");
    const response = await GET();
    const data = await response.json();

    expect(data).not.toBeNull();
    expect(data.heroes).toHaveLength(0);
  });
});
