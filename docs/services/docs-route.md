# Docs Route

## Overview

Thin API wrapper that serves project documentation via two modes: a file tree listing for sidebar navigation and markdown content retrieval. Delegates all file reading and processing to `src/lib/docs.ts`. Used by `DocsClient` for client-side navigation after the initial server-rendered page load.

**Source:** `src/app/api/docs/route.ts`
**Shared logic:** `src/lib/docs.ts` (file tree building, content reading, Mermaid preprocessing, security checks)

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

| Parameter | Type   | Required | Description                                                                    |
| --------- | ------ | -------- | ------------------------------------------------------------------------------ |
| `list`    | string | No       | Set to `"true"` to get file tree                                               |
| `path`    | string | No       | File path relative to project root (e.g., `docs/api/README.md` or `README.md`) |

## Response Types

### `DocFile` (re-exported from `@/lib/docs`)

```typescript
interface DocFile {
  name: string; // File or directory name
  path: string; // Relative path from project root
  type: "file" | "directory";
  children?: DocFile[]; // Subdirectories and files (only for directories)
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

The route handler is a thin wrapper that delegates to two functions from `src/lib/docs.ts`:

- **`getDocTree()`** — Returns the complete file tree. Called when `list=true`.
- **`getDocContent(filePath)`** — Reads and returns a single file's content with Mermaid preprocessing. Returns `null` for invalid/missing paths.

When `getDocContent()` returns `null`, the route determines the appropriate HTTP error (400 or 404) by checking the path validation rules inline.

### Security Protections (in `src/lib/docs.ts`)

Four layers of path validation:

1. **Path traversal block:** Rejects any path containing `".."`
2. **Directory restriction:** Only allows root-level files (`README.md`, `CHANGELOG.md`) or paths starting with `docs/`
3. **File type restriction:** Only allows `.md` file extensions
4. **Resolution check:** Verifies the resolved absolute path starts with the project root via `path.resolve()`

### Mermaid Preprocessing (in `src/lib/docs.ts`)

Converts fenced Mermaid code blocks into custom HTML elements:

1. Matches fenced mermaid code blocks via regex (` ```mermaid ... ``` `)
2. Base64-encodes the trimmed diagram code
3. Replaces the code block with `<mermaid-diagram data-chart="{base64}"></mermaid-diagram>`

The `MarkdownRenderer` component detects these custom elements (via `rehype-raw`) and renders them client-side using the `MermaidDiagram` component.

## Error Handling

| Condition                                | Status | Response                                |
| ---------------------------------------- | ------ | --------------------------------------- |
| Missing `path` parameter (non-list mode) | 400    | `{ error: "Missing 'path' parameter" }` |
| Path contains `".."`                     | 400    | `{ error: "Invalid path" }`             |
| Path not in allowed locations            | 400    | `{ error: "Invalid path" }`             |
| Path doesn't end in `.md`                | 400    | `{ error: "Invalid path" }`             |
| File not found                           | 404    | `{ error: "File not found" }`           |

## Dependencies

- **`@/lib/docs`** — `getDocTree()`, `getDocContent()`, `DocFile` type
- **Next.js:** `NextRequest`, `NextResponse` from `next/server`

## Usage

Used by `DocsClient` for client-side file navigation after the initial server render. The `/docs` page itself reads files directly via `src/lib/docs.ts` at request time.

```typescript
// Fetch file tree (used by DocsClient on client-side navigation)
const treeRes = await fetch("/api/docs?list=true");
const { files } = await treeRes.json();

// Fetch specific file
const contentRes = await fetch("/api/docs?path=docs/api/README.md");
const { content } = await contentRes.json();
```
