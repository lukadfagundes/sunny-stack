"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContributionWeek } from "@/lib/github";

interface ContributionHeatmapProps {
  calendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
}

const LEVEL_COLORS = [
  "rgba(42, 31, 20, 0.4)",
  "rgba(184, 134, 11, 0.3)",
  "rgba(212, 160, 23, 0.5)",
  "rgba(240, 180, 41, 0.7)",
  "rgba(245, 200, 66, 0.95)",
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

function CompassRose() {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="w-10 h-10 sm:w-12 sm:h-12">
      <circle cx="32" cy="32" r="28" stroke="rgba(184, 134, 11, 0.3)" strokeWidth="1" fill="none" />
      <circle cx="32" cy="32" r="22" stroke="rgba(184, 134, 11, 0.15)" strokeWidth="0.5" fill="none" />
      <path d="M32 4 L35 28 L32 20 L29 28 Z" fill="rgba(240, 180, 41, 0.8)" />
      <path d="M32 60 L29 36 L32 44 L35 36 Z" fill="rgba(184, 134, 11, 0.4)" />
      <path d="M60 32 L36 29 L44 32 L36 35 Z" fill="rgba(184, 134, 11, 0.4)" />
      <path d="M4 32 L28 35 L20 32 L28 29 Z" fill="rgba(184, 134, 11, 0.4)" />
      <path d="M50 14 L37 27 L40 25 L37 30 Z" fill="rgba(184, 134, 11, 0.2)" />
      <path d="M14 50 L27 37 L24 39 L27 34 Z" fill="rgba(184, 134, 11, 0.2)" />
      <path d="M50 50 L37 37 L37 34 L40 39 Z" fill="rgba(184, 134, 11, 0.2)" />
      <path d="M14 14 L27 27 L27 30 L24 25 Z" fill="rgba(184, 134, 11, 0.2)" />
      <circle cx="32" cy="32" r="2.5" fill="rgba(240, 180, 41, 0.7)" />
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

// Cell size scales up to fill the panel
const CELL = 16;
const GAP = 3;
const STEP = CELL + GAP; // 19px per column
const DAY_LABEL_WIDTH = 32;

export default function ContributionHeatmap({
  calendar,
}: ContributionHeatmapProps) {
  const { weeks: allWeeks, totalContributions } = calendar;
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleWeeks, setVisibleWeeks] = useState(allWeeks.length);

  // Measure container width and show only as many weeks as fit
  const updateVisibleWeeks = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const available = el.clientWidth - DAY_LABEL_WIDTH;
    const maxWeeks = Math.floor(available / STEP);
    setVisibleWeeks(Math.min(Math.max(maxWeeks, 4), allWeeks.length));
  }, [allWeeks.length]);

  useEffect(() => {
    updateVisibleWeeks();
    window.addEventListener("resize", updateVisibleWeeks);
    return () => window.removeEventListener("resize", updateVisibleWeeks);
  }, [updateVisibleWeeks]);

  // Show the most recent N weeks
  const weeks = allWeeks.slice(-visibleWeeks);

  if (allWeeks.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg sm:text-xl font-serif font-bold text-sunny-cream italic mb-2">
          The Captain&apos;s Chart
        </h3>
        <p className="text-sunny-cream-muted/60 text-sm italic">
          No charts available — the seas remain uncharted
        </p>
      </div>
    );
  }

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

  const dayLabelWidth = DAY_LABEL_WIDTH;

  return (
    <div ref={containerRef}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-sunny-cream italic">
            The Captain&apos;s Chart
          </h3>
          <p className="text-sunny-cream-muted/40 text-xs mt-1 italic font-serif">
            {totalContributions.toLocaleString()} territories charted
          </p>
        </div>
        <div className="opacity-60">
          <CompassRose />
        </div>
      </div>

      <div className="pb-2" ref={gridRef}>
        <div style={{ position: "relative", width: "100%" }}>
          {/* Month labels */}
          <div className="flex mb-1.5" style={{ gap: 0, marginLeft: dayLabelWidth }}>
            {monthPositions.map(({ label, col }, i) => {
              const nextCol = monthPositions[i + 1]?.col ?? weeks.length;
              const span = nextCol - col;
              return (
                <span
                  key={`${label}-${col}`}
                  className="text-xs font-serif italic"
                  style={{
                    width: span * STEP,
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
            <div
              className="flex flex-col justify-between py-px shrink-0"
              style={{ height: 7 * STEP - GAP, width: dayLabelWidth }}
            >
              <span className="text-[10px] text-sunny-cream-muted/30 leading-none font-serif italic">Mon</span>
              <span className="text-[10px] text-sunny-cream-muted/30 leading-none font-serif italic">Wed</span>
              <span className="text-[10px] text-sunny-cream-muted/30 leading-none font-serif italic">Fri</span>
            </div>

            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col" style={{ gap: GAP }}>
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
                          width: CELL,
                          height: CELL,
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
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.3)";
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

      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-xs text-sunny-cream-muted/30 mr-1 font-serif italic">Uncharted</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 2,
              background: color,
            }}
          />
        ))}
        <span className="text-xs text-sunny-cream-muted/30 ml-1 font-serif italic">Gold Strike</span>
      </div>
    </div>
  );
}
