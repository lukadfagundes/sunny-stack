# SectionHeader

## Overview

A simple, reusable presentational component that renders a styled section heading. It is used across multiple About page sections (DetailsBox, BioSections, ContactTable) to provide a consistent golden-colored header bar with rounded top corners.

**Source:** `src/components/about/SectionHeader.tsx`

## Props

| Prop    | Type     | Required | Description                                       |
| ------- | -------- | -------- | ------------------------------------------------- |
| `title` | `string` | Yes      | The text content to display in the section header |

### Props Interface

```ts
interface SectionHeaderProps {
  title: string;
}
```

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**.

## Event Handlers

This component has **no event handlers**.

## Child Components

This component renders **no child components**. It outputs a single `<h3>` element.

## Data Sources

All content comes from the `title` prop passed by the parent.

## Styling Details

- **Font:** Verdana, sans-serif (applied via inline `style`)
- **Text color:** `text-sunny-gold` (Tailwind utility)
- **Background:** `bg-sunny-surface`
- **Border:** Bottom border with `border-sunny-gold-muted`
- **Corners:** Rounded top corners (`rounded-t-md`), designed to pair with content sections that have rounded bottom corners
- **Typography:** Bold, base size (`text-base font-bold`)

## Usage

```tsx
<SectionHeader title="Luka's Details" />
<SectionHeader title={`${profile.name}'s Blurbs`} />
<SectionHeader title={`Contacting ${"\u00A0"}Luka`} />
```

## Integration Points

- **Used by:** `DetailsBox`, `BioSections`, `ContactTable`
- **Pattern:** Always rendered as the first child inside a section wrapper, followed by a content `<div>` with `rounded-b-md` to complete the rounded container pattern.
- **Note:** This component is **not** marked as `"use client"` -- it is a server component by default since it has no client-side interactivity.
