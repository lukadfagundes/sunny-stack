# NetworkBanner

## Overview

A presentational component that displays a professional blurb at the top of the About page's right column. Shows a short professional introduction in a styled, centered box with a golden border.

**Source:** `src/components/about/NetworkBanner.tsx`

## Props

This component accepts **no props**. The blurb text is hardcoded.

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**.

## Event Handlers

This component has **no event handlers**.

## Child Components

This component renders **no child components**. It outputs a single `<div>` containing a `<p>` element.

## Content

Displays the following professional blurb:

> Self-taught full stack developer building production software with TypeScript, React, Next.js, and Node.js since August 2025. Based remotely in California. Open to full-time, contract, and freelance opportunities.

## Styling Details

- **Background:** `bg-sunny-surface`
- **Border:** `1px solid #B8860B` (dark goldenrod), with `borderRadius: 4`
- **Text:** `text-sunny-cream text-sm leading-relaxed`, centered
- **Padding:** `px-4 py-3`

## Usage

```tsx
<NetworkBanner />
```

## Integration Points

- **Parent:** Rendered within the About page layout, at the top of the right column in the "profile" view.
- **Note:** This component is **not** marked as `"use client"` -- it is a server component by default since it has no client-side interactivity.
