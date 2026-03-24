"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { visit } from "unist-util-visit";
import type { Root, Code } from "mdast";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Home,
  BookOpen,
  Code2,
  Layers,
  Rocket,
  Compass,
  Library,
  Menu,
  X,
} from "lucide-react";
import type { DocFile } from "@/app/api/docs/route";

/** Remark plugin: assign a default lang to fenced code blocks without one.
 *  This ensures the code component always receives a className for block code,
 *  distinguishing it from inline code (which never has a className). */
function remarkDefaultCodeLang() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code) => {
      if (!node.lang) node.lang = "plaintext";
    });
  };
}

/** Convert a filename like "getting-started.md" to "Getting Started" */
function formatName(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .replace(/^ADR-(\d+)-/, "ADR-$1: ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: { path: string; label: string }[];
  subsections?: { id: string; label: string; items: { path: string; label: string }[] }[];
}

/** Build structured navigation sections from the flat file tree */
function buildSections(files: DocFile[]): NavSection[] {
  const sections: NavSection[] = [];

  // Root README → "Overview" section
  const rootReadme = files.find((f) => f.type === "file" && f.name === "README.md");
  if (rootReadme) {
    sections.push({
      id: "overview",
      label: "Overview",
      icon: <Home size={16} />,
      items: [{ path: rootReadme.path, label: "README" }],
    });
  }

  // Process docs directory
  const docsDir = files.find((f) => f.type === "directory" && f.name === "docs");
  if (!docsDir?.children) return sections;

  // Docs hub README
  const docsReadme = docsDir.children.find((f) => f.type === "file" && f.name === "README.md");
  if (docsReadme) {
    sections[0]?.items.push({ path: docsReadme.path, label: "README" });
  }

  const sectionMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    api: { label: "API", icon: <Code2 size={16} /> },
    architecture: { label: "Architecture", icon: <Layers size={16} /> },
    deployment: { label: "Deployment", icon: <Rocket size={16} /> },
    guides: { label: "Guides", icon: <Compass size={16} /> },
    reference: { label: "Reference", icon: <Library size={16} /> },
  };

  for (const child of docsDir.children) {
    if (child.type !== "directory" || !child.children) continue;

    const meta = sectionMeta[child.name] ?? {
      label: formatName(child.name),
      icon: <BookOpen size={16} />,
    };

    const items: { path: string; label: string }[] = [];
    const subsections: NavSection["subsections"] = [];

    for (const entry of child.children) {
      if (entry.type === "file") {
        items.push({
          path: entry.path,
          label: formatName(entry.name),
        });
      } else if (entry.type === "directory" && entry.children) {
        const subItems = entry.children
          .filter((e) => e.type === "file")
          .map((e) => ({
            path: e.path,
            label: formatName(e.name),
          }));
        if (subItems.length > 0) {
          subsections.push({
            id: entry.path,
            label: formatName(entry.name),
            items: subItems,
          });
        }
      }
    }

    sections.push({
      id: child.path,
      label: meta.label,
      icon: meta.icon,
      items,
      subsections: subsections.length > 0 ? subsections : undefined,
    });
  }

  return sections;
}

/** Compute which sections/subsections should be expanded for a given path */
function getAutoExpanded(sections: NavSection[], path: string): Set<string> {
  const result = new Set<string>();
  for (const s of sections) {
    if (s.items.some((i) => i.path === path)) {
      result.add(s.id);
    }
    if (s.subsections) {
      for (const sub of s.subsections) {
        if (sub.items.some((i) => i.path === path)) {
          result.add(s.id);
          result.add(sub.id);
        }
      }
    }
  }
  if (result.size === 0 && sections.length > 0) result.add(sections[0].id);
  return result;
}

