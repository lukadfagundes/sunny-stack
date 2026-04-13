# MermaidDiagram

## Overview

`MermaidDiagram` is a client-side component that renders Mermaid diagram code into SVG using the `mermaid` JavaScript library directly in the browser. This approach ensures the browser's own fonts are used for both text measurement and display, avoiding truncation issues that occur with server-side rendering (e.g., mermaid.ink). Displays a loading spinner while the diagram is being processed.

**Source:** `src/components/docs/MermaidDiagram.tsx` (68 lines)

## Props

| Prop   | Type     | Required | Description                                                                                                               |
| ------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `code` | `string` | Yes      | Raw Mermaid diagram code (e.g., `flowchart TD\n  A --> B`). Decoded from base64 by the `MarkdownRenderer` before passing. |

## State Management

| Hook       | Variable | Type     | Initial | Description                                                           |
| ---------- | -------- | -------- | ------- | --------------------------------------------------------------------- |
| `useState` | `svg`    | `string` | `""`    | The rendered SVG markup. Empty string while rendering is in progress. |

## Initialization

Uses a module-level `initialized` flag to ensure `mermaid.initialize()` is called only once across all component instances:

```typescript
let initialized = false;
// On first render of any MermaidDiagram:
mermaid.initialize({ startOnLoad: false, theme: "dark" });
initialized = true;
```

- `startOnLoad: false` prevents mermaid from auto-scanning the DOM.
- `theme: "dark"` matches the site's dark theme.

## Rendering Logic

1. On mount (or when `code` changes), generates a unique ID: `mermaid-{random}`.
2. Calls `mermaid.render(id, code)` which returns `{ svg }`.
3. Sets the `svg` state, triggering a re-render from loading spinner to rendered diagram.

## Render Structure

### Loading State (`svg` is empty)

```
<span style="display:flex" class="bg-sunny-bg border rounded-md p-4 min-h-[120px]">
  <span style="display:flex" class="text-sunny-cream-muted">
    <svg class="animate-spin h-5 w-5">...</svg>    <!-- Spinning circle -->
    <span class="text-sm italic">Rendering diagram...</span>
  </span>
</span>
```

### Rendered State (`svg` is populated)

```
<span style="display:block" class="bg-sunny-bg border rounded-md p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} />
```

## HTML Element Choice

All elements use `<span>` with `style={{ display: "block" }}` or `style={{ display: "flex" }}` instead of `<div>`. This is intentional: ReactMarkdown wraps custom HTML elements (like `<mermaid-diagram>`) in `<p>` tags, and `<div>` inside `<p>` is invalid HTML, causing React hydration errors.

## Child Components / Dependencies

| Component | Source    | Description                                                                    |
| --------- | --------- | ------------------------------------------------------------------------------ |
| `mermaid` | `mermaid` | Mermaid diagram rendering library. Renders diagram code to SVG in the browser. |

## Styling

- Container: `bg-sunny-bg`, `border border-sunny-surface-light`, `rounded-md`, `p-4`, `my-3`.
- Loading state: `min-h-[120px]` prevents layout shift, centered flex layout.
- Spinner: Tailwind `animate-spin` with a partial circle SVG in `sunny-cream-muted`.
- Rendered state: `overflow-x-auto` for wide diagrams that exceed container width.

## Usage

Not used directly. Invoked by `MarkdownRenderer` via the `mermaid-diagram` component override:

```tsx
// In MarkdownRenderer's component overrides:
"mermaid-diagram": ({ "data-chart": chart }) => {
  if (!chart) return null;
  return <MermaidDiagram code={atob(chart)} />;
},
```

## Integration Points

- Consumed exclusively by `MarkdownRenderer` via the `mermaid-diagram` custom HTML element.
- The API route (`/api/docs`) preprocesses Mermaid code blocks into `<mermaid-diagram data-chart="{base64}">` markers.
- The `rehype-raw` plugin in `MarkdownRenderer` parses these custom elements so the component override can handle them.
- Diagram code flows: markdown file -> `preprocessMermaid()` (base64 encode) -> `MarkdownRenderer` (base64 decode) -> `MermaidDiagram` (render to SVG).
