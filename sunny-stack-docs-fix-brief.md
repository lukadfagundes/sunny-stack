# Docs Page Fix — Claude Code Brief
## Repository: `strawhatluka/sunny-stack`

---

## The Problem

The docs page at `/docs` has two issues that share the same root cause:

1. **Intermittent load failures** — the page sometimes loads content, sometimes doesn't
2. **SEO invisibility** — Googlebot sees only a loading spinner, never the actual documentation content

Both stem from the same architectural issue: `src/app/docs/page.tsx` is a `"use client"` component that fetches content from `/api/docs` via `useEffect` after the page renders in the browser. This means:

- If the API call fails or races, the user sees a blank content area
- Googlebot crawls the HTML shell and finds "Loading..." — the documentation content is never indexed

The fix is to move file reading to the server. The page should be a **server component** that reads markdown files at request time and passes fully rendered content to the client. No fetch calls. No loading states for the main content. No SEO blind spots.

---

## What to Keep Exactly As-Is

Before listing what changes, be explicit about what must not change:

- **All visual layout** — the sidebar, breadcrumbs, content area, responsive mobile toggle. Pixel-perfect identical.
- **`DocNav.tsx`** — the navigation component is already well-structured. It stays `"use client"` and is unchanged.
- **`MermaidDiagram.tsx`** — Mermaid rendering requires the browser (`mermaid` library). It stays `"use client"` and is unchanged.
- **`MarkdownRenderer.tsx`** — stays `"use client"`. It receives content as a prop and renders it. Unchanged.
- **The `/docs` directory and all `.md` files** — source files are untouched.
- **`next.config.ts` `outputFileTracingIncludes`** — already correctly scoped to `./docs/**/*`, `./README.md`, `./CHANGELOG.md`. Do not modify. This config exists specifically because Vercel's file tracing (NFT) does not automatically detect files read via dynamic `fs` operations like `readdirSync` and `readFileSync` at runtime — without this explicit include, Vercel would exclude the `/docs` directory and all `.md` files from the deployment bundle entirely, causing every file read to fail in production. It is the reason `fs` works on Vercel for this route. Leave it exactly as it is.

---

## What Changes

### 1. Create `src/lib/docs.ts` — server-side file utility

Extract the file reading logic currently in `/api/docs/route.ts` into a reusable server utility. This utility will be called directly by the server component instead of going through an HTTP request.

```ts
// src/lib/docs.ts
import fs from 'fs'
import path from 'path'
import type { DocFile } from '@/app/api/docs/route'

const PROJECT_ROOT = process.cwd()

/** Build the file tree from /docs and root .md files */
export function getDocTree(): DocFile[] { ... }

/** Read and return the content of a single .md file by path.
 *  Applies the same security checks as the API route (no path traversal,
 *  only root .md files or docs/ paths). Returns null if invalid or not found. */
export function getDocContent(filePath: string): string | null { ... }

/** Preprocess mermaid code blocks into custom HTML elements */
export function preprocessMermaid(markdown: string): string { ... }
```

Move the `buildTree`, security validation, `preprocessMermaid`, and `readFileSync` logic from `route.ts` into this utility. The API route (`/api/docs/route.ts`) should then call these functions from `docs.ts` rather than containing the logic itself — keeping the route as a thin wrapper.

### 2. Rewrite `src/app/docs/page.tsx` — server component with URL-based navigation

This is the core change. Convert the page from a client component with `useEffect` fetching to a **server component** that:

- Reads the file tree via `getDocTree()` at request time
- Reads the initial file content via `getDocContent()` at request time
- Uses a **URL search parameter** (`?file=path/to/file.md`) to determine which file to display
- Passes the pre-loaded content and file tree as props to a client wrapper component

```tsx
// src/app/docs/page.tsx — server component (no "use client")
import { getDocTree, getDocContent } from '@/lib/docs'
import { DocsClient } from '@/components/docs/DocsClient'
import { buildSections } from '@/components/docs/DocNav'

export default async function DocsPage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>
}) {
  const { file } = await searchParams
  const requestedPath = file ?? 'README.md'

  const tree = getDocTree()
  const content = getDocContent(requestedPath) ?? getDocContent('README.md') ?? ''
  const sections = buildSections(tree)

  return (
    <DocsClient
      sections={sections}
      initialPath={requestedPath}
      initialContent={content}
    />
  )
}
```

