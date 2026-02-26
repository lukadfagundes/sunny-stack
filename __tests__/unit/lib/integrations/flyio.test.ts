/**
 * @jest-environment node
 */
/**
 * @file Fly.io API Integration Unit Tests
 * @description Tests for Fly.io GraphQL API client: authentication, app management,
 * machine status, and status summary with app categorization logic.
 */

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.FLY_API_TOKEN = "test-fly-token";
  process.env.FLY_ORG_SLUG = "test-org";
  (global.fetch as jest.Mock) = jest.fn();
});

afterAll(() => {
  process.env = originalEnv;
});

function mockGraphQLResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: jest.fn().mockResolvedValue(JSON.stringify({ data })),
    json: jest.fn().mockResolvedValue({ data }),
  };
}

function mockGraphQLError(errorMessage: string) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: jest.fn(),
    json: jest.fn().mockResolvedValue({ errors: [{ message: errorMessage }] }),
  };
}

function mockHttpError(status = 500, statusText = "Internal Server Error") {
  return {
    ok: false,
    status,
    statusText,
    text: jest.fn().mockResolvedValue("Server Error"),
    json: jest.fn(),
  };
}

const sampleOrgs = {
  viewer: {
    organizations: {
      nodes: [
        { name: "Test Org", slug: "test-org" },
        { name: "Other Org", slug: "other-org" },
      ],
    },
  },
};

const sampleApps = [
  {
    id: "app-1",
    name: "web-app",
    status: "running",
    deployed: true,
    hostname: "web-app.fly.dev",
    organization: { name: "Test Org", slug: "test-org" },
    currentRelease: {
      version: 5,
      status: "complete",
      createdAt: "2024-06-01T00:00:00Z",
    },
  },
  {
    id: "app-2",
    name: "api-app",
    status: "suspended",
    deployed: false,
    hostname: "api-app.fly.dev",
    organization: { name: "Test Org", slug: "test-org" },
    currentRelease: null,
  },
  {
    id: "app-3",
    name: "worker",
    status: "stopped",
    deployed: false,
    hostname: "worker.fly.dev",
    organization: { name: "Test Org", slug: "test-org" },
    currentRelease: null,
  },
  {
    id: "app-4",
    name: "deployed-only",
    status: "deployed",
    deployed: true,
    hostname: "deployed.fly.dev",
    organization: { name: "Test Org", slug: "test-org" },
    currentRelease: {
      version: 1,
      status: "complete",
      createdAt: "2024-05-01T00:00:00Z",
    },
  },
];

