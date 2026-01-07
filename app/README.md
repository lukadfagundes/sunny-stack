# App Directory

Next.js 15 App Router application structure.

## Overview

This directory contains the Next.js App Router implementation using React 19 and the latest Next.js features.

## Structure

```
app/
├── api/              # API route handlers
├── (routes)/         # Page routes
├── layout.tsx        # Root layout
├── page.tsx          # Home page
└── globals.css       # Global styles
```

## Key Components

- **API Routes**: Backend endpoints for data fetching and mutations
- **Page Routes**: Frontend pages using App Router conventions
- **Layouts**: Shared layouts with React Server Components
- **Server Components**: Default rendering strategy

## Documentation

See [app/CLAUDE.md](CLAUDE.md) for Next.js App Router patterns and architecture details.