**Why URL-based navigation:** Using `?file=` search params is both a reliability improvement and a meaningful SEO upgrade. Each documentation file now has a unique, crawlable URL (`/docs?file=docs/architecture/overview.md`). Googlebot can follow sidebar links between docs and index each file's content individually — rather than seeing one page with "Loading..." for everything. This also means users can bookmark and share direct links to specific documentation pages, which is not possible with the current client-side-only navigation. For a portfolio whose docs page exists specifically to showcase documentation quality, having that content actually indexed by Google is the whole point.

### 3. Create `src/components/docs/DocsClient.tsx` — client wrapper

Extract the interactive parts of the current `docs/page.tsx` into a new client component. This component handles:

- Current path state (initialized from `initialPath` prop)
- Sidebar open/close state
- File navigation (updating URL and fetching new content)
- Breadcrumb rendering
- Passing content to `MarkdownRenderer`

```tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DocNav from './DocNav'
import MarkdownRenderer from './MarkdownRenderer'
import type { NavSection } from './DocNav'

interface DocsClientProps {
  sections: NavSection[]
  initialPath: string
  initialContent: string
}

export function DocsClient({ sections, initialPath, initialContent }: DocsClientProps) {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)

  const loadFile = useCallback(async (filePath: string) => {
    setCurrentPath(filePath)
    setLoading(true)
    router.push(`/docs?file=${encodeURIComponent(filePath)}`, { scroll: false })

    // Fetch content from the existing API route
    const res = await fetch(`/api/docs?path=${encodeURIComponent(filePath)}`)
    const data = await res.json()
    setContent(data.content ?? 'File not found.')
    setLoading(false)
  }, [router])

  // ... rest of the layout: sidebar, breadcrumbs, content area
  // Visually identical to the current page.tsx implementation
}
```

**Note on subsequent navigation:** After the initial server-rendered load, in-page navigation (clicking links in the sidebar) still uses the existing `/api/docs` route to fetch content. This is correct — only the *first* load needs to be server-rendered for SEO and reliability. Subsequent navigation remains fast and client-side.

### 4. Add `generateMetadata` to `docs/page.tsx`

Since the page is now a server component with access to the current file path, add per-file metadata:

```tsx
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>
}) {
  const { file } = await searchParams
  const filePath = file ?? 'README.md'
  const fileName = filePath.split('/').pop()?.replace('.md', '') ?? 'Documentation'
  const title = fileName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title: `${title} — sunny-stack.com Docs`,
    description: `Technical documentation for sunny-stack.com: ${title}`,
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/docs/page.tsx` | Rewrite as server component using `searchParams` + `getDocTree`/`getDocContent` |
| `src/app/api/docs/route.ts` | Refactor to call shared utilities from `src/lib/docs.ts` instead of containing the logic |

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/docs.ts` | Shared server-side file reading utility |
| `src/components/docs/DocsClient.tsx` | Client wrapper extracted from current `page.tsx` |

## Files That Do Not Change

| File | Reason |
|------|--------|
| `src/components/docs/DocNav.tsx` | Already correct, stays `"use client"` |
| `src/components/docs/MarkdownRenderer.tsx` | Already correct, stays `"use client"` |
| `src/components/docs/MermaidDiagram.tsx` | Browser-only, stays `"use client"` |
| `next.config.ts` | `outputFileTracingIncludes` already correctly scoped |
| All files in `/docs/` | Source content is untouched |

---

## Acceptance Criteria

- [ ] `/docs` renders with full markdown content present in the HTML response — verify with `curl https://www.sunny-stack.com/docs` and confirm documentation text is in the response body, not "Loading..."
- [ ] `/docs?file=docs/guides/getting-started.md` (or any valid path) renders the correct file server-side
- [ ] Navigating between files in the sidebar works correctly and updates the URL
- [ ] Mermaid diagrams still render (client-side, unchanged)
- [ ] Code syntax highlighting still renders (client-side, unchanged)
- [ ] Mobile sidebar toggle still works
- [ ] Breadcrumbs still reflect the current file correctly
- [ ] All existing CI checks pass (lint, typecheck, test, build)
- [ ] No visual layout changes — the page looks identical to the current implementation
