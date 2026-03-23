export {};

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

describe("GET /api/docs", () => {
  beforeEach(() => {
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

  function createRequest(params: string) {
    return { nextUrl: new URL(`http://localhost:3000/api/docs?${params}`) };
  }

  it("returns file tree when list=true", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("list=true") as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.files).toBeDefined();
    expect(Array.isArray(data.files)).toBe(true);
    // Should include README.md at root
    expect(data.files.some((f: { name: string }) => f.name === "README.md")).toBe(true);
    // Should include docs directory
    expect(data.files.some((f: { name: string; type: string }) => f.name === "docs" && f.type === "directory")).toBe(true);
  });

  it("returns content for root README.md", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("path=README.md") as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBeDefined();
    expect(typeof data.content).toBe("string");
    expect(data.content.length).toBeGreaterThan(0);
  });

  it("returns content for a docs file", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("path=docs/README.md") as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBeDefined();
    expect(data.content).toContain("Documentation");
  });

  it("returns 400 when path is missing", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("") as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing 'path' parameter");
  });

  it("returns 400 for path traversal attempts", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("path=../../etc/passwd") as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  });

  it("returns 400 for paths outside docs/ and README.md", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("path=src/app/page.tsx") as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  });

  it("returns 400 for non-.md files", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("path=docs/images/logo.png") as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  });

  it("returns 404 for non-existent file", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("path=docs/nonexistent.md") as never);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File not found");
  });

  it("converts mermaid code blocks to mermaid.ink img tags", async () => {
    const { GET } = await import("@/app/api/docs/route");
    // diagrams.md contains mermaid code blocks
    const response = await GET(createRequest("path=docs/architecture/diagrams.md") as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should not contain raw mermaid code blocks
    expect(data.content).not.toContain("```mermaid");
    // Should contain mermaid.ink image references
    expect(data.content).toContain("https://mermaid.ink/svg/");
  });

  it("file tree contains only .md files", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(createRequest("list=true") as never);
    const data = await response.json();

    function checkFiles(files: { type: string; name: string; children?: unknown[] }[]) {
      for (const f of files) {
        if (f.type === "file") {
          expect(f.name).toMatch(/\.md$/);
        }
        if (f.type === "directory" && Array.isArray(f.children)) {
          checkFiles(f.children as typeof files);
        }
      }
    }

    checkFiles(data.files);
  });
});
