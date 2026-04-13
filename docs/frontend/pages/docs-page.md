# Documentation Viewer Page

## Overview

An interactive documentation viewer with sidebar file tree navigation, breadcrumb navigation, and markdown rendering. Uses a **server component + client wrapper** architecture: the page reads the file tree and initial content server-side via `src/lib/docs.ts`, then passes it to `DocsClient` for interactive navigation.

**Source:** `src/app/docs/page.tsx` (server component) + `src/components/docs/DocsClient.tsx` (client wrapper)

## Route

`/docs` — accepts `?file={path}` query parameter for direct file access (e.g., `/docs?file=docs/guides/getting-started.md`)

## Rendering Strategy

- **Type:** Async Server Component (no `"use client"` directive on page.tsx)
- **Initial Data:** File tree and content read server-side via `getDocTree()` and `getDocContent()` from `src/lib/docs.ts`
- **Dynamic Metadata:** `generateMetadata()` produces per-file titles (e.g., "Getting Started — sunny-stack.com Docs")
- **Subsequent Navigation:** Client-side fetch to `/api/docs?path={filePath}` + `router.push` for URL updates

## Data Flow

```
Server (page.tsx):
  searchParams.file ?? "README.md"
  |
  +-> getDocTree()    [src/lib/docs.ts]  -> file tree
  +-> getDocContent() [src/lib/docs.ts]  -> initial markdown content
  |
  v
  DocsClient (client component)
    props: { files, initialPath, initialContent }
    |
    +-> buildSections(files)  [DocNav.tsx]  -> NavSection[]
    +-> DocNav (sidebar navigation)
    +-> MarkdownRenderer (content display)

Client navigation:
  User clicks file in sidebar
    -> fetch /api/docs?path={filePath}
    -> router.push('/docs?file={filePath}')
    -> update content state
```

## Component Composition

| Component          | Source                               | Props                                                                               |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `DocsClient`       | `@/components/docs/DocsClient`       | `files: DocFile[]`, `initialPath: string`, `initialContent: string`                 |
| `DocNav`           | `@/components/docs/DocNav`           | `sections: NavSection[]`, `currentPath: string`, `onSelect: (path: string) => void` |
| `MarkdownRenderer` | `@/components/docs/MarkdownRenderer` | `content: string`, `currentPath: string`, `loadFile: (path: string) => void`        |

## State Management (DocsClient)

```typescript
const sections = useMemo(() => buildSections(files), [files]); // Derived from server-provided files
const [currentPath, setCurrentPath] = useState(initialPath); // Currently displayed file path
const [content, setContent] = useState(initialContent); // Current file markdown content
const [loading, setLoading] = useState(false); // Loading indicator (false initially — content pre-loaded)
const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
```

Note: `loading` starts as `false` because the server pre-loads the initial content. No "Loading..." flash on first visit.

## Key Logic

### Server-Side File Reading (page.tsx)

```typescript
const tree = getDocTree();
const content =
  getDocContent(requestedPath) ?? getDocContent("README.md") ?? "";
```

Reads the file tree and requested file content at request time. Falls back to README.md if the requested path is invalid.

### Dynamic Metadata (generateMetadata)

Produces per-file titles by parsing the file path:

- `/docs` → "Readme — sunny-stack.com Docs"
- `/docs?file=docs/guides/getting-started.md` → "Getting Started — sunny-stack.com Docs"

### File Navigation (DocsClient.loadFile)

```typescript
const loadFile = useCallback((filePath: string) => {
  setCurrentPath(filePath);
  setLoading(true);
  setSidebarOpen(false);
  router.push(`/docs?file=${encodeURIComponent(filePath)}`, { scroll: false });
  fetch(`/api/docs?path=${encodeURIComponent(filePath)}`)
    .then(...)
    .catch(...);
}, [router]);
```

Updates the URL via `router.push` (enabling direct URL sharing and browser back/forward) and fetches content from the API route for client-side navigation.

### Breadcrumb Generation

Dynamically generated inline from the navigation sections:

1. Iterates over all sections, their subsections, and subgroups
2. Finds the section/subsection/subgroup containing the current path
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

## Vercel Deployment

`next.config.ts` includes `outputFileTracingIncludes` for the `/docs` route to ensure the `docs/` directory and root `.md` files are bundled in the serverless function. Without this, the `fs` calls in `src/lib/docs.ts` would fail in production.

## Dependencies

- `@/lib/docs` -- `getDocTree()`, `getDocContent()`, `DocFile` type
- `@/components/docs/DocsClient` -- client wrapper component
- `@/components/docs/DocNav` -- `DocNav` component + `buildSections()` utility
- `@/components/docs/MarkdownRenderer` -- Markdown content renderer
- `next/navigation` -- `useRouter` (for URL updates on navigation)
- `lucide-react` -- `ChevronRight`, `Menu`, `X` icons