const sampleMachines = [
  {
    id: "m1",
    name: "web-1",
    state: "started",
    region: "iad",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "m2",
    name: "web-2",
    state: "started",
    region: "lhr",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
];

describe("Fly.io Integration", () => {
  describe("flyioRequest (via exported functions)", () => {
    it("should throw when FLY_API_TOKEN is not set", async () => {
      delete process.env.FLY_API_TOKEN;
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      await expect(getFlyioHealth()).rejects.toThrow(
        "FLY_API_TOKEN not configured",
      );
    });

    it("should send POST to GraphQL endpoint with Bearer auth", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse(sampleOrgs),
      );
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      await getFlyioHealth();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.fly.io/graphql",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-fly-token",
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("viewer"),
        }),
      );
    });

    it("should throw on non-ok HTTP response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockHttpError(500, "Internal Server Error"),
      );
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      await expect(getFlyioHealth()).rejects.toThrow(
        "Fly.io API error: 500 Internal Server Error",
      );
    });

    it("should throw on GraphQL errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLError("Invalid query"),
      );
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      await expect(getFlyioHealth()).rejects.toThrow(
        "Fly.io GraphQL error: Invalid query",
      );
    });

    it('should throw with "Unknown error" when errors array has no message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: jest.fn(),
        json: jest.fn().mockResolvedValue({ errors: [{}] }),
      });
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      await expect(getFlyioHealth()).rejects.toThrow(
        "Fly.io GraphQL error: Unknown error",
      );
    });
  });

  describe("getFlyioHealth", () => {
    it("should return authenticated status and matching organization name", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse(sampleOrgs),
      );
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      const result = await getFlyioHealth();
      expect(result).toEqual({ authenticated: true, organization: "Test Org" });
    });

    it("should return null organization when slug does not match", async () => {
      process.env.FLY_ORG_SLUG = "nonexistent-org";
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse(sampleOrgs),
      );
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      const result = await getFlyioHealth();
      expect(result).toEqual({ authenticated: true, organization: null });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Health error"));
      const { getFlyioHealth } = await import("@/lib/integrations/flyio");
      const logger = (await import("@/lib/logger")).default;
      await expect(getFlyioHealth()).rejects.toThrow("Health error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get Fly.io health:",
        expect.any(Error),
      );
    });
  });

  describe("getApps", () => {
    it("should return apps array from organization", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse({ organization: { apps: { nodes: sampleApps } } }),
      );
      const { getApps } = await import("@/lib/integrations/flyio");
      expect(await getApps()).toEqual(sampleApps);
    });

    it("should pass orgSlug as variable", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse({ organization: { apps: { nodes: [] } } }),
      );
      const { getApps } = await import("@/lib/integrations/flyio");
      await getApps();
      const body = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(body.variables).toEqual({ orgSlug: "test-org" });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Apps error"));
      const { getApps } = await import("@/lib/integrations/flyio");
      await expect(getApps()).rejects.toThrow("Apps error");
    });
  });

  describe("getAppMachines", () => {
    it("should return machines for a specific app", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse({ app: { machines: { nodes: sampleMachines } } }),
      );
      const { getAppMachines } = await import("@/lib/integrations/flyio");
      expect(await getAppMachines("web-app")).toEqual(sampleMachines);
    });

    it("should pass appName as variable", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse({ app: { machines: { nodes: [] } } }),
      );
      const { getAppMachines } = await import("@/lib/integrations/flyio");
      await getAppMachines("my-app");
      const body = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(body.variables).toEqual({ appName: "my-app" });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Machines error"),
      );
      const { getAppMachines } = await import("@/lib/integrations/flyio");
      await expect(getAppMachines("web-app")).rejects.toThrow("Machines error");
    });
  });

  describe("getAppStatus", () => {
    it("should return app status by name", async () => {
      const app = sampleApps[0];
      (global.fetch as jest.Mock).mockResolvedValue(
        mockGraphQLResponse({ app }),
      );
      const { getAppStatus } = await import("@/lib/integrations/flyio");
      expect(await getAppStatus("web-app")).toEqual(app);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Status error"));
      const { getAppStatus } = await import("@/lib/integrations/flyio");
      await expect(getAppStatus("web-app")).rejects.toThrow("Status error");
    });
  });

  describe("getFlyioStatusSummary", () => {
    it("should categorize apps into running, suspended, and stopped", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockGraphQLResponse(sampleOrgs))
        .mockResolvedValueOnce(
          mockGraphQLResponse({
            organization: { apps: { nodes: sampleApps } },
          }),
        )
        .mockResolvedValueOnce(
          mockGraphQLResponse({ app: { machines: { nodes: sampleMachines } } }),
        )
        .mockResolvedValueOnce(
          mockGraphQLResponse({ app: { machines: { nodes: [] } } }),
        )
        .mockResolvedValueOnce(
          mockGraphQLResponse({ app: { machines: { nodes: [] } } }),
        )
        .mockResolvedValueOnce(
          mockGraphQLResponse({
            app: { machines: { nodes: [sampleMachines[0]] } },
          }),
        );

      const { getFlyioStatusSummary } =
        await import("@/lib/integrations/flyio");
      const result = await getFlyioStatusSummary();

      expect(result.health).toEqual({
        authenticated: true,
        organization: "Test Org",
      });
      expect(result.apps.total).toBe(4);
      // running: app-1 (deployed=true), app-4 (deployed=true OR status=deployed)
      expect(result.apps.running).toBe(2);
      // suspended: app-2 (status=suspended)
      expect(result.apps.suspended).toBe(1);
      // stopped: app-3 (not deployed, not running/deployed/suspended)
      expect(result.apps.stopped).toBe(1);
      expect(result.apps.appList).toHaveLength(4);
      expect(result.apps.appList[0].machines).toBe(2);
      expect(result.apps.appList[0].machineStates).toEqual({ started: 2 });
    });

    it("should handle machine fetch failure gracefully per app", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockGraphQLResponse(sampleOrgs))
        .mockResolvedValueOnce(
          mockGraphQLResponse({
            organization: { apps: { nodes: [sampleApps[0]] } },
          }),
        )
        .mockResolvedValueOnce(mockGraphQLError("Machine fetch failed"));

      const { getFlyioStatusSummary } =
        await import("@/lib/integrations/flyio");
      const result = await getFlyioStatusSummary();
      expect(result.apps.appList[0].machines).toBe(0);
    });

    it("should handle app with no currentRelease", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockGraphQLResponse(sampleOrgs))
        .mockResolvedValueOnce(
          mockGraphQLResponse({
            organization: { apps: { nodes: [sampleApps[1]] } },
          }),
        )
        .mockResolvedValueOnce(
          mockGraphQLResponse({ app: { machines: { nodes: [] } } }),
        );

      const { getFlyioStatusSummary } =
        await import("@/lib/integrations/flyio");
      const result = await getFlyioStatusSummary();
      expect(result.apps.appList[0].currentRelease).toBeNull();
    });

    it("should include currentRelease details when present", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockGraphQLResponse(sampleOrgs))
        .mockResolvedValueOnce(
          mockGraphQLResponse({
            organization: { apps: { nodes: [sampleApps[0]] } },
          }),
        )
        .mockResolvedValueOnce(
          mockGraphQLResponse({ app: { machines: { nodes: [] } } }),
        );

      const { getFlyioStatusSummary } =
        await import("@/lib/integrations/flyio");
      const result = await getFlyioStatusSummary();
      expect(result.apps.appList[0].currentRelease).toEqual({
        version: 5,
        status: "complete",
        createdAt: "2024-06-01T00:00:00Z",
      });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Summary error"));
      const { getFlyioStatusSummary } =
        await import("@/lib/integrations/flyio");
      const logger = (await import("@/lib/logger")).default;
      await expect(getFlyioStatusSummary()).rejects.toThrow("Summary error");
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
