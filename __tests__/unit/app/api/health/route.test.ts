/**
 * @file Health Check API Route Unit Tests
 * @description Tests for GET /api/health
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

const { GET } = require("@/app/api/health/route");

describe("GET /api/health", () => {
  it("should return healthy status with 200", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("sunny-stack-api");
    expect(data.timestamp).toBeDefined();
  });

  it("should include ISO timestamp", async () => {
    const response = await GET();
    const data = await response.json();

    // Validate ISO date format
    expect(() => new Date(data.timestamp)).not.toThrow();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });
});
