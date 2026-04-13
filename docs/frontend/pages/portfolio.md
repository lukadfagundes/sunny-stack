# Portfolio Page

## Overview

Displays portfolio projects organized by category with expandable project cards. Client component with accordion-style expand/collapse behavior where only one card can be expanded at a time. Categories render in order: Contributions, Professional, Personal.

**Source:** `src/app/portfolio/page.tsx`

## Route

`/portfolio`

## Rendering Strategy

- **Type:** Client Component (`"use client"`)
- **Metadata:** Page-specific title and description exported from `src/app/portfolio/layout.tsx`
- **Data Source:** Static data from `getProjectsByCategory()` -- no API calls, no server-side data fetching

## Data Flow

```
CATEGORIES array ["contribution", "professional", "personal"]
  |
  v (for each category)
getProjectsByCategory(category) [src/lib/data/projects.ts]
  |
  v
PortfolioPage
  |
  +-> CategorySection (per category)
      +-> ProjectCard (per project in category)
```

## Component Composition

| Component         | Source                                   | Props                                                                 |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `CategorySection` | `@/components/portfolio/CategorySection` | `category: ProjectCategory`, `children: ReactNode`                    |
| `ProjectCard`     | `@/components/portfolio/ProjectCard`     | `project: ProjectData`, `isExpanded: boolean`, `onToggle: () => void` |

## State Management

```typescript
const [expandedId, setExpandedId] = useState<string | null>(null);
```

- Tracks which project card is currently expanded
- Only one project card can be expanded at a time
- Toggling an already-expanded card collapses it (sets to `null`)
- Toggling a different card expands it and collapses the previous one

## Key Logic

### Category Iteration

```typescript
const CATEGORIES: ProjectCategory[] = [
  "contribution",
  "professional",
  "personal",
];
```

Iterates over all three categories in fixed order: Contributions first (open-source PRs), then Professional, then Personal. Categories with no projects are skipped via `if (projects.length === 0) return null`.

### Accordion Behavior

```typescript
onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
```

Each `ProjectCard` receives `isExpanded={expandedId === project.id}` for conditional rendering of expanded content.

### Page Title

Renders a gold-colored "Portfolio" heading using the `font-display` font family at `text-4xl sm:text-5xl` sizing.

## Dependencies

- `@/lib/data/projects` -- `getProjectsByCategory()`
- `@/lib/data/types` -- `ProjectCategory` type
- `@/components/portfolio/CategorySection`
- `@/components/portfolio/ProjectCard`
