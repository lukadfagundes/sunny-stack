import { NextRequest, NextResponse } from "next/server";
import { getDocTree, getDocContent } from "@/lib/docs";

// Re-export DocFile for backwards compatibility
export type { DocFile } from "@/lib/docs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const list = searchParams.get("list");
  const filePath = searchParams.get("path");

  // List mode: return file tree
  if (list === "true") {
    return NextResponse.json({ files: getDocTree() });
  }

  // Read mode: return file content
  if (!filePath) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 },
    );
  }

  const content = getDocContent(filePath);

  if (content === null) {
    // Determine appropriate error
    if (filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const isRootFile = filePath === "README.md" || filePath === "CHANGELOG.md";
    const isDocsFile = filePath.startsWith("docs/");
    if (!isRootFile && !isDocsFile) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    if (!filePath.endsWith(".md")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ content });
}
