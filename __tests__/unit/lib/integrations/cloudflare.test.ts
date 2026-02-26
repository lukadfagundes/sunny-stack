/**
 * @jest-environment node
 */
/**
 * @file Cloudflare API Integration Unit Tests
 * @description Tests for Cloudflare API client: authentication, request handling,
 * zone management, DNS records, SSL status, analytics, and status summary.
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
  process.env.CLOUDFLARE_API_TOKEN = "test-cf-token";
  process.env.CLOUDFLARE_ZONE_ID = "test-zone-id";
  (global.fetch as jest.Mock) = jest.fn();
});

afterAll(() => {
  process.env = originalEnv;
});

function mockCfResponse(result: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: jest.fn().mockResolvedValue(""),
    json: jest.fn().mockResolvedValue({ success: true, result }),
  };
}

function mockCfErrorResponse(status = 403, statusText = "Forbidden") {
  return {
    ok: false,
    status,
    statusText,
    text: jest.fn().mockResolvedValue("Forbidden"),
    json: jest.fn(),
  };
}

function mockCfApiFailure(errorMessage = "Unknown error") {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: jest.fn(),
    json: jest.fn().mockResolvedValue({
      success: false,
      errors: [{ message: errorMessage }],
    }),
  };
}

const sampleZone = {
  id: "zone-1",
  name: "example.com",
  status: "active",
  paused: false,
  type: "full",
  name_servers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
  original_name_servers: ["ns1.original.com"],
  created_on: "2024-01-01T00:00:00Z",
  modified_on: "2024-06-01T00:00:00Z",
};

const sampleDnsRecords = [
  {
    id: "dns-1",
    type: "A",
    name: "example.com",
    content: "1.2.3.4",
    proxied: true,
    ttl: 1,
    created_on: "2024-01-01T00:00:00Z",
    modified_on: "2024-01-01T00:00:00Z",
  },
  {
    id: "dns-2",
    type: "CNAME",
    name: "www.example.com",
    content: "example.com",
    proxied: true,
    ttl: 1,
    created_on: "2024-01-01T00:00:00Z",
    modified_on: "2024-01-01T00:00:00Z",
  },
  {
    id: "dns-3",
    type: "MX",
    name: "example.com",
    content: "mail.example.com",
    proxied: false,
    ttl: 3600,
    created_on: "2024-01-01T00:00:00Z",
    modified_on: "2024-01-01T00:00:00Z",
  },
];

describe("Cloudflare Integration", () => {
  describe("cloudflareRequest (via exported functions)", () => {
    it("should throw when CLOUDFLARE_API_TOKEN is not set", async () => {
      delete process.env.CLOUDFLARE_API_TOKEN;
      const { getCloudflareHealth } =
        await import("@/lib/integrations/cloudflare");
      await expect(getCloudflareHealth()).rejects.toThrow(
        "CLOUDFLARE_API_TOKEN not configured",
      );
    });

    it("should call fetch with correct auth headers", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockCfResponse(sampleZone));
      const { getZone } = await import("@/lib/integrations/cloudflare");
      await getZone();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.cloudflare.com/client/v4/zones/test-zone-id",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-cf-token",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should throw on non-ok HTTP response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockCfErrorResponse(403, "Forbidden"),
      );
      const { getZone } = await import("@/lib/integrations/cloudflare");
      await expect(getZone()).rejects.toThrow(
        "Cloudflare API error: 403 Forbidden",
      );
    });

    it("should throw when result.success is false", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockCfApiFailure("Invalid zone"),
      );
      const { getZone } = await import("@/lib/integrations/cloudflare");
      await expect(getZone()).rejects.toThrow(
        "Cloudflare API error: Invalid zone",
      );
    });

    it('should throw with "Unknown error" when errors array is empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: jest.fn(),
        json: jest.fn().mockResolvedValue({ success: false, errors: [] }),
      });
      const { getZone } = await import("@/lib/integrations/cloudflare");
      await expect(getZone()).rejects.toThrow(
        "Cloudflare API error: Unknown error",
      );
    });
  });

  describe("getCloudflareHealth", () => {
    it("should return authenticated status and zone name", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockCfResponse(sampleZone));
      const { getCloudflareHealth } =
        await import("@/lib/integrations/cloudflare");
      const result = await getCloudflareHealth();
      expect(result).toEqual({ authenticated: true, zone: "example.com" });
    });

    it("should propagate errors and log them", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      const { getCloudflareHealth } =
        await import("@/lib/integrations/cloudflare");
      const logger = (await import("@/lib/logger")).default;
      await expect(getCloudflareHealth()).rejects.toThrow("Network error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get Cloudflare health:",
        expect.any(Error),
      );
    });
  });

  describe("getZone", () => {
    it("should return zone details", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockCfResponse(sampleZone));
      const { getZone } = await import("@/lib/integrations/cloudflare");
      expect(await getZone()).toEqual(sampleZone);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("timeout"));
      const { getZone } = await import("@/lib/integrations/cloudflare");
      const logger = (await import("@/lib/logger")).default;
      await expect(getZone()).rejects.toThrow("timeout");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get Cloudflare zone:",
        expect.any(Error),
      );
    });
  });

  describe("getDNSRecords", () => {
    it("should return DNS records array", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockCfResponse(sampleDnsRecords),
      );
      const { getDNSRecords } = await import("@/lib/integrations/cloudflare");
      expect(await getDNSRecords()).toEqual(sampleDnsRecords);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.cloudflare.com/client/v4/zones/test-zone-id/dns_records",
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("DNS error"));
      const { getDNSRecords } = await import("@/lib/integrations/cloudflare");
      await expect(getDNSRecords()).rejects.toThrow("DNS error");
    });
  });

  describe("getSSLStatus", () => {
    it("should return SSL certificate info when universal SSL is enabled and active", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          mockCfResponse({
            enabled: true,
            certificate_authority: "lets_encrypt",
          }),
        )
        .mockResolvedValueOnce(
          mockCfResponse({
            id: "v1",
            status: "active",
            validation_method: "http",
            certificate_status: "active",
          }),
        )
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleZone));
      const { getSSLStatus } = await import("@/lib/integrations/cloudflare");
      const result = await getSSLStatus();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "universal-ssl",
          status: "active",
          type: "universal",
          hosts: ["*.example.com", "example.com"],
        }),
      );
    });

    it("should return pending status when certificate_status is not active", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          mockCfResponse({
            enabled: true,
            certificate_authority: "lets_encrypt",
          }),
        )
        .mockResolvedValueOnce(
          mockCfResponse({
            id: "v1",
            status: "pending",
            validation_method: "http",
            certificate_status: "pending_validation",
          }),
        )
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleZone));
      const { getSSLStatus } = await import("@/lib/integrations/cloudflare");
      const result = await getSSLStatus();
      expect(result[0].status).toBe("pending");
    });

    it("should return empty array when universal SSL is disabled", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          mockCfResponse({
            enabled: false,
            certificate_authority: "lets_encrypt",
          }),
        )
        .mockResolvedValueOnce(
          mockCfResponse({
            id: "v1",
            status: "active",
            validation_method: "http",
            certificate_status: "active",
          }),
        );
      const { getSSLStatus } = await import("@/lib/integrations/cloudflare");
      expect(await getSSLStatus()).toEqual([]);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("SSL error"));
      const { getSSLStatus } = await import("@/lib/integrations/cloudflare");
      await expect(getSSLStatus()).rejects.toThrow("SSL error");
    });
  });

  describe("getZoneAnalytics", () => {
    it("should return analytics data", async () => {
      const analyticsData = {
        requests: { all: 1000, cached: 800, uncached: 200 },
        bandwidth: { all: 5000, cached: 4000, uncached: 1000 },
        threats: { all: 5, type: { block: 3, challenge: 2 } },
      };
      (global.fetch as jest.Mock).mockResolvedValue(
        mockCfResponse(analyticsData),
      );
      const { getZoneAnalytics } =
        await import("@/lib/integrations/cloudflare");
      expect(await getZoneAnalytics()).toEqual(analyticsData);
    });

    it("should handle missing analytics fields with defaults of 0", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockCfResponse({}));
      const { getZoneAnalytics } =
        await import("@/lib/integrations/cloudflare");
      expect(await getZoneAnalytics()).toEqual({
        requests: { all: 0, cached: 0, uncached: 0 },
        bandwidth: { all: 0, cached: 0, uncached: 0 },
        threats: { all: 0, type: {} },
      });
    });

    it("should call analytics endpoint with time range parameters", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockCfResponse({}));
      const { getZoneAnalytics } =
        await import("@/lib/integrations/cloudflare");
      await getZoneAnalytics();
      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchUrl).toContain("/zones/test-zone-id/analytics/dashboard");
      expect(fetchUrl).toContain("since=");
      expect(fetchUrl).toContain("until=");
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Analytics error"),
      );
      const { getZoneAnalytics } =
        await import("@/lib/integrations/cloudflare");
      await expect(getZoneAnalytics()).rejects.toThrow("Analytics error");
    });
  });

  describe("getCloudflareStatusSummary", () => {
    it("should aggregate data from health, zone, DNS, and SSL endpoints", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleDnsRecords))
        .mockResolvedValueOnce(
          mockCfResponse({
            enabled: true,
            certificate_authority: "lets_encrypt",
          }),
        )
        .mockResolvedValueOnce(
          mockCfResponse({
            id: "v1",
            status: "active",
            validation_method: "http",
            certificate_status: "active",
          }),
        )
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleZone));
      const { getCloudflareStatusSummary } =
        await import("@/lib/integrations/cloudflare");
      const result = await getCloudflareStatusSummary();
      expect(result.health).toEqual({
        authenticated: true,
        zone: "example.com",
      });
      expect(result.zone).toEqual({
        status: "active",
        paused: false,
        type: "full",
        nameServers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
      });
      expect(result.dns).toEqual({
        total: 3,
        proxied: 2,
        recordTypes: { A: 1, CNAME: 1, MX: 1 },
      });
      expect(result.ssl.total).toBe(1);
      expect(result.ssl.active).toBe(1);
      expect(result.ssl.certificates).toHaveLength(1);
    });

    it("should report zero expiringSoon for certs expiring more than 30 days out", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleDnsRecords))
        .mockResolvedValueOnce(
          mockCfResponse({
            enabled: true,
            certificate_authority: "lets_encrypt",
          }),
        )
        .mockResolvedValueOnce(
          mockCfResponse({
            id: "v1",
            status: "active",
            validation_method: "http",
            certificate_status: "active",
          }),
        )
        .mockResolvedValueOnce(mockCfResponse(sampleZone))
        .mockResolvedValueOnce(mockCfResponse(sampleZone));
      const { getCloudflareStatusSummary } =
        await import("@/lib/integrations/cloudflare");
      const result = await getCloudflareStatusSummary();
      expect(result.ssl.expiringSoon).toBe(0);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Summary error"));
      const { getCloudflareStatusSummary } =
        await import("@/lib/integrations/cloudflare");
      const logger = (await import("@/lib/logger")).default;
      await expect(getCloudflareStatusSummary()).rejects.toThrow(
        "Summary error",
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
