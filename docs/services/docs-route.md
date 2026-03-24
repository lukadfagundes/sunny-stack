# Docs Route

## Overview

Serves project documentation with two modes: a file tree listing for sidebar navigation and markdown content retrieval with Mermaid diagram preprocessing. Reads files from the local filesystem at runtime. Includes path traversal security protections.

**Source:** `src/app/api/docs/route.ts` (127 lines)

## Endpoint

`GET /api/docs`

### Mode 1: File Tree Listing

`GET /api/docs?list=true`

Returns a recursive tree of all `.md` files in the `docs/` directory plus root-level files (`README.md`, `CHANGELOG.md`).

### Mode 2: File Content

`GET /api/docs?path={filePath}`

Returns the content of a specific markdown file with Mermaid code blocks converted to custom HTML markers for client-side rendering.

## Authentication

None required. This is a public endpoint.

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list` | string | No | Set to `"true"` to get file tree |
| `path` | string | No | File path relative to project root (e.g., `docs/api/README.md` or `README.md`) |

## Response Types

### `DocFile` (exported)

```typescript
interface DocFile {
  name: string;           // File or directory name
  path: string;           // Relative path from project root
  type: "file" | "directory";
  children?: DocFile[];   // Subdirectories and files (only for directories)
}
```

### List Mode Response

```json
{
  "files": [
    { "name": "README.md", "path": "README.md", "type": "file" },
    { "name": "CHANGELOG.md", "path": "CHANGELOG.md", "type": "file" },
    {
      "name": "docs",
      "path": "docs",
      "type": "directory",
      "children": []
    }
  ]
}
```

### Content Mode Response

```json
{ "content": "# Markdown content here..." }
```

## Implementation Details

### `buildTree(dirPath: string, relativeTo: string): DocFile[]`

Recursive directory scanner that:
1. Reads directory entries with `fs.readdirSync` using `withFileTypes: true`
2. For directories: recursively builds child tree
3. For files: only includes `.md` files
4. Sorts results: directories first, then files, alphabetically within each group

### `preprocessMermaid(markdown: string): string`

Converts fenced Mermaid code blocks into custom HTML elements for client-side rendering:

1. Matches fenced mermaid code blocks via regex (`` ```mermaid ... ``` ``)
2. Base64-encodes the trimmed diagram code
3. Replaces the code block with `<mermaid-diagram data-chart="{base64}"></mermaid-diagram>`

The `MarkdownRenderer` component detects these custom elements (via `rehype-raw`) and renders them client-side using the `MermaidDiagram` component, which calls `mermaid.render()` in the browser. This avoids font mismatch issues that occurred with server-side rendering via external services.

### Security Protections

Four layers of path validation:

1. **Path traversal block:** Rejects any path containing `".."`
2. **Directory restriction:** Only allows root-level files (`README.md`, `CHANGELOG.md`) or paths starting with `docs/`
3. **File type restriction:** Only allows `.md` file extensions
4. **Resolution check:** Verifies the resolved absolute path starts with the project root via `path.resolve()`

## Error Handling

| Condition | Status | Response |
|-----------|--------|----------|
| Missing `path` parameter (non-list mode) | 400 | `{ error: "Missing 'path' parameter" }` |
| Path contains `".."` | 400 | `{ error: "Invalid path" }` |
| Path not in allowed locations | 400 | `{ error: "Invalid path" }` |
| Path doesn't end in `.md` | 400 | `{ error: "Invalid path" }` |
| Resolved path escapes project root | 400 | `{ error: "Invalid path" }` |
| File not found | 404 | `{ error: "File not found" }` |

## Dependencies

- **Node.js:** `fs` (readFileSync, readdirSync, existsSync), `path` (join, relative, resolve)
- **Next.js:** `NextRequest`, `NextResponse` from `next/server`
- **Client-side:** Mermaid diagrams are rendered in the browser by the `MermaidDiagram` component (no external service dependency)

## Usage

Consumed by the Docs page (`src/app/docs/page.tsx`) which uses both modes: file tree for sidebar navigation and file content for the main viewer.

```typescript
// Fetch file tree
const treeRes = await fetch("/api/docs?list=true");
const { files } = await treeRes.json();

// Fetch specific file
const contentRes = await fetch("/api/docs?path=docs/api/README.md");
const { content } = await contentRes.json();
```
