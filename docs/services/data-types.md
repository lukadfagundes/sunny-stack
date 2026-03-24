# Portfolio Data Types

## Overview

Shared TypeScript type definitions for the portfolio project data model. Pure TypeScript with no React imports. Used by `projects.ts` and the Portfolio page components.

**Source:** `src/lib/data/types.ts` (30 lines)

## Exports

### Types

#### `ProjectCategory`

```typescript
type ProjectCategory = "professional" | "personal" | "contribution";
```

Union type representing the three project categories.

### Interfaces

#### `ProjectLink`

```typescript
interface ProjectLink {
  label: string; // Display text (e.g., "GitHub", "Live App", "Download")
  url: string;   // Full URL
}
```

#### `ProjectFeature`

```typescript
interface ProjectFeature {
  label: string;       // Feature name/title
  description: string; // Feature description
}
```

#### `ProjectData`

```typescript
interface ProjectData {
  id: string;                                     // Unique project identifier (kebab-case)
  title: string;                                  // Display title
  tagline: string;                                // One-line summary
  description: string;                            // Full description
  category: ProjectCategory;                      // "professional" | "personal" | "contribution"
  techStack: string[];                            // Technology names
  features: ProjectFeature[];                     // Key features list
  links: ProjectLink[];                           // External links
  status: "active" | "archived" | "proprietary";  // Current project status
  footer?: string;                                // Optional additional context
}
```

## Dependencies

- No external dependencies

## Usage

```typescript
import type { ProjectData, ProjectCategory, ProjectLink, ProjectFeature } from "@/lib/data/types";
```

## Consumers

- `src/lib/data/projects.ts` -- Uses `ProjectData` and `ProjectCategory` for the project catalog
- `src/app/portfolio/page.tsx` -- Imports `ProjectCategory` for category iteration
- `src/components/portfolio/ProjectCard.tsx` -- Uses `ProjectData` for prop typing
