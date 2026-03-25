import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface DocFile {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: DocFile[];
}

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

/** Replace ```mermaid code blocks with custom HTML elements for client-side rendering */
function preprocessMermaid(markdown: string): string {
  return markdown.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (_, diagram: string) => {
      const encoded = Buffer.from(diagram.trim()).toString("base64");
      return `<mermaid-diagram data-chart="${encoded}"></mermaid-diagram>`;
    }
  );
}

export async function GET(request: NextRequest) {
  const projectRoot = process.cwd();
  const { searchParams } = request.nextUrl;
  const list = searchParams.get("list");
  const filePath = searchParams.get("path");

  // List mode: return file tree
  if (list === "true") {
    const docsDir = path.join(projectRoot, "docs");
    const tree: DocFile[] = [];

    // Add root-level files
    for (const rootFile of ["README.md", "CHANGELOG.md"]) {
      const filePath = path.join(projectRoot, rootFile);
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
        children: buildTree(docsDir, projectRoot),
      });
    }

    return NextResponse.json({ files: tree });
  }

  // Read mode: return file content
  if (!filePath) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 }
    );
  }

  // Security: block path traversal
  if (filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Only allow root-level files or files within docs/
  const isRootFile = filePath === "README.md" || filePath === "CHANGELOG.md";
  const isDocsFile = filePath.startsWith("docs/");

  if (!isRootFile && !isDocsFile) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Only allow .md files
  if (!filePath.endsWith(".md")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const resolved = path.resolve(projectRoot, filePath);

  // Double-check resolved path stays within project
  if (!resolved.startsWith(projectRoot)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  const content = preprocessMermaid(raw);
  return NextResponse.json({ content });
}
