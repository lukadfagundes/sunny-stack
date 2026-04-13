# MarkdownRenderer

## Overview

`MarkdownRenderer` is a client-side component that renders markdown content with full GitHub-Flavored Markdown (GFM) support, syntax highlighting for code blocks, internal documentation link resolution, Mermaid diagram rendering, and comprehensive custom styling. It transforms raw markdown strings into themed HTML using `react-markdown` with custom component overrides.

**Source:** `src/components/docs/MarkdownRenderer.tsx`

## Props

| Prop          | Type                     | Required | Description                                                                            |
| ------------- | ------------------------ | -------- | -------------------------------------------------------------------------------------- |
| `content`     | `string`                 | Yes      | Raw markdown string to render.                                                         |
| `currentPath` | `string`                 | Yes      | File path of the currently displayed document, used to resolve relative links.         |
| `loadFile`    | `(path: string) => void` | Yes      | Callback to navigate to another document. Invoked when internal doc links are clicked. |

## Remark Plugins

| Plugin                  | Source       | Description                                                                                                                                                                                                     |
| ----------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `remarkGfm`             | `remark-gfm` | Enables GitHub-Flavored Markdown: tables, strikethrough, task lists, autolinks.                                                                                                                                 |
| `remarkDefaultCodeLang` | Internal     | Custom plugin that assigns `"plaintext"` as the default language to fenced code blocks without a language specifier. This ensures block code always receives a `className`, distinguishing it from inline code. |

## Rehype Plugins

| Plugin      | Source       | Description                                                                                                            |
| ----------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `rehypeRaw` | `rehype-raw` | Parses raw HTML elements in markdown (e.g., `<mermaid-diagram>`) so they can be handled by custom component overrides. |

## Exported Functions

### `createMarkdownComponents(currentPath, loadFile)`

Builds and returns the component overrides object for `react-markdown`. This is exported for testability. The function creates custom renderers for all major markdown elements.

## Component Overrides

### Headings

| Element | Styling                                                       |
| ------- | ------------------------------------------------------------- |
| `h1`    | 2xl bold, sunny-gold, bottom border, top margin (first:mt-0). |
| `h2`    | xl bold, sunny-gold.                                          |
| `h3`    | lg semibold, sunny-gold.                                      |
| `h4`    | base semibold, sunny-cream.                                   |

### Text Elements

| Element  | Styling                                    |
| -------- | ------------------------------------------ |
| `p`      | sm text, sunny-cream, relaxed line-height. |
| `strong` | Bold, sunny-cream.                         |
| `em`     | Italic, sunny-cream-muted.                 |

### Links (`a`)

Implements smart link routing with three modes:

1. **Internal doc links** (ends with `.md` or starts with `docs/`):
   - Resolves relative paths based on `currentPath`.
   - For directory references, appends `/README.md`.
   - Renders as `<a href="#">` with `onClick` that calls `loadFile(resolvedPath)`.
   - Styled as sunny-gold with underline.

2. **External links** (`http://`, `https://`, `mailto:`):
   - Opens in new tab (`target="_blank"`, `rel="noopener noreferrer"`).
   - Styled as sunny-gold with underline.

3. **Other links**:
   - Rendered as standard anchor tags.

### Lists

| Element | Styling                                                        |
| ------- | -------------------------------------------------------------- |
| `ul`    | Disc markers, inside positioning, sunny-cream, left margin.    |
| `ol`    | Decimal markers, inside positioning, sunny-cream, left margin. |
| `li`    | sm text, sunny-cream.                                          |

### Block Elements

| Element      | Styling                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `blockquote` | 4px left border (sunny-gold-muted), left padding, italic, sunny-cream-muted. |
| `hr`         | sunny-surface-light border, vertical margin.                                 |

### Tables

| Element | Styling                                                              |
| ------- | -------------------------------------------------------------------- |
| `table` | Full width, collapsed borders, wrapped in overflow-x-auto container. |
| `thead` | sunny-surface-light background.                                      |
| `th`    | Left-aligned, sunny-gold, semibold, bordered.                        |
| `td`    | sunny-cream, bordered.                                               |

### Images (`img`)

- Inline-block display, max-width 100%, rounded corners.
- Blob `src` values are sanitized (converted to undefined).

### Mermaid Diagrams (`mermaid-diagram`)

Custom HTML element handled via `rehype-raw`:

- Reads base64-encoded diagram code from the `data-chart` attribute.
- Decodes and passes the code to the `MermaidDiagram` client component.
- `MermaidDiagram` renders diagrams client-side using `mermaid.render()`, which ensures the browser's own fonts are used for both text measurement and display (avoiding truncation issues from server-side rendering).
- Shows a loading spinner with "Rendering diagram..." text while the diagram is being processed.

### Code

Three rendering modes based on context:

1. **Block code with language** (e.g., ` ```typescript `):
   - Uses `SyntaxHighlighter` from `react-syntax-highlighter` with `oneDark` theme.
   - Custom styles: 13px font, Cascadia Code font family, transparent background.

2. **Block code without language / plaintext** (has `className` but language is `"plaintext"`):
   - Plain `<code>` element with `whitespace: pre`.
   - 13px monospace font, sunny-cream text.
   - Used for ASCII diagrams and other non-highlighted blocks.

3. **Inline code** (no `className`):
   - `<code>` with sunny-surface-light background, sunny-gold text.
   - Rounded, smaller text (xs), with horizontal padding.

### Pre-formatted Blocks (`pre`)

- All code blocks wrapped in a bordered container with sunny-bg background.
- Horizontal overflow scroll.
- **Plaintext blocks** get special styling: `width: fit-content` and `margin-inline: auto` for centered ASCII diagrams.

## Child Components / Dependencies

| Component                   | Source                                           | Description                                              |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `ReactMarkdown`             | `react-markdown`                                 | Core markdown rendering engine.                          |
| `remarkGfm`                 | `remark-gfm`                                     | GFM plugin for tables, strikethrough, etc.               |
| `rehypeRaw`                 | `rehype-raw`                                     | Parses raw HTML in markdown for custom element handling. |
| `SyntaxHighlighter` (Prism) | `react-syntax-highlighter`                       | Code syntax highlighting.                                |
| `oneDark`                   | `react-syntax-highlighter/dist/esm/styles/prism` | Dark syntax highlighting theme.                          |
| `visit`                     | `unist-util-visit`                               | AST traversal utility for the custom remark plugin.      |
| `MermaidDiagram`            | `@/components/docs/MermaidDiagram`               | Client-side mermaid diagram renderer with loading state. |

## Styling

- All elements use the project's Tailwind theme colors (sunny-gold, sunny-cream, sunny-surface-light, etc.).
- Code blocks use Cascadia Code / Consolas / Courier New monospace font stack.
- The component wraps everything in a `docs-markdown` CSS class for potential global style targeting.
- Consistent spacing with margin-bottom on paragraphs, lists, and block elements.

## Usage

```tsx
<MarkdownRenderer
  content={markdownString}
  currentPath="docs/guides/getting-started.md"
  loadFile={(path) => fetchAndDisplayDoc(path)}
/>
```

## Integration Points

- Used in the `/docs` page alongside `DocNav`.
- Receives markdown content fetched from the `/api/docs/[path]` endpoint.
- Internal doc links trigger the `loadFile` callback which typically updates the parent state and fetches new content.
- The `currentPath` is essential for resolving relative markdown links within the documentation tree.
- The `remarkDefaultCodeLang` plugin ensures consistent code block rendering even when authors omit language specifiers.
