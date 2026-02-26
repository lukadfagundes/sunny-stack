/**
 * @file Test Notification API Route Unit Tests
 * @description Tests for POST /api/admin/test-notification
 */

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !init?.status || (init.status >= 200 && init.status < 300),
    })),
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("discord.js", () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  })),
  TextChannel: jest.fn(),
}));

const routeModule = require("@/app/api/admin/test-notification/route");
const POST = routeModule.POST;

describe("POST /api/admin/test-notification", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Clean up global discord client
    delete (global as any).discordClient;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return 500 when DISCORD_CHANNEL_ADMIN_LOGS not configured", async () => {
    delete process.env.DISCORD_CHANNEL_ADMIN_LOGS;

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("DISCORD_CHANNEL_ADMIN_LOGS not configured");
  });

  it("should return 503 when Discord client not available", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    (global as any).discordClient = undefined;

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("Discord bot not running");
  });

  it("should return 503 when Discord client not ready", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    (global as any).discordClient = {
      isReady: () => false,
    };

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("Discord bot not ready");
  });

  it("should return 500 when no guild found", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    (global as any).discordClient = {
      isReady: () => true,
      user: { tag: "TestBot#0001" },
      guilds: { cache: { first: () => null } },
    };

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("No guild found");
  });

  it("should return 404 when channel not found", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    (global as any).discordClient = {
      isReady: () => true,
      user: { tag: "TestBot#0001" },
      guilds: {
        cache: {
          first: () => ({
            channels: {
              cache: { get: () => null },
            },
          }),
        },
      },
    };

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Channel not found");
  });

  it("should return 400 when channel is not text-based", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    (global as any).discordClient = {
      isReady: () => true,
      user: { tag: "TestBot#0001" },
      guilds: {
        cache: {
          first: () => ({
            channels: {
              cache: {
                get: () => ({
                  isTextBased: () => false,
                }),
              },
            },
          }),
        },
      },
    };

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not a text channel");
  });

  it("should send test notification successfully", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    const mockSend = jest.fn().mockResolvedValue(undefined);
    (global as any).discordClient = {
      isReady: () => true,
      user: { tag: "TestBot#0001" },
      guilds: {
        cache: {
          first: () => ({
            channels: {
              cache: {
                get: () => ({
                  isTextBased: () => true,
                  send: mockSend,
                }),
              },
            },
          }),
        },
      },
    };

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.botUser).toBe("TestBot#0001");
    expect(mockSend).toHaveBeenCalled();
  });

  it("should return 500 when send fails", async () => {
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "channel-123";
    (global as any).discordClient = {
      isReady: () => true,
      user: { tag: "TestBot#0001" },
      guilds: {
        cache: {
          first: () => ({
            channels: {
              cache: {
                get: () => ({
                  isTextBased: () => true,
                  send: jest.fn().mockRejectedValue(new Error("Send failed")),
                }),
              },
            },
          }),
        },
      },
    };

    const response = await POST({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to send notification");
  });
});
