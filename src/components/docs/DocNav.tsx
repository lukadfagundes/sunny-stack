"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import type { DocFile } from "@/app/api/docs/route";

export interface NavSubgroup {
  id: string;
  label: string;
  items: { path: string; label: string }[];
}

export interface NavSubsection {
  id: string;
  label: string;
  items: { path: string; label: string }[];
  subgroups?: NavSubgroup[];
}

export interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: { path: string; label: string }[];
  subsections?: NavSubsection[];
}

/** Convert a filename like "getting-started.md" to "Getting Started" */
export function formatName(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .replace(/^ADR-(\d+)-/, "ADR-$1: ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Build structured navigation sections from the flat file tree */
export function buildSections(files: DocFile[]): NavSection[] {
  const sections: NavSection[] = [];

  // Root files -> "Overview" section
  const rootFiles = files.filter((f) => f.type === "file");
  if (rootFiles.length > 0) {
    sections.push({
      id: "overview",
      label: "Overview",
      icon: <Home size={16} />,
      items: rootFiles.map((f) => ({ path: f.path, label: formatName(f.name) })),
    });
  }

  // Process docs directory
  const docsDir = files.find((f) => f.type === "directory" && f.name === "docs");
  if (!docsDir?.children) return sections;

  // Docs hub README
  const docsReadme = docsDir.children.find((f) => f.type === "file" && f.name === "README.md");
  if (docsReadme) {
    sections[0]?.items.push({ path: docsReadme.path, label: "Docs Hub" });
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
        // Collect direct .md files in this subdirectory
        const subItems = entry.children
          .filter((e) => e.type === "file")
          .map((e) => ({
            path: e.path,
            label: formatName(e.name),
          }));

        // Collect nested subdirectories as subgroups (3rd level)
        const subgroups: NavSubgroup[] = [];
        for (const nested of entry.children) {
          if (nested.type === "directory" && nested.children) {
            const nestedFiles = nested.children
              .filter((e) => e.type === "file")
              .map((e) => ({
                path: e.path,
                label: formatName(e.name),
              }));
            if (nestedFiles.length > 0) {
              subgroups.push({
                id: nested.path,
                label: formatName(nested.name),
                items: nestedFiles,
              });
            }
          }
        }

        if (subItems.length > 0 || subgroups.length > 0) {
          subsections.push({
            id: entry.path,
            label: formatName(entry.name),
            items: subItems,
            subgroups: subgroups.length > 0 ? subgroups : undefined,
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

/** Compute which sections/subsections/subgroups should be expanded for a given path */
export function getAutoExpanded(sections: NavSection[], path: string): Set<string> {
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
        if (sub.subgroups) {
          for (const sg of sub.subgroups) {
            if (sg.items.some((i) => i.path === path)) {
              result.add(s.id);
              result.add(sub.id);
              result.add(sg.id);
            }
          }
        }
      }
    }
  }
  if (result.size === 0 && sections.length > 0) result.add(sections[0].id);
  return result;
}

export default function DocNav({
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
            sub.items.some((i) => i.path === currentPath) ||
            sub.subgroups?.some((sg) => sg.items.some((i) => i.path === currentPath))
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
                  const subActive =
                    sub.items.some((i) => i.path === currentPath) ||
                    sub.subgroups?.some((sg) => sg.items.some((i) => i.path === currentPath));

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

                          {sub.subgroups?.map((sg) => {
                            const sgOpen = expanded.has(sg.id);
                            const sgActive = sg.items.some((i) => i.path === currentPath);

                            return (
                              <div key={sg.id} className="mt-0.5">
                                <button
                                  onClick={() => toggle(sg.id)}
                                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                                    sgActive
                                      ? "text-sunny-gold font-medium"
                                      : "text-sunny-cream-muted hover:text-sunny-cream hover:bg-sunny-surface-light/50"
                                  }`}
                                >
                                  {sgOpen ? (
                                    <ChevronDown size={11} className="flex-shrink-0 opacity-60" />
                                  ) : (
                                    <ChevronRight size={11} className="flex-shrink-0 opacity-60" />
                                  )}
                                  <span className="truncate">{sg.label}</span>
                                </button>

                                {sgOpen && (
                                  <div className="ml-3 border-l border-sunny-surface-light/30 pl-2">
                                    {sg.items.map((item) => (
                                      <button
                                        key={item.path}
                                        onClick={() => onSelect(item.path)}
                                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                                          currentPath === item.path
                                            ? "bg-sunny-surface-light text-sunny-gold font-medium"
                                            : "text-sunny-cream-muted hover:text-sunny-cream hover:bg-sunny-surface-light/50"
                                        }`}
                                      >
                                        <FileText size={11} className="flex-shrink-0 opacity-60" />
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
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
