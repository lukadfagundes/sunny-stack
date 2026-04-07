"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import DocNav, { buildSections } from "@/components/docs/DocNav";
import type { DocFile } from "@/lib/docs";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";

interface DocsClientProps {
  files: DocFile[];
  initialPath: string;
  initialContent: string;
}

export default function DocsClient({
  files,
  initialPath,
  initialContent,
}: DocsClientProps) {
  const sections = useMemo(() => buildSections(files), [files]);
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadFile = useCallback(
    (filePath: string) => {
      setCurrentPath(filePath);
      setLoading(true);
      setSidebarOpen(false);
      router.push(`/docs?file=${encodeURIComponent(filePath)}`, {
        scroll: false,
      });

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
    },
    [router],
  );

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
            <article className="min-w-0 rounded-md bg-sunny-surface border border-sunny-surface-light p-4 sm:p-6 md:p-8">
              {/* Breadcrumb */}
              <nav
                className="mb-6 flex items-center gap-1.5 text-xs"
                aria-label="Breadcrumb"
              >
                {(() => {
                  const crumbs: { label: string }[] = [];
                  for (const s of sections) {
                    const inItems = s.items.some(
                      (i) => i.path === currentPath,
                    );
                    const inSub = s.subsections?.find((sub) =>
                      sub.items.some((i) => i.path === currentPath),
                    );
                    // Check subgroups (3rd level)
                    let inSubgroup:
                      | { sub: typeof inSub; sg: typeof inSub }
                      | undefined;
                    if (!inItems && !inSub) {
                      for (const sub of s.subsections ?? []) {
                        const sg = sub.subgroups?.find((g) =>
                          g.items.some((i) => i.path === currentPath),
                        );
                        if (sg) {
                          inSubgroup = { sub, sg };
                          break;
                        }
                      }
                    }
                    if (inItems || inSub || inSubgroup) {
                      crumbs.push({ label: s.label });
                      if (inSub) crumbs.push({ label: inSub.label });
                      if (inSubgroup) {
                        crumbs.push({ label: inSubgroup.sub!.label });
                        crumbs.push({ label: inSubgroup.sg!.label });
                      }
                      // File name
                      const fileName =
                        currentPath.split("/").pop() ?? currentPath;
                      crumbs.push({ label: fileName });
                      break;
                    }
                  }
                  if (crumbs.length === 0) {
                    crumbs.push({
                      label: currentPath.split("/").pop() ?? currentPath,
                    });
                  }

                  return crumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <ChevronRight
                          size={12}
                          className="text-sunny-cream-muted/50"
                        />
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
                <MarkdownRenderer
                  content={content}
                  currentPath={currentPath}
                  loadFile={loadFile}
                />
              )}
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
