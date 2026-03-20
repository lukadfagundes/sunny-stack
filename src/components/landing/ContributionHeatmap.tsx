"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { ContributionWeek } from "@/lib/github";

interface ContributionHeatmapProps {
  calendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
}

// Warm palette — parchment tones for the treasure map
const LEVEL_COLORS = [
  "rgba(42, 31, 20, 0.4)",        // 0 — unexplored territory
  "rgba(184, 134, 11, 0.3)",      // low — faint trail
  "rgba(212, 160, 23, 0.5)",      // medium-low
  "rgba(240, 180, 41, 0.7)",      // medium-high — well-traveled
  "rgba(245, 200, 66, 0.95)",     // high — gold strike
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Compass Rose SVG
function CompassRose() {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="w-12 h-12 sm:w-16 sm:h-16">
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" stroke="rgba(184, 134, 11, 0.3)" strokeWidth="1" fill="none" />
      <circle cx="32" cy="32" r="22" stroke="rgba(184, 134, 11, 0.15)" strokeWidth="0.5" fill="none" />
      {/* Cardinal points */}
      <path d="M32 4 L35 28 L32 20 L29 28 Z" fill="rgba(240, 180, 41, 0.8)" /> {/* N */}
      <path d="M32 60 L29 36 L32 44 L35 36 Z" fill="rgba(184, 134, 11, 0.4)" /> {/* S */}
      <path d="M60 32 L36 29 L44 32 L36 35 Z" fill="rgba(184, 134, 11, 0.4)" /> {/* E */}
      <path d="M4 32 L28 35 L20 32 L28 29 Z" fill="rgba(184, 134, 11, 0.4)" /> {/* W */}
      {/* Intercardinal points */}
      <path d="M50 14 L37 27 L40 25 L37 30 Z" fill="rgba(184, 134, 11, 0.2)" />
      <path d="M14 50 L27 37 L24 39 L27 34 Z" fill="rgba(184, 134, 11, 0.2)" />
      <path d="M50 50 L37 37 L37 34 L40 39 Z" fill="rgba(184, 134, 11, 0.2)" />
      <path d="M14 14 L27 27 L27 30 L24 25 Z" fill="rgba(184, 134, 11, 0.2)" />
      {/* Center dot */}
      <circle cx="32" cy="32" r="2.5" fill="rgba(240, 180, 41, 0.7)" />
      {/* Labels */}
      <text x="32" y="12" textAnchor="middle" fill="rgba(240, 180, 41, 0.6)" fontSize="5" fontFamily="serif">N</text>
      <text x="32" y="58" textAnchor="middle" fill="rgba(184, 134, 11, 0.4)" fontSize="5" fontFamily="serif">S</text>
      <text x="55" y="34" textAnchor="middle" fill="rgba(184, 134, 11, 0.4)" fontSize="5" fontFamily="serif">E</text>
      <text x="9" y="34" textAnchor="middle" fill="rgba(184, 134, 11, 0.4)" fontSize="5" fontFamily="serif">W</text>
    </svg>
  );
}

interface TooltipData {
  date: string;
  count: number;
  x: number;
  y: number;
}

