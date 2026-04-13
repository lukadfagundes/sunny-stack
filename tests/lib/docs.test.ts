import path from "path";

const PROJECT_ROOT = process.cwd();

const VIRTUAL_FILES: Record<string, string> = {
  [path.join(PROJECT_ROOT, "README.md")]:
    "# Sunny Stack\n\nProject README content.",
  [path.join(PROJECT_ROOT, "docs", "README.md")]:
    "# Documentation\n\nWelcome to the docs.",
  [path.join(PROJECT_ROOT, "docs", "guides", "getting-started.md")]:
    "# Getting Started\n\nA guide to getting started.",
  [path.join(PROJECT_ROOT, "docs", "architecture", "diagrams.md")]:
    "# Diagrams\n\n```mermaid\ngraph TD\n  A-->B\n```\n\nSome text after.",
  [path.join(PROJECT_ROOT, "docs", "architecture", "diagrams-crlf.md")]:
    "# CRLF Diagrams\r\n\r\n```mermaid\r\ngraph LR\r\n  X-->Y\r\n```\r\n\r\nAfter.",
};

function virtualReaddirSync(
  dirPath: string,
): { name: string; isDirectory: () => boolean; isFile: () => boolean }[] {
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

  const entries: {
    name: string;
    isDirectory: () => boolean;
    isFile: () => boolean;
  }[] = [];
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
    for (const key of Object.keys(VIRTUAL_FILES)) {
      if (key.replace(/\\/g, "/") === normalized) return true;
    }
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

describe("getDocTree", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns root files and docs directory", async () => {
    const { getDocTree } = await import("@/lib/docs");
    const tree = getDocTree();

    expect(Array.isArray(tree)).toBe(true);
    expect(tree.some((f) => f.name === "README.md")).toBe(true);
    expect(tree.some((f) => f.name === "docs" && f.type === "directory")).toBe(
      true,
    );
  });

  it("contains only .md files", async () => {
    const { getDocTree } = await import("@/lib/docs");
    const tree = getDocTree();

    function checkFiles(
      files: { type: string; name: string; children?: unknown[] }[],
    ) {
      for (const f of files) {
        if (f.type === "file") {
          expect(f.name).toMatch(/\.md$/);
        }
        if (f.type === "directory" && Array.isArray(f.children)) {
          checkFiles(f.children as typeof files);
        }
      }
    }

    checkFiles(tree);
  });
});

describe("getDocContent", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("reads root README.md", async () => {
    const { getDocContent } = await import("@/lib/docs");
    const content = getDocContent("README.md");
    expect(content).toBeDefined();
    expect(typeof content).toBe("string");
    expect(content!.length).toBeGreaterThan(0);
  });

  it("reads docs files", async () => {
    const { getDocContent } = await import("@/lib/docs");
    const content = getDocContent("docs/README.md");
    expect(content).toContain("Documentation");
  });

  it("returns null for path traversal", async () => {
    const { getDocContent } = await import("@/lib/docs");
    expect(getDocContent("../../etc/passwd")).toBeNull();
  });

  it("returns null for paths outside docs/ and root files", async () => {
    const { getDocContent } = await import("@/lib/docs");
    expect(getDocContent("src/app/page.tsx")).toBeNull();
  });

  it("returns null for non-.md files", async () => {
    const { getDocContent } = await import("@/lib/docs");
    expect(getDocContent("docs/images/logo.png")).toBeNull();
  });

  it("returns null for non-existent files", async () => {
    const { getDocContent } = await import("@/lib/docs");
    expect(getDocContent("docs/nonexistent.md")).toBeNull();
  });
});

describe("preprocessMermaid", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("converts mermaid code blocks to custom HTML elements", async () => {
    const { preprocessMermaid } = await import("@/lib/docs");
    const input = "# Title\n\n```mermaid\ngraph TD\n  A-->B\n```\n\nAfter.";
    const output = preprocessMermaid(input);

    expect(output).not.toContain("```mermaid");
    expect(output).toContain("<mermaid-diagram");
    expect(output).toContain("data-chart=");
  });

  it("converts mermaid blocks with CRLF line endings", async () => {
    const { preprocessMermaid } = await import("@/lib/docs");
    const input =
      "# Title\r\n\r\n```mermaid\r\ngraph LR\r\n  X-->Y\r\n```\r\n\r\nAfter.";
    const output = preprocessMermaid(input);

    expect(output).not.toContain("```mermaid");
    expect(output).toContain("<mermaid-diagram");
  });

  it("passes through markdown without mermaid blocks unchanged", async () => {
    const { preprocessMermaid } = await import("@/lib/docs");
    const input = "# Title\n\nSome regular markdown.";
    expect(preprocessMermaid(input)).toBe(input);
  });
});
