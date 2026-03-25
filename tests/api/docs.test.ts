export {};

import path from "path";

// Virtual filesystem for mocking
const PROJECT_ROOT = process.cwd();

const VIRTUAL_FILES: Record<string, string> = {
  [path.join(PROJECT_ROOT, "README.md")]: "# Sunny Stack\n\nProject README content.",
  [path.join(PROJECT_ROOT, "docs", "README.md")]:
    "# Documentation\n\nWelcome to the docs.",
  [path.join(PROJECT_ROOT, "docs", "guides", "getting-started.md")]:
    "# Getting Started\n\nA guide to getting started.",
  [path.join(PROJECT_ROOT, "docs", "architecture", "diagrams.md")]:
    "# Diagrams\n\n```mermaid\ngraph TD\n  A-->B\n```\n\nSome text after.",
  [path.join(PROJECT_ROOT, "docs", "architecture", "diagrams-crlf.md")]:
    "# CRLF Diagrams\r\n\r\n```mermaid\r\ngraph LR\r\n  X-->Y\r\n```\r\n\r\nAfter.",
};

// Build directory entries from virtual files
function virtualReaddirSync(dirPath: string): { name: string; isDirectory: () => boolean; isFile: () => boolean }[] {
  const names = new Set<string>();
  const dirs = new Set<string>();
  const normalDir = dirPath.replace(/\\/g, "/");

  for (const fullPath of Object.keys(VIRTUAL_FILES)) {
    const normalFull = fullPath.replace(/\\/g, "/");
    if (!normalFull.startsWith(normalDir + "/")) continue;
    const rest = normalFull.slice(normalDir.length + 1);
    const firstSegment = rest.split("/")[0];
    if (rest.includes("/")) {
      dirs.add(firstSegment);
    } else {
      names.add(firstSegment);
    }
  }

  const entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[] = [];
  for (const d of dirs) {
    entries.push({ name: d, isDirectory: () => true, isFile: () => false });
  }
  for (const n of names) {
    entries.push({ name: n, isDirectory: () => false, isFile: () => true });
  }
  return entries;
}

jest.mock("fs", () => ({
  readdirSync: (dirPath: string) => virtualReaddirSync(dirPath),
  existsSync: (filePath: string) => {
    const normalized = filePath.replace(/\\/g, "/");
    // Check if it's a file
    for (const key of Object.keys(VIRTUAL_FILES)) {
      if (key.replace(/\\/g, "/") === normalized) return true;
    }
    // Check if it's a directory (any file starts with this path)
    for (const key of Object.keys(VIRTUAL_FILES)) {
      if (key.replace(/\\/g, "/").startsWith(normalized + "/")) return true;
    }
    return false;
  },
  readFileSync: (filePath: string) => {
    const normalized = filePath.replace(/\\/g, "/");
    for (const [key, value] of Object.entries(VIRTUAL_FILES)) {
      if (key.replace(/\\/g, "/") === normalized) return value;
    }
    throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
  },
}));

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
    expect(
      data.files.some(
        (f: { name: string; type: string }) => f.name === "docs" && f.type === "directory",
      ),
    ).toBe(true);
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

  it("converts mermaid code blocks to custom HTML elements for client-side rendering", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(
      createRequest("path=docs/architecture/diagrams.md") as never,
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).not.toContain("```mermaid");
    expect(data.content).toContain("<mermaid-diagram");
    expect(data.content).toContain("data-chart=");
  });

  it("converts mermaid code blocks with CRLF line endings", async () => {
    const { GET } = await import("@/app/api/docs/route");
    const response = await GET(
      createRequest("path=docs/architecture/diagrams-crlf.md") as never,
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).not.toContain("```mermaid");
    expect(data.content).toContain("<mermaid-diagram");
    expect(data.content).toContain("data-chart=");
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
