# DocNav

## Overview

`DocNav` is a client-side hierarchical navigation sidebar for the documentation viewer. It takes a structured list of navigation sections (built from the flat file tree returned by the docs API), renders them as collapsible accordion sections with icons, and highlights the currently active document. Sections auto-expand to reveal the current document path and support manual toggle overrides that reset on navigation.

**Source:** `src/components/docs/DocNav.tsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sections` | `NavSection[]` | Yes | Structured navigation sections to render. Built by `buildSections()`. |
| `currentPath` | `string` | Yes | The file path of the currently displayed document. Used for active highlighting and auto-expansion. |
| `onSelect` | `(path: string) => void` | Yes | Callback invoked when a document item is clicked. Receives the file path. |

## Exported Types

### `NavSubgroup`

```typescript
interface NavSubgroup {
  id: string;
  label: string;
  items: { path: string; label: string }[];
}
```

### `NavSubsection`

```typescript
interface NavSubsection {
  id: string;
  label: string;
  items: { path: string; label: string }[];
  subgroups?: NavSubgroup[];     // 3rd-level groups (e.g., component categories)
}
```

### `NavSection`

```typescript
interface NavSection {
  id: string;                    // Unique section identifier
  label: string;                 // Display label
  icon: React.ReactNode;         // Lucide icon element
  items: {                       // Direct file items
    path: string;
    label: string;
  }[];
  subsections?: NavSubsection[]; // Nested subsection groups
}
```

## Exported Utility Functions

### `formatName(filename: string): string`

Converts a filename to a human-readable title:
1. Strips `.md` extension.
2. Converts ADR prefixes: `ADR-001-title` becomes `ADR-001: Title`.
3. Replaces hyphens with spaces.
4. Capitalizes the first letter of each word.

**Examples:**
- `"getting-started.md"` -> `"Getting Started"`
- `"ADR-001-api-design.md"` -> `"ADR-001: Api Design"`

### `buildSections(files: DocFile[]): NavSection[]`

Converts the flat file tree from the docs API into structured `NavSection[]`:

1. **Root files:** All root-level files (`README.md`, `CHANGELOG.md`) are collected into an "Overview" section with a `Home` icon.
2. **Docs directory:** Processes the `docs/` directory's children.
3. **Docs README:** Appends the docs hub README to the Overview section as "Docs Hub".
4. **Subdirectories:** Each subdirectory becomes a section. Known directories get custom labels and icons:

| Directory | Label | Icon |
|-----------|-------|------|
| `api` | API | `Code2` |
| `architecture` | Architecture | `Layers` |
| `deployment` | Deployment | `Rocket` |
| `guides` | Guides | `Compass` |
| `reference` | Reference | `Library` |
| (other) | Formatted name | `BookOpen` |

5. **Files in subdirectories** become section items.
6. **Nested directories** become subsections with their own items.
7. **Deeply nested directories** (3rd level, e.g., `docs/frontend/components/about/`) become subgroups within their parent subsection, each with its own collapsible group of items.

### `getAutoExpanded(sections: NavSection[], path: string): Set<string>`

Computes which section/subsection/subgroup IDs should be expanded to reveal the current document path:
1. Iterates all sections, their subsections, and their subgroups.
2. Adds section IDs, subsection IDs, and subgroup IDs that contain an item matching the given path.
3. If no matches found, defaults to expanding the first section.

## State Management

| Hook | Variable | Type | Initial | Description |
|------|----------|------|---------|-------------|
| `useState` | `overrides` | `{ path: string; toggled: Set<string> }` | `{ path: currentPath, toggled: new Set() }` | Manual toggle overrides, keyed by current path to auto-reset on navigation. |

### Memoized Computations

| Variable | Hook | Dependencies | Description |
|----------|------|--------------|-------------|
| `autoExpanded` | `useMemo` | `[sections, currentPath]` | The set of section IDs that should be auto-expanded for the current path. |
| `expanded` | `useMemo` | `[autoExpanded, overrides, currentPath]` | Effective expanded set: starts from `autoExpanded`, then XORs manual toggle overrides. If `overrides.path !== currentPath`, overrides are ignored (reset on navigation). |

## Event Handlers

| Handler | Element | Description |
|---------|---------|-------------|
| `toggle(id)` | Section, subsection, and subgroup header buttons | XOR-toggles the given ID in the overrides set. Resets overrides if navigation has changed since last toggle. |
| `onSelect(path)` | Document item buttons | Calls the `onSelect` prop with the file path. |

## Render Structure

```
<nav aria-label="Documentation navigation">
  For each section:
    |-- Section header button (icon + label + chevron)
    |   Active sections highlighted in sunny-gold
    |
    |-- If expanded:
        |-- Border-left indented container
        |-- File items (FileText icon + label)
        |   Active item has sunny-surface-light bg + sunny-gold text
        |
        |-- For each subsection:
            |-- Subsection header button (chevron + label)
            |-- If expanded:
                |-- Deeper border-left indented container
                |-- File items (smaller text, FileText icon + label)
                |
                |-- For each subgroup (3rd level):
                    |-- Subgroup header button (chevron + label, text-xs)
                    |-- If expanded:
                        |-- Deepest border-left indented container
                        |-- File items (text-xs, smallest FileText icon)
```

## Child Components

| Component | Source | Description |
|-----------|--------|-------------|
| `ChevronRight`, `ChevronDown` | `lucide-react` | Expand/collapse indicators. |
| `FileText` | `lucide-react` | Document item icon. |
| `Home`, `BookOpen`, `Code2`, `Layers`, `Rocket`, `Compass`, `Library` | `lucide-react` | Section icons. |

## Data Sources

| Source | Type | Description |
|--------|------|-------------|
| `sections` prop | `NavSection[]` | Pre-built navigation structure (typically from `buildSections()`). |
| `currentPath` prop | `string` | Current document path for active state tracking. |
| `DocFile` type | `@/app/api/docs/route` | Type import for the docs API file tree structure. |

## Styling

- Uses Tailwind theme colors: `sunny-gold`, `sunny-cream`, `sunny-cream-muted`, `sunny-surface-light`.
- Section headers have hover backgrounds and transition colors.
- Active sections/items are highlighted with `sunny-gold` text.
- Active items additionally get a `sunny-surface-light` background.
- Nested levels use left borders (`border-l`) for visual hierarchy.
- Subsection items use smaller text (`text-xs`) than top-level items (`text-sm`).
- All interactive elements have proper `truncate` overflow handling.

## Usage

```tsx
import DocNav, { buildSections } from "@/components/docs/DocNav";

const sections = buildSections(fileTree);

<DocNav
  sections={sections}
  currentPath="docs/guides/getting-started.md"
  onSelect={(path) => loadDocument(path)}
/>
```

## Integration Points

- Used in the `/docs` page alongside `MarkdownRenderer`.
- Receives its `sections` data from calling `buildSections()` with the file tree returned by `/api/docs`.
- The `onSelect` callback typically triggers the parent to fetch and display the selected document's content.
- Auto-expansion ensures the current document is always visible in the nav tree.
