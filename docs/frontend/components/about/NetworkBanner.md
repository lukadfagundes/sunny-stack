# NetworkBanner

## Overview

A simple presentational component that displays a MySpace-inspired network connection banner. It shows the message "[Name] is in your extended network" in a styled, centered box with a golden border, mimicking the classic social network UI pattern.

**Source:** `src/components/about/NetworkBanner.tsx`

## Props

This component accepts **no props**. The user name is sourced from the static `profile` import.

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**.

## Event Handlers

This component has **no event handlers**.

## Child Components

This component renders **no child components**. It outputs a single `<div>` containing a `<p>` element.

## Data Sources

| Source | Import Path | Fields Used | Description |
|--------|-------------|-------------|-------------|
| `profile` | `@/lib/data/personal` | `name` | The profile name displayed in the banner message |

## Styling Details

- **Background:** `bg-sunny-surface`
- **Border:** `1px solid #B8860B` (dark goldenrod), with `borderRadius: 4`
- **Text:** `text-sunny-gold font-bold text-sm`, centered
- **Padding:** `px-4 py-3`

## Usage

```tsx
<NetworkBanner />
```

## Integration Points

- **Parent:** Rendered within the About page layout, typically placed between the profile card and detail sections.
- **Data:** Imports `profile` from `@/lib/data/personal` for the user's name.
- **Note:** This component is **not** marked as `"use client"` -- it is a server component by default since it has no client-side interactivity.
