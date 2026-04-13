# DetailsBox

## Overview

A client-side component that renders a labeled details table showing personal profile information (e.g., Status, Pets, Comfort Movie, Zodiac Sign). It uses alternating row background colors for visual distinction and delegates its header rendering to the `SectionHeader` component.

**Source:** `src/components/about/DetailsBox.tsx`

## Props

This component accepts **no props**. All data is sourced from the static `details` import.

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**. All data is statically imported.

## Event Handlers

This component has **no event handlers**. It is purely display-oriented.

## Child Components

| Component       | Source            | Purpose                                                              |
| --------------- | ----------------- | -------------------------------------------------------------------- |
| `SectionHeader` | `./SectionHeader` | Renders the section title ("Luka's Details") with consistent styling |

## Data Sources

| Source    | Import Path           | Type          | Description                                                                  |
| --------- | --------------------- | ------------- | ---------------------------------------------------------------------------- |
| `details` | `@/lib/data/personal` | `DetailRow[]` | Array of `{ label: string; value: string }` objects defining each detail row |

### DetailRow Structure

```ts
interface DetailRow {
  label: string;
  value: string;
}
```

### Current Data Values

| Label         | Value      |
| ------------- | ---------- |
| Status        | Married    |
| Pets          | Aly & AJ   |
| Comfort Movie | Mean Girls |
| Zodiac Sign   | Gemini     |

## Rendering Logic

- Iterates over the `details` array using `.map()`
- Each row is rendered as a two-column CSS grid (`grid-cols-[110px_1fr]`)
- Alternating row backgrounds: even rows use `#2A1F14`, odd rows use `#1A1209`
- Border separators are applied between rows (not after the last row)
- Keys are based on `detail.label`

## Usage

```tsx
<DetailsBox />
```

## Integration Points

- **Parent:** Rendered within the About page layout alongside other profile sections.
- **SectionHeader:** Relies on the `SectionHeader` component for the styled title bar.
- **Data:** Entirely driven by the `details` array from `@/lib/data/personal`. Changes to that array are automatically reflected.
