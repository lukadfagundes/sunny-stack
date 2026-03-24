import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../tests/helpers/mocks";

// Mock ESM-only dependencies
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) =>
    React.createElement("div", null, children),
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("unist-util-visit", () => ({ __esModule: true, visit: jest.fn() }));
jest.mock("react-syntax-highlighter", () => ({
  __esModule: true,
  Prism: ({ children, language }: { children: string; language: string }) =>
    React.createElement("code", { "data-testid": "syntax-hl", "data-lang": language }, children),
}));
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  __esModule: true,
  oneDark: {},
}));

import { createMarkdownComponents } from "@/components/docs/MarkdownRenderer";

describe("createMarkdownComponents", () => {
  const loadFile = jest.fn();

  beforeEach(() => loadFile.mockClear());

  function getComponents(path = "docs/guides/setup.md") {
    return createMarkdownComponents(path, loadFile);
  }

  // --- Link branches ---

  it("renders internal .md link and calls loadFile on click", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.a, { href: "other.md" }, "Link")
    );
    const a = container.querySelector("a")!;
    expect(a).toHaveAttribute("href", "#");
    fireEvent.click(a);
    expect(loadFile).toHaveBeenCalledWith("docs/guides/other.md");
  });

  it("renders internal docs/ link as doc link", () => {
    const C = getComponents();
    render(React.createElement(C.a, { href: "docs/overview" }, "Overview"));
    const a = screen.getByText("Overview");
    fireEvent.click(a);
    // docs/overview doesn't end with .md, so /README.md is appended
    expect(loadFile).toHaveBeenCalledWith("docs/overview/README.md");
  });

  it("renders external http link with target _blank", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.a, { href: "https://example.com" }, "Ext")
    );
    const a = container.querySelector("a")!;
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    expect(a).toHaveAttribute("href", "https://example.com");
  });

  it("renders non-external non-doc link without target", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.a, { href: "#section" }, "Anchor")
    );
    const a = container.querySelector("a")!;
    expect(a).not.toHaveAttribute("target");
    expect(a).toHaveAttribute("href", "#section");
  });

  it("resolves relative .md link from root path", () => {
    const C = createMarkdownComponents("README.md", loadFile);
    render(React.createElement(C.a, { href: "CHANGELOG.md" }, "CL"));
    fireEvent.click(screen.getByText("CL"));
    // currentPath is "README.md", dir is "", so resolved = href itself
    expect(loadFile).toHaveBeenCalledWith("CHANGELOG.md");
  });

  // --- Image branches ---

  it("renders normal image inline", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.img, { src: "/photo.png", alt: "photo" })
    );
    const img = container.querySelector("img")!;
    expect(img.className).toContain("inline-block");
  });

  it("handles Blob src gracefully", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.img, { src: new Blob() as unknown as string, alt: "blob" })
    );
    const img = container.querySelector("img")!;
    // Blob src is converted to undefined
    expect(img).not.toHaveAttribute("src");
  });

  // --- Code branches ---

  it("renders syntax-highlighted code for known language", () => {
    const C = getComponents();
    render(
      React.createElement(C.code, { className: "language-typescript" }, "const x = 1;")
    );
    expect(screen.getByTestId("syntax-hl")).toHaveAttribute("data-lang", "typescript");
  });

  it("renders plaintext block code with block class", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.code, { className: "language-plaintext" }, "ASCII art")
    );
    const code = container.querySelector("code")!;
    expect(code.className).toContain("block");
  });

  it("renders inline code without className", () => {
    const C = getComponents();
    const { container } = render(
      React.createElement(C.code, {}, "inline")
    );
    const code = container.querySelector("code")!;
    expect(code.className).toContain("bg-sunny-surface-light");
  });

  // --- Pre block branches ---

  it("applies plaintext centering style to pre with plaintext child", () => {
    const C = getComponents();
    const child = React.createElement("code", { className: "language-plaintext" }, "art");
    const { container } = render(
      React.createElement(C.pre, {}, child)
    );
    const pre = container.querySelector("pre")!;
    expect(pre.style.width).toBe("fit-content");
    expect(pre.style.marginInline).toBe("auto");
  });

  it("does not apply centering style to pre with non-plaintext child", () => {
    const C = getComponents();
    const child = React.createElement("code", { className: "language-typescript" }, "code");
    const { container } = render(
      React.createElement(C.pre, {}, child)
    );
    const pre = container.querySelector("pre")!;
    expect(pre.style.width).toBe("");
  });

  // --- Mermaid diagram ---

  it("renders MermaidDiagram for mermaid-diagram element with base64 code", () => {
    const C = getComponents();
    const component = C["mermaid-diagram"];
    const chart = btoa("graph TD\n  A-->B");
    const { container } = render(
      React.createElement(component, { "data-chart": chart })
    );
    // MermaidDiagram initially shows loading state
    expect(container.textContent).toContain("Rendering diagram...");
  });

  it("returns null for mermaid-diagram without data-chart", () => {
    const C = getComponents();
    const component = C["mermaid-diagram"];
    const { container } = render(
      React.createElement(component, {})
    );
    expect(container.innerHTML).toBe("");
  });
});