function DocNav({
  sections,
  currentPath,
  onSelect,
}: {
  sections: NavSection[];
  currentPath: string;
  onSelect: (path: string) => void;
}) {
  // Manual toggle overrides, keyed by path so they reset on navigation
  const [overrides, setOverrides] = useState<{ path: string; toggled: Set<string> }>({
    path: currentPath,
    toggled: new Set(),
  });

  const autoExpanded = useMemo(
    () => getAutoExpanded(sections, currentPath),
    [sections, currentPath],
  );

  // Derive effective expanded set: start from auto, apply manual toggles
  const expanded = useMemo(() => {
    if (overrides.path !== currentPath) return autoExpanded;
    const result = new Set(autoExpanded);
    for (const id of overrides.toggled) {
      if (result.has(id)) result.delete(id);
      else result.add(id);
    }
    return result;
  }, [autoExpanded, overrides, currentPath]);

  function toggle(id: string) {
    setOverrides((prev) => {
      const toggled = new Set(prev.path === currentPath ? prev.toggled : []);
      if (toggled.has(id)) toggled.delete(id);
      else toggled.add(id);
      return { path: currentPath, toggled };
    });
  }

  return (
    <nav className="space-y-1" aria-label="Documentation navigation">
      {sections.map((section) => {
        const isOpen = expanded.has(section.id);
        const sectionActive =
          section.items.some((i) => i.path === currentPath) ||
          section.subsections?.some((sub) =>
            sub.items.some((i) => i.path === currentPath)
          );

        return (
          <div key={section.id}>
            <button
              onClick={() => toggle(section.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                sectionActive
                  ? "text-sunny-gold"
                  : "text-sunny-cream-muted hover:text-sunny-cream hover:bg-sunny-surface-light"
              }`}
            >
              <span className={sectionActive ? "text-sunny-gold" : "text-sunny-cream-muted"}>
                {section.icon}
              </span>
              <span className="flex-1 text-left truncate">{section.label}</span>
              {isOpen ? (
                <ChevronDown size={14} className="text-sunny-cream-muted flex-shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-sunny-cream-muted flex-shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="ml-3 mt-0.5 border-l border-sunny-surface-light pl-2">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => onSelect(item.path)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                      currentPath === item.path
                        ? "bg-sunny-surface-light text-sunny-gold font-medium"
                        : "text-sunny-cream-muted hover:text-sunny-cream hover:bg-sunny-surface-light/50"
                    }`}
                  >
                    <FileText size={13} className="flex-shrink-0 opacity-60" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}

                {section.subsections?.map((sub) => {
                  const subOpen = expanded.has(sub.id);
                  const subActive = sub.items.some((i) => i.path === currentPath);

                  return (
                    <div key={sub.id} className="mt-0.5">
                      <button
                        onClick={() => toggle(sub.id)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                          subActive
                            ? "text-sunny-gold font-medium"
                            : "text-sunny-cream-muted hover:text-sunny-cream hover:bg-sunny-surface-light/50"
                        }`}
                      >
                        {subOpen ? (
                          <ChevronDown size={12} className="flex-shrink-0 opacity-60" />
                        ) : (
                          <ChevronRight size={12} className="flex-shrink-0 opacity-60" />
                        )}
                        <span className="truncate">{sub.label}</span>
                      </button>

                      {subOpen && (
                        <div className="ml-3 border-l border-sunny-surface-light/50 pl-2">
                          {sub.items.map((item) => (
                            <button
                              key={item.path}
                              onClick={() => onSelect(item.path)}
                              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                                currentPath === item.path
                                  ? "bg-sunny-surface-light text-sunny-gold font-medium"
                                  : "text-sunny-cream-muted hover:text-sunny-cream hover:bg-sunny-surface-light/50"
                              }`}
                            >
                              <FileText size={12} className="flex-shrink-0 opacity-60" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default function DocsPage() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [currentPath, setCurrentPath] = useState("README.md");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch file tree + initial README on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/docs?list=true").then((r) => r.json()),
      fetch("/api/docs?path=README.md").then((r) => r.json()),
    ])
      .then(([treeData, readmeData]) => {
        setFiles(treeData.files ?? []);
        setContent(readmeData.content ?? "File not found.");
        setLoading(false);
      })
      .catch(() => {
        setFiles([]);
        setContent("Failed to load file.");
        setLoading(false);
      });
  }, []);

  // Load a specific file (for navigation clicks)
  const loadFile = useCallback((filePath: string) => {
    setCurrentPath(filePath);
    setLoading(true);
    setSidebarOpen(false);
    fetch(`/api/docs?path=${encodeURIComponent(filePath)}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content ?? "File not found.");
        setLoading(false);
      })
      .catch(() => {
        setContent("Failed to load file.");
        setLoading(false);
      });
  }, []);

  const sections = buildSections(files);

  return (
    <main
      className="flex-1 min-h-screen relative z-10"
      style={{ fontFamily: "Verdana, sans-serif" }}
    >
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-4 flex items-center gap-2 rounded-md bg-sunny-surface px-3 py-2 text-sm text-sunny-cream-muted hover:text-sunny-cream md:hidden"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            {sidebarOpen ? "Close" : "Browse docs"}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside
              className={`${
                sidebarOpen ? "block" : "hidden"
              } md:block rounded-md bg-sunny-surface border border-sunny-surface-light p-3 self-start md:sticky md:top-24 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto`}
            >
              <h2 className="text-sunny-gold font-bold text-sm mb-3 px-2.5">
                Documentation
              </h2>
              {sections.length > 0 ? (
                <DocNav
                  sections={sections}
                  currentPath={currentPath}
                  onSelect={loadFile}
                />
              ) : (
                <p className="text-sunny-cream-muted text-xs px-2 italic">
                  Loading...
                </p>
              )}
            </aside>

            {/* Content area */}
            <article className="min-w-0 rounded-md bg-sunny-surface border border-sunny-surface-light p-6 md:p-8">
              {/* Breadcrumb */}
              <nav className="mb-6 flex items-center gap-1.5 text-xs" aria-label="Breadcrumb">
                {(() => {
                  // Build breadcrumb from section/subsection labels
                  const crumbs: { label: string; path?: string }[] = [];
                  for (const s of sections) {
                    const inItems = s.items.some((i) => i.path === currentPath);
                    const inSub = s.subsections?.find((sub) =>
                      sub.items.some((i) => i.path === currentPath)
                    );
                    if (inItems || inSub) {
                      crumbs.push({ label: s.label });
                      if (inSub) crumbs.push({ label: inSub.label });
                      // File name
                      const fileName = currentPath.split("/").pop() ?? currentPath;
                      crumbs.push({ label: fileName });
                      break;
                    }
                  }
                  if (crumbs.length === 0) {
                    crumbs.push({ label: currentPath.split("/").pop() ?? currentPath });
                  }

                  return crumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <ChevronRight size={12} className="text-sunny-cream-muted/50" />
                      )}
                      <span
                        className={
                          i === crumbs.length - 1
                            ? "text-sunny-gold font-medium"
                            : "text-sunny-cream-muted"
                        }
                      >
                        {crumb.label}
                      </span>
                    </span>
                  ));
                })()}
              </nav>

              {loading ? (
                <p className="text-sunny-cream-muted italic">Loading...</p>
              ) : (
                <div className="docs-markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkDefaultCodeLang]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-sunny-gold mb-4 mt-6 first:mt-0 border-b border-sunny-surface-light pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-sunny-gold mb-3 mt-6">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-sunny-gold mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-base font-semibold text-sunny-cream mb-2 mt-3">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p className="text-sunny-cream text-sm leading-relaxed mb-3">
                          {children}
                        </p>
                      ),
                      a: ({ href, children }) => {
                        // Internal doc link: relative .md file or docs/ directory
                        const isExternal = href?.startsWith("http") || href?.startsWith("mailto:");
                        const isDocLink = !isExternal && href && (href.endsWith(".md") || href.startsWith("docs/"));

                        if (isDocLink) {
                          // Resolve relative path based on current file location
                          let resolved = href;
                          if (!href.startsWith("docs/") && !href.startsWith("README.md")) {
                            const dir = currentPath.substring(0, currentPath.lastIndexOf("/"));
                            resolved = dir ? `${dir}/${href}` : href;
                          }
                          // Strip trailing slash for directory refs
                          resolved = resolved.replace(/\/$/, "");
                          // If it's a directory, try its README
                          if (!resolved.endsWith(".md")) {
                            resolved = `${resolved}/README.md`;
                          }

                          return (
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); loadFile(resolved); }}
                              className="text-sunny-gold hover:text-sunny-gold-muted underline cursor-pointer"
                            >
                              {children}
                            </a>
                          );
                        }

                        return (
                          <a
                            href={href}
                            className="text-sunny-gold hover:text-sunny-gold-muted underline"
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                          >
                            {children}
                          </a>
                        );
                      },
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside text-sunny-cream text-sm mb-3 space-y-1 ml-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-sunny-cream text-sm mb-3 space-y-1 ml-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sunny-cream text-sm">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-sunny-gold-muted pl-4 my-3 italic text-sunny-cream-muted">
                          {children}
                        </blockquote>
                      ),
                      hr: () => (
                        <hr className="border-sunny-surface-light my-6" />
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="w-full text-sm border-collapse">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-sunny-surface-light">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="text-left text-sunny-gold font-semibold px-3 py-2 border border-sunny-surface-light">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="text-sunny-cream px-3 py-2 border border-sunny-surface-light">
                          {children}
                        </td>
                      ),
                      img: ({ src, alt }) => {
                        const isMermaid = typeof src === "string" && src.includes("mermaid.ink/");
                        if (isMermaid) {
                          return (
                            <div className="bg-sunny-bg border border-sunny-surface-light rounded-md p-4 my-3 overflow-x-auto">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={alt ?? ""}
                                className="block w-full"
                              />
                            </div>
                          );
                        }
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={alt ?? ""}
                            className="inline-block max-w-full rounded-md align-middle mr-1"
                          />
                        );
                      },
                      strong: ({ children }) => (
                        <strong className="font-bold text-sunny-cream">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-sunny-cream-muted">
                          {children}
                        </em>
                      ),
                      code: ({ className, children }) => {
                        const match = /language-(\w+)/.exec(className ?? "");
                        const lang = match?.[1];

                        // Block code with a real language → syntax highlight
                        if (lang && lang !== "plaintext") {
                          return (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={lang}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                padding: 0,
                                background: "transparent",
                                fontSize: "13px",
                                lineHeight: 1.4,
                                fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
                              }}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          );
                        }

                        // Plaintext block code (ASCII diagrams, etc.)
                        if (className) {
                          return (
                            <code
                              className="block text-[13px] text-sunny-cream whitespace-pre"
                              style={{ fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace", lineHeight: 1.4 }}
                            >
                              {children}
                            </code>
                          );
                        }

                        // Inline code
                        return (
                          <code
                            className="bg-sunny-surface-light text-sunny-gold px-1.5 py-0.5 rounded text-xs"
                            style={{ fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace" }}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children, ...props }) => {
                        // Check if the child code element is plaintext (ASCII diagram)
                        const child = Array.isArray(children) ? children[0] : children;
                        const isPlaintext =
                          child &&
                          typeof child === "object" &&
                          "props" in child &&
                          typeof child.props?.className === "string" &&
                          child.props.className.includes("language-plaintext");

                        return (
                          <pre
                            {...props}
                            className="bg-sunny-bg border border-sunny-surface-light rounded-md p-4 my-3 overflow-x-auto"
                            style={{
                              fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
                              ...(isPlaintext ? { width: "fit-content", marginInline: "auto" } : {}),
                            }}
                          >
                            {children}
                          </pre>
                        );
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
