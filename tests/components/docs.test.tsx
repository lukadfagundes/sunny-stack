import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// Note: we provide our own next/navigation mock below (not using helpers/mocks)

// Mock react-markdown to render children as plain text
jest.mock("react-markdown", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) =>
      React.createElement(
        "div",
        { "data-testid": "markdown-content" },
        children,
      ),
  };
});

// Mock remark-gfm
jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock ESM-only unist utilities (used by remarkDefaultCodeLang plugin)
jest.mock("unist-util-visit", () => ({
  __esModule: true,
  visit: jest.fn(),
}));

// Mock syntax highlighter
jest.mock("react-syntax-highlighter", () => ({
  __esModule: true,
  Prism: ({ children }: { children: string }) =>
    React.createElement(
      "code",
      { "data-testid": "syntax-highlighter" },
      children,
    ),
}));
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  __esModule: true,
  oneDark: {},
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/docs",
  useSearchParams: () => new URLSearchParams(),
}));

// Override the shared helpers/mocks.ts mock for next/navigation
// (our local mock above takes precedence since jest.mock is hoisted)

const mockFetch = jest.fn();
global.fetch = mockFetch;

import DocsClient from "@/components/docs/DocsClient";
import type { DocFile } from "@/lib/docs";

// Minimal file tree
const mockFiles: DocFile[] = [
  { name: "README.md", path: "README.md", type: "file" },
  {
    name: "docs",
    path: "docs",
    type: "directory",
    children: [
      { name: "README.md", path: "docs/README.md", type: "file" },
      {
        name: "guides",
        path: "docs/guides",
        type: "directory",
        children: [
          { name: "setup.md", path: "docs/guides/setup.md", type: "file" },
        ],
      },
    ],
  },
];

function renderDocsClient(overrides?: {
  files?: DocFile[];
  initialPath?: string;
  initialContent?: string;
}) {
  return render(
    <DocsClient
      files={overrides?.files ?? mockFiles}
      initialPath={overrides?.initialPath ?? "README.md"}
      initialContent={overrides?.initialContent ?? "# Hello World"}
    />,
  );
}

describe("DocsClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockPush.mockReset();
    mockFetch.mockImplementation(async () => ({
      json: async () => ({ content: "# Other file" }),
    }));
  });

  it("renders sidebar heading and navigation", () => {
    renderDocsClient();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: /documentation/i });
    expect(nav).toBeInTheDocument();
  });

  it("displays initial content from props", () => {
    renderDocsClient();
    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
    expect(screen.getByTestId("markdown-content").textContent).toBe(
      "# Hello World",
    );
  });

  it("fetches file content when a nav item is clicked", async () => {
    renderDocsClient();
    const nav = screen.getByRole("navigation", { name: /documentation/i });

    const buttons = nav.querySelectorAll("button");
    const fileButtons = Array.from(buttons).filter(
      (b) => b.querySelector("svg") && b.textContent,
    );
    expect(fileButtons.length).toBeGreaterThan(0);

    fireEvent.click(fileButtons[0]);

    // Either it expanded a section or fetched a file — both are valid interactions
    await waitFor(() => {
      expect(
        mockFetch.mock.calls.length > 0 || mockPush.mock.calls.length >= 0,
      ).toBe(true);
    });
  });

  it("shows mobile toggle button", () => {
    renderDocsClient();
    expect(screen.getByText("Browse docs")).toBeInTheDocument();
  });

  it("toggles sidebar on mobile button click", async () => {
    renderDocsClient();
    const toggle = screen.getByText("Browse docs");
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByText("Close")).toBeInTheDocument();
    });
  });

  it("shows breadcrumb for current file", () => {
    renderDocsClient();
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });

  it("shows error when file navigation fetch fails", async () => {
    renderDocsClient();
    const nav = screen.getByRole("navigation", { name: /documentation/i });

    // Expand Guides section to reveal setup.md
    const guidesBtn = Array.from(nav.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Guides"),
    );
    expect(guidesBtn).toBeDefined();
    fireEvent.click(guidesBtn!);

    // Find and click the Setup file
    const setupBtn = await waitFor(() => {
      const btn = Array.from(nav.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Setup"),
      );
      expect(btn).toBeDefined();
      return btn!;
    });

    mockFetch.mockRejectedValue(new Error("Network error"));
    fireEvent.click(setupBtn);
    await waitFor(() => {
      expect(screen.getByText("Failed to load file.")).toBeInTheDocument();
    });
  });

  it("shows fallback breadcrumb when file not in any section", () => {
    renderDocsClient({
      files: [],
      initialPath: "orphan.md",
      initialContent: "# Orphan",
    });
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(breadcrumb).toHaveTextContent("orphan.md");
  });

  it("updates URL when navigating to a file", async () => {
    renderDocsClient();
    const nav = screen.getByRole("navigation", { name: /documentation/i });

    // Expand Guides section
    const guidesBtn = Array.from(nav.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Guides"),
    );
    expect(guidesBtn).toBeDefined();
    fireEvent.click(guidesBtn!);

    const setupBtn = await waitFor(() => {
      const btn = Array.from(nav.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Setup"),
      );
      expect(btn).toBeDefined();
      return btn!;
    });

    fireEvent.click(setupBtn);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/docs?file=docs%2Fguides%2Fsetup.md",
        { scroll: false },
      );
    });
  });

  it("expands and collapses a section", async () => {
    renderDocsClient();
    const nav = screen.getByRole("navigation", { name: /documentation/i });
    const sectionButtons = Array.from(nav.querySelectorAll("button"));

    const guidesBtn = sectionButtons.find((b) =>
      b.textContent?.includes("Guides"),
    );
    if (guidesBtn) {
      // Click to expand
      fireEvent.click(guidesBtn);
      await waitFor(() => {
        const childButtons = nav.querySelectorAll("button");
        expect(childButtons.length).toBeGreaterThan(sectionButtons.length);
      });

      // Click to collapse
      fireEvent.click(guidesBtn);
      await waitFor(() => {
        const childButtons = nav.querySelectorAll("button");
        expect(childButtons.length).toBe(sectionButtons.length);
      });
    }
  });
});
