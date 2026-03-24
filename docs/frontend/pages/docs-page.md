# Documentation Viewer Page

## Overview

An interactive documentation viewer with a sidebar file tree navigation, breadcrumb navigation, and markdown rendering. Client component that fetches the documentation file tree and individual file contents from the `/api/docs` endpoint.

**Source:** `src/app/docs/page.tsx` (151 lines)

## Route

`/docs`

## Rendering Strategy

- **Type:** Client Component (`"use client"`)
- **Data Fetching:** Fetch-based via `/api/docs` endpoint (file tree + content)

## Data Flow

```
On mount:
  Promise.all([
    GET /api/docs?list=true   -> file tree (sidebar)
    GET /api/docs?path=README.md -> initial content
  ])

On navigation:
  GET /api/docs?path={filePath} -> updated content

DocsPage
  |
  +-> DocNav (sidebar navigation)
  |     built from: buildSections(files)
  |
  +-> MarkdownRenderer (content display)
```

## Component Composition

| Component | Source | Props |
|-----------|--------|-------|
| `DocNav` | `@/components/docs/DocNav` | `sections: NavSection[]`, `currentPath: string`, `onSelect: (path: string) => void` |
| `MarkdownRenderer` | `@/components/docs/MarkdownRenderer` | `content: string`, `currentPath: string`, `loadFile: (path: string) => void` |

Also uses the `buildSections()` utility function exported from `DocNav` to transform the flat file tree into hierarchical navigation sections.

## State Management

```typescript
const [files, setFiles] = useState<DocFile[]>([]);          // File tree data from API
const [currentPath, setCurrentPath] = useState("README.md"); // Currently displayed file path
const [content, setContent] = useState("");                   // Current file markdown content
const [loading, setLoading] = useState(true);                // Loading indicator
const [sidebarOpen, setSidebarOpen] = useState(false);       // Mobile sidebar toggle
```

## Key Logic

### Initial Load (useEffect on mount)

Fetches both the file tree and README.md content in parallel via `Promise.all`. On success, populates `files` and `content` state. On failure, sets empty files and error message.

### File Navigation (loadFile -- useCallback)

```typescript
const loadFile = useCallback((filePath: string) => {
  setCurrentPath(filePath);
  setLoading(true);
  setSidebarOpen(false);
  fetch(`/api/docs?path=${encodeURIComponent(filePath)}`)
    .then(res => res.json())
    .then(data => { setContent(data.content ?? "File not found."); setLoading(false); })
    .catch(() => { setContent("Failed to load file."); setLoading(false); });
}, []);
```

Wrapped in `useCallback` with empty dependency array for stable reference. Closes the mobile sidebar on each navigation.

### Breadcrumb Generation

Dynamically generated inline from the navigation sections:
1. Iterates over all sections and their subsections
2. Finds the section/subsection containing the current path
3. Builds breadcrumb array: `[section label] > [subsection label] > [filename]`
4. Falls back to just the filename if not found in any section
5. Last crumb is highlighted in gold; earlier crumbs are muted

Uses `ChevronRight` icon from lucide-react as the separator.

### Responsive Sidebar

- **Mobile:** Hidden by default; toggle button shows `Menu` or `X` icon
- **Desktop:** Always visible, sticky positioned (`md:sticky md:top-24`) with scroll overflow (`md:max-h-[calc(100vh-8rem)] md:overflow-y-auto`)

### Layout

```
md:grid-cols-[260px_1fr]
```
- Sidebar: 260px fixed width on medium+ screens
- Content area: fluid remaining space with padding and rounded border

## Dependencies

- `@/app/api/docs/route` -- `DocFile` type
- `@/components/docs/DocNav` -- `DocNav` component + `buildSections()` utility
- `@/components/docs/MarkdownRenderer` -- Markdown content renderer
- `lucide-react` -- `ChevronRight`, `Menu`, `X` icons
- `react` -- `useState`, `useEffect`, `useCallback`
