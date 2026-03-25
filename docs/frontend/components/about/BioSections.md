# BioSections

## Overview

A presentational component that renders two bio blurb sections: "About me" and "Who I'd like to meet." It displays multi-paragraph text content imported from static data, splitting on double newlines to create separate `<p>` elements. The section uses the `SectionHeader` component for its title bar.

**Source:** `src/components/about/BioSections.tsx`

## Props

This component accepts **no props**. All data is sourced from static imports.

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**.

## Event Handlers

This component has **no event handlers**.

## Child Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `SectionHeader` | `./SectionHeader` | Renders the section title ("[Name]'s Blurbs") with consistent styling |

## Data Sources

| Source | Import Path | Type | Description |
|--------|-------------|------|-------------|
| `profile` | `@/lib/data/personal` | `ProfileData` | Used for `profile.name` in the section header title |
| `aboutMe` | `@/lib/data/personal` | `string` | Multi-paragraph "About me" text, paragraphs separated by `\n\n` |
| `whoIdLikeToMeet` | `@/lib/data/personal` | `string` | Multi-paragraph "Who I'd like to meet" text, paragraphs separated by `\n\n` |

## Rendering Logic

- The section header displays `"[Name]'s Blurbs"` using the profile name
- Both `aboutMe` and `whoIdLikeToMeet` strings are split on `"\n\n"` to produce paragraph arrays
- Each paragraph is rendered as a separate `<p>` element with `text-sunny-cream text-sm leading-relaxed`
- Inter-paragraph spacing is applied via inline `marginBottom: 0.75rem` on all paragraphs except the last
- Each subsection has a golden subheading (`text-sunny-gold font-bold text-sm`)

## Sections Rendered

1. **About me:** -- Subheaded "About me:", renders paragraphs from `aboutMe`
2. **Who I'd like to meet:** -- Subheaded "Who I'd like to meet:", renders paragraphs from `whoIdLikeToMeet`

## Usage

```tsx
<BioSections />
```

## Integration Points

- **Parent:** Rendered within the About page layout as one of the main content sections.
- **SectionHeader:** Relies on the `SectionHeader` component for the styled title bar.
- **Data:** Entirely driven by `profile`, `aboutMe`, and `whoIdLikeToMeet` from `@/lib/data/personal`.
- **Note:** This component is **not** marked as `"use client"` -- it is a server component by default since it has no client-side interactivity.