export default function ContributionHeatmap({
  calendar,
}: ContributionHeatmapProps) {
  const { weeks, totalContributions } = calendar;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  if (weeks.length === 0) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-4">
            The Captain&apos;s Chart
          </h2>
          <p className="text-sunny-cream-muted/60 text-sm italic">
            No charts available — the seas remain uncharted
          </p>
        </div>
      </section>
    );
  }

  // Calculate month label positions
  const monthPositions: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIdx) => {
    const firstDay = week.contributionDays[0];
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month], col: weekIdx });
        lastMonth = month;
      }
    }
  });

  function handleCellHover(
    e: React.MouseEvent<HTMLDivElement>,
    date: string,
    count: number
  ) {
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;
    setTooltip({
      date,
      count,
      x: e.clientX - gridRect.left,
      y: e.clientY - gridRect.top,
    });
  }

  return (
    <section className="py-16 px-6">
      <motion.div
        ref={sectionRef}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl mx-auto relative"
        style={{
          borderRadius: 16,
          border: "1px solid rgba(184, 134, 11, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Parchment background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(62, 45, 28, 0.95) 0%, rgba(36, 26, 16, 0.98) 60%, rgba(26, 18, 9, 0.99) 100%)",
          }}
        />

        {/* Burnt edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 0 60px 20px rgba(10, 6, 3, 0.6), inset 0 0 120px 40px rgba(10, 6, 3, 0.3)",
          }}
        />

        {/* Faint grid lines (map-like) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(184, 134, 11, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(184, 134, 11, 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {/* Header with compass */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream italic">
                The Captain&apos;s Chart
              </h2>
              <p className="text-sunny-cream-muted/40 text-xs sm:text-sm mt-1 italic font-serif">
                {totalContributions.toLocaleString()} territories charted this voyage
              </p>
            </div>
            <div className="opacity-60">
              <CompassRose />
            </div>
          </div>

          {/* Map Grid */}
          <div className="overflow-x-auto pb-2" ref={gridRef}>
            <div style={{ minWidth: weeks.length * 14 + 32, position: "relative" }}>
              {/* Month labels — styled as map region markers */}
              <div className="flex mb-1.5 ml-8" style={{ gap: 0 }}>
                {monthPositions.map(({ label, col }, i) => {
                  const nextCol = monthPositions[i + 1]?.col ?? weeks.length;
                  const span = nextCol - col;
                  return (
                    <span
                      key={`${label}-${col}`}
                      className="text-xs font-serif italic"
                      style={{
                        width: span * 14,
                        flexShrink: 0,
                        color: "rgba(240, 180, 41, 0.45)",
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="flex gap-0">
                {/* Day-of-week labels */}
                <div
                  className="flex flex-col justify-between mr-1 py-px"
                  style={{ height: 7 * 14 - 2 }}
                >
                  <span className="text-[10px] text-sunny-cream-muted/30 leading-none font-serif italic">Mon</span>
                  <span className="text-[10px] text-sunny-cream-muted/30 leading-none font-serif italic">Wed</span>
                  <span className="text-[10px] text-sunny-cream-muted/30 leading-none font-serif italic">Fri</span>
                </div>

                {/* Week columns */}
                <div className="flex" style={{ gap: 2 }}>
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col" style={{ gap: 2 }}>
                      {week.contributionDays.map((day) => {
                        const level = getLevel(day.contributionCount);
                        return (
                          <div
                            key={day.date}
                            onMouseEnter={(e) =>
                              handleCellHover(e, day.date, day.contributionCount)
                            }
                            onMouseLeave={() => setTooltip(null)}
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: level >= 3 ? 3 : 2,
                              background: LEVEL_COLORS[level],
                              boxShadow:
                                level >= 4
                                  ? "0 0 4px rgba(240, 180, 41, 0.4)"
                                  : level >= 3
                                    ? "0 0 2px rgba(240, 180, 41, 0.2)"
                                    : "none",
                              cursor: "crosshair",
                              transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            }}
                            onMouseOver={(e) => {
                              (e.currentTarget as HTMLElement).style.transform = "scale(1.4)";
                              (e.currentTarget as HTMLElement).style.boxShadow =
                                "0 0 8px rgba(240, 180, 41, 0.6)";
                            }}
                            onMouseOut={(e) => {
                              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                              (e.currentTarget as HTMLElement).style.boxShadow =
                                level >= 4
                                  ? "0 0 4px rgba(240, 180, 41, 0.4)"
                                  : level >= 3
                                    ? "0 0 2px rgba(240, 180, 41, 0.2)"
                                    : "none";
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y - 48,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className="px-3 py-1.5 text-xs font-serif whitespace-nowrap"
                    style={{
                      background: "rgba(36, 26, 16, 0.95)",
                      border: "1px solid rgba(184, 134, 11, 0.3)",
                      borderRadius: 6,
                      color: "#F5E6D3",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  >
                    <span className="text-sunny-gold font-bold">{tooltip.count}</span>
                    {" "}contribution{tooltip.count !== 1 ? "s" : ""} — {tooltip.date}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend — styled as map key */}
          <div className="flex items-center justify-between mt-5">
            {/* Decorative dashed route line */}
            <div className="flex-1 mr-4" style={{ borderTop: "1px dashed rgba(184, 134, 11, 0.15)" }} />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-sunny-cream-muted/30 mr-1 font-serif italic">Uncharted</span>
              {LEVEL_COLORS.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: color,
                  }}
                />
              ))}
              <span className="text-xs text-sunny-cream-muted/30 ml-1 font-serif italic">Gold Strike</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
