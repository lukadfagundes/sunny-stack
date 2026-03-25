# Projects Data Module

## Overview

Static portfolio project catalog containing 8 projects organized into 3 categories (professional, personal, contribution). Pure TypeScript with no React imports. Provides accessor functions for filtering and lookup.

**Source:** `src/lib/data/projects.ts` (453 lines)

## Exports

### Functions

#### `getAllProjects(): ProjectData[]`

Returns the complete array of all 8 projects.

#### `getProjectsByCategory(category: ProjectCategory): ProjectData[]`

Filters and returns projects matching the specified category.

**Parameters:**
- `category` (`ProjectCategory`) -- One of `"professional"`, `"personal"`, or `"contribution"`

**Returns:** `ProjectData[]` -- Filtered array of projects

#### `getProjectById(id: string): ProjectData | undefined`

Finds and returns a single project by its unique ID.

**Parameters:**
- `id` (`string`) -- Project identifier (e.g., `"trinity-sdk"`, `"cola-records"`)

**Returns:** `ProjectData | undefined` -- The matching project or undefined

## Data Catalog

### Professional (3 projects)

| ID | Title | Tech Stack | Status |
|----|-------|------------|--------|
| `trinity-sdk` | Trinity Method SDK | TypeScript, Node.js, CLI, AI Agents, npm | active |
| `cola-records` | Cola Records | Electron, React 19, TypeScript, Vite, SQLite, Zustand, Tailwind CSS, Docker | active |
| `rinoa-platform` | Rinoa | Next.js 15, React 19, PostgreSQL 18, Express.js, Docker, Playwright, Raspberry Pi 5, NextAuth v5 | proprietary |

### Personal (4 projects)

| ID | Title | Tech Stack | Status |
|----|-------|------------|--------|
| `hytale-server-manager` | Hytale Server Manager | Electron 40, React 19, TypeScript, Vite 6, Zustand, Tailwind CSS, Jest, Chokidar | active |
| `bwaincell` | Bwaincell | TypeScript, Discord.js, Express, Next.js 14, PostgreSQL, Sequelize, Docker, Gemini AI | active |
| `stilltide` | Stilltide | React 19, Vite, Express, Gemini AI, Google APIs, Docker | active |
| `spotify-rainmeter` | Spotify Now Playing | Rainmeter, Lua, Python, Spotify Web API, OAuth 2.0, PyInstaller | active |

### Contribution (1 project)

| ID | Title | Tech Stack | Status |
|----|-------|------------|--------|
| `reactive-resume` | Reactive Resume | React, TypeScript, Zustand, Zod, docx, tRPC/oRPC, Vitest | active |

## Implementation Details

### Data Structure

Each project follows the `ProjectData` interface (from `./types`) with:
- `id` -- Unique kebab-case identifier
- `title` -- Display title
- `tagline` -- One-line summary
- `description` -- Full description paragraph
- `category` -- `"professional"` | `"personal"` | `"contribution"`
- `techStack` -- Array of technology name strings
- `features` -- Array of `{ label, description }` objects (3-5 per project)
- `links` -- Array of `{ label, url }` objects (GitHub, Live App, Download, etc.)
- `status` -- `"active"` | `"archived"` | `"proprietary"`
- `footer` -- Optional additional context string

### Module-Level Array

The `projects` array is a module-level constant (not exported directly). Access is provided exclusively through the three exported functions.

## Dependencies

- **Types:** Imports `ProjectData` and `ProjectCategory` from `./types`
- No external dependencies

## Usage

```typescript
import { getAllProjects, getProjectsByCategory, getProjectById } from "@/lib/data/projects";

// Get all projects
const all = getAllProjects(); // 8 projects

// Get by category
const professional = getProjectsByCategory("professional"); // 3 projects
const personal = getProjectsByCategory("personal");         // 4 projects
const contributions = getProjectsByCategory("contribution"); // 1 project

// Get by ID
const trinity = getProjectById("trinity-sdk");
```
