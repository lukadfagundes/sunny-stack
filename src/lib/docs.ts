import fs from "fs";
import path from "path";

export interface DocFile {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: DocFile[];
}

const PROJECT_ROOT = process.cwd();

function buildTree(dirPath: string, relativeTo: string): DocFile[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const result: DocFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: relPath,
        type: "directory",
        children: buildTree(fullPath, relativeTo),
      });
    } else if (entry.name.endsWith(".md")) {
      result.push({ name: entry.name, path: relPath, type: "file" });
    }
  }

  // Sort: directories first, then files, alphabetically within each group
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

/** Build the file tree from /docs and root .md files */
export function getDocTree(): DocFile[] {
  const docsDir = path.join(PROJECT_ROOT, "docs");
  const tree: DocFile[] = [];

  // Add root-level files
  for (const rootFile of ["README.md", "CHANGELOG.md"]) {
    const filePath = path.join(PROJECT_ROOT, rootFile);
    if (fs.existsSync(filePath)) {
      tree.push({ name: rootFile, path: rootFile, type: "file" });
    }
  }

  // Add docs directory
  if (fs.existsSync(docsDir)) {
    tree.push({
      name: "docs",
      path: "docs",
      type: "directory",
      children: buildTree(docsDir, PROJECT_ROOT),
    });
  }

  return tree;
}

/**
 * Read and return the content of a single .md file by path.
 * Applies security checks (no path traversal, only root .md files or docs/ paths).
 * Returns null if invalid or not found.
 */
export function getDocContent(filePath: string): string | null {
  // Block path traversal
  if (filePath.includes("..")) return null;

  // Only allow root-level files or files within docs/
  const isRootFile = filePath === "README.md" || filePath === "CHANGELOG.md";
  const isDocsFile = filePath.startsWith("docs/");
  if (!isRootFile && !isDocsFile) return null;

  // Only allow .md files
  if (!filePath.endsWith(".md")) return null;

  const resolved = path.resolve(PROJECT_ROOT, filePath);

  // Double-check resolved path stays within project
  if (!resolved.startsWith(PROJECT_ROOT)) return null;

  if (!fs.existsSync(resolved)) return null;

  const raw = fs.readFileSync(resolved, "utf-8");
  return preprocessMermaid(raw);
}

/** Replace ```mermaid code blocks with custom HTML elements for client-side rendering */
export function preprocessMermaid(markdown: string): string {
  return markdown.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (_, diagram: string) => {
      const encoded = Buffer.from(diagram.trim()).toString("base64");
      return `<mermaid-diagram data-chart="${encoded}"></mermaid-diagram>`;
    },
  );
}
