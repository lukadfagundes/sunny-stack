"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, Download, Globe, X } from "lucide-react";
import type { ProjectData, ProjectCategory } from "@/lib/data/types";

const ACCENT_BORDER_COLOR: Record<ProjectCategory, string> = {
  professional: "rgba(240, 180, 41, 0.4)",
  personal: "rgba(220, 38, 38, 0.4)",
  contribution: "rgba(196, 168, 130, 0.4)",
};

const ACCENT_COLOR: Record<ProjectCategory, string> = {
  professional: "text-sunny-gold",
  personal: "text-sunny-red",
  contribution: "text-sunny-cream-muted",
};

function getLinkIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("github") || l.includes("fork")) return Github;
  if (l.includes("download")) return Download;
  if (l.includes("live") || l.includes("app")) return Globe;
  return ExternalLink;
}

const SPRING = { type: "spring" as const, stiffness: 200, damping: 30 };

interface ProjectCardProps {
  project: ProjectData;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ProjectCard({
  project,
  isExpanded,
  onToggle,
}: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isExpanded) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * -8, y: x * 8 });
    },
    [isExpanded],
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const accentClass = ACCENT_COLOR[project.category];
  const borderColor = ACCENT_BORDER_COLOR[project.category];

  return (
    <motion.div
      layout
      className={isExpanded ? "col-span-full" : ""}
      transition={{ layout: SPRING }}
      style={{ borderRadius: 8 }}
    >
      <motion.div
        ref={cardRef}
        layout="position"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => !isExpanded && onToggle()}
        className={`bg-sunny-surface overflow-hidden ${
          isExpanded ? "" : "cursor-pointer"
        }`}
        style={{
          perspective: "800px",
          borderRadius: 8,
          border: `1px solid ${borderColor}`,
        }}
        transition={{ layout: SPRING }}
      >
        <div
          className="transition-transform duration-200 ease-out"
          style={
            isExpanded
              ? undefined
              : {
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                }
          }
        >
          {/* ── Closed state header (always visible) ── */}
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-sunny-cream mb-1">
                  {project.title}
                </h3>
                <p className="text-sm text-sunny-cream-muted leading-relaxed">
                  {project.tagline}
                </p>
              </div>

              {isExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-sunny-surface-light transition-colors text-sunny-cream-muted hover:text-sunny-cream"
                  aria-label="Close project details"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Tech stack pills (compact in closed, full in expanded) */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(isExpanded
                ? project.techStack
                : project.techStack.slice(0, 5)
              ).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-xs bg-sunny-surface-light text-sunny-cream-muted"
                  style={{ borderRadius: 9999 }}
                >
                  {tech}
                </span>
              ))}
              {!isExpanded && project.techStack.length > 5 && (
                <span
                  className="px-2 py-0.5 text-xs bg-sunny-surface-light text-sunny-cream-muted"
                  style={{ borderRadius: 9999 }}
                >
                  +{project.techStack.length - 5}
                </span>
              )}
            </div>
          </div>

          {/* ── Expanded state content ── */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: SPRING,
                  opacity: { duration: 0.2, delay: 0.08 },
                }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-6 sm:px-6 border-t border-sunny-surface-light pt-5">
                  {/* Description */}
                  <p className="text-sunny-cream/90 leading-relaxed mb-6">
                    {project.description}
                  </p>

                  {/* Features */}
                  {project.features.length > 0 && (
                    <div className="mb-6">
                      <h4
                        className={`text-sm font-semibold uppercase tracking-wider ${accentClass} mb-3`}
                      >
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {project.features.map((feature) => (
                          <li key={feature.label} className="flex gap-2">
                            <span
                              className={`${accentClass} mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current`}
                            />
                            <div>
                              <span className="text-sunny-cream font-medium text-sm">
                                {feature.label}
                              </span>
                              <span className="text-sunny-cream-muted text-sm">
                                {" - "}
                                {feature.description}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Links */}
                  {project.links.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {project.links.map((link) => {
                        const Icon = getLinkIcon(link.label);
                        return (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-sunny-surface-light hover:bg-sunny-wood/40 text-sunny-cream text-sm transition-colors"
                            style={{ borderRadius: 8 }}
                          >
                            <Icon className="w-4 h-4" />
                            {link.label}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  {project.footer && (
                    <p className="mt-4 text-xs text-sunny-cream-muted/70 italic">
                      {project.footer}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
