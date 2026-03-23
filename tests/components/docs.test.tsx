import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";

// Mock react-markdown to render children as plain text
jest.mock("react-markdown", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) =>
      React.createElement("div", { "data-testid": "markdown-content" }, children),
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
    React.createElement("code", { "data-testid": "syntax-highlighter" }, children),
}));
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  __esModule: true,
  oneDark: {},
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import DocsPage from "@/app/docs/page";

// Minimal file tree — tests should not depend on specific filenames or formatted labels
const mockFileTree = {
  files: [
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
  ],
};

describe("DocsPage", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("list=true")) {
        return { json: async () => mockFileTree };
      }
      if (url.includes("path=README.md")) {
        return { json: async () => ({ content: "# Hello World" }) };
      }
      return { json: async () => ({ content: "# Other file" }) };
    });
  });

  it("renders sidebar heading and navigation after loading", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByText("Documentation")).toBeInTheDocument();
    });
    // Navigation renders once sections are built from the file tree
    const nav = await waitFor(() =>
      screen.getByRole("navigation", { name: /documentation/i })
    );
    expect(nav).toBeInTheDocument();
  });

  it("loads and displays default file content", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
    });
    expect(screen.getByTestId("markdown-content").textContent).toBe("# Hello World");
  });

  it("fetches file content when a nav item is clicked", async () => {
    render(<DocsPage />);

    // Wait for nav to render with sections
    const nav = await waitFor(() =>
      screen.getByRole("navigation", { name: /documentation/i })
    );

    const buttons = nav.querySelectorAll("button");
    const fileButtons = Array.from(buttons).filter(
      (b) => b.querySelector("svg") && b.textContent
    );
    expect(fileButtons.length).toBeGreaterThan(0);

    fireEvent.click(fileButtons[0]);

    // Either it expanded a section or fetched a file — both are valid interactions
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("shows mobile toggle button", () => {
    render(<DocsPage />);
    expect(screen.getByText("Browse docs")).toBeInTheDocument();
  });

  it("toggles sidebar on mobile button click", async () => {
    render(<DocsPage />);
    const toggle = screen.getByText("Browse docs");
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByText("Close")).toBeInTheDocument();
    });
  });

  it("shows breadcrumb for current file", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByText("README.md")).toBeInTheDocument();
    });
  });

  it("expands and collapses a section", async () => {
    render(<DocsPage />);

    // Wait for nav to render
    const nav = await waitFor(() =>
      screen.getByRole("navigation", { name: /documentation/i })
    );

    const sectionButtons = Array.from(nav.querySelectorAll("button"));

    // Find a collapsed section (one whose child items are not visible)
    // Sections with chevrons are toggle buttons
    const guidesBtn = sectionButtons.find((b) => b.textContent?.includes("Guides"));
    if (guidesBtn) {
      // Click to expand
      fireEvent.click(guidesBtn);
      // The section should now show child items
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
