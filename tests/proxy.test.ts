export {};

const mockNext = jest.fn(() => ({ type: "next" }));
const mockJson = jest.fn(
  (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
    type: "json",
    body,
    status: init?.status,
    headers: init?.headers,
  })
);

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: mockNext,
    json: mockJson,
  },
}));

function createMockRequest(pathname: string, ip?: string) {
  const headers = new Map<string, string>();
  if (ip) headers.set("x-forwarded-for", ip);

  return {
    nextUrl: { pathname },
    headers: {
      get: (key: string) => headers.get(key) ?? null,
    },
  };
}

describe("rate limiting proxy", () => {
  beforeEach(() => {
    jest.resetModules();
    mockNext.mockClear();
    mockJson.mockClear();
    jest.mock("next/server", () => ({
      NextRequest: jest.fn(),
      NextResponse: {
        next: mockNext,
        json: mockJson,
      },
    }));
  });

  it("passes through non-API routes without rate limiting", async () => {
    const { proxy } = await import("@/proxy");
    const request = createMockRequest("/about");

    proxy(request as never);

    expect(mockNext).toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalled();
  });

  it("allows API requests under the limit", async () => {
    const { proxy } = await import("@/proxy");
    const request = createMockRequest("/api/github", "1.2.3.4");

    proxy(request as never);

    expect(mockNext).toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalled();
  });

  it("blocks API requests over 30/minute with 429", async () => {
    const { proxy } = await import("@/proxy");

    for (let i = 0; i < 31; i++) {
      mockNext.mockClear();
      mockJson.mockClear();
      const request = createMockRequest("/api/github", "10.0.0.1");
      proxy(request as never);
    }

    expect(mockJson).toHaveBeenCalledWith(
      { error: "Too many requests" },
      expect.objectContaining({ status: 429 })
    );
  });

  it("tracks different IPs independently", async () => {
    const { proxy } = await import("@/proxy");

    for (let i = 0; i < 31; i++) {
      proxy(createMockRequest("/api/github", "10.0.0.1") as never);
    }

    mockNext.mockClear();
    mockJson.mockClear();
    proxy(createMockRequest("/api/github", "10.0.0.2") as never);

    expect(mockNext).toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalled();
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", async () => {
    const { proxy } = await import("@/proxy");

    const headers = new Map<string, string>();
    headers.set("x-real-ip", "192.168.1.1");

    const request = {
      nextUrl: { pathname: "/api/test" },
      headers: { get: (key: string) => headers.get(key) ?? null },
    };

    proxy(request as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("falls back to unknown when no IP headers present", async () => {
    const { proxy } = await import("@/proxy");

    const request = {
      nextUrl: { pathname: "/api/test" },
      headers: { get: () => null },
    };

    proxy(request as never);
    expect(mockNext).toHaveBeenCalled();
  });
});
