"use client";

import type { ContributionWeek } from "@/lib/github";

interface ContributionHeatmapProps {
  calendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
}

// Warm palette mapped to contribution levels (replacing GitHub's default greens)
const LEVEL_COLORS = [
  "rgba(26, 18, 9, 0.6)",       // 0 contributions — dark
  "rgba(184, 134, 11, 0.25)",   // low
  "rgba(184, 134, 11, 0.45)",   // medium-low
  "rgba(240, 180, 41, 0.65)",   // medium-high
  "rgba(240, 180, 41, 0.9)",    // high
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

export default function ContributionHeatmap({
  calendar,
}: ContributionHeatmapProps) {
  const { weeks, totalContributions } = calendar;

  if (weeks.length === 0) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-4"
          >
            Contribution Activity
          </h2>
          <p className="text-sunny-cream-muted/60 text-sm">
            GitHub data unavailable
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

  return (
    <section className="py-16 px-6">
      <div
        className="max-w-5xl mx-auto p-6 sm:p-8"
        style={{
          background: "rgba(26, 18, 9, 0.85)",
          borderRadius: 16,
          border: "1px solid rgba(184, 134, 11, 0.15)",
        }}
      >
        <div className="flex items-baseline justify-between mb-6">
          <h2
            className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream"
          >
            Contribution Activity
          </h2>
          <span className="text-sunny-gold text-sm font-medium">
            {totalContributions.toLocaleString()} contributions
          </span>
        </div>

        {/* Month labels */}
        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: weeks.length * 14 + 32 }}>
            <div className="flex mb-1 ml-8" style={{ gap: 0 }}>
              {monthPositions.map(({ label, col }, i) => {
                const nextCol = monthPositions[i + 1]?.col ?? weeks.length;
                const span = nextCol - col;
                return (
                  <span
                    key={`${label}-${col}`}
                    className="text-xs text-sunny-cream-muted/50"
                    style={{ width: span * 14, flexShrink: 0 }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-0">
              {/* Day-of-week labels */}
              <div className="flex flex-col justify-between mr-1 py-px" style={{ height: 7 * 14 - 2 }}>
                <span className="text-[10px] text-sunny-cream-muted/40 leading-none">Mon</span>
                <span className="text-[10px] text-sunny-cream-muted/40 leading-none">Wed</span>
                <span className="text-[10px] text-sunny-cream-muted/40 leading-none">Fri</span>
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
                          title={`${day.contributionCount} contribution${day.contributionCount !== 1 ? "s" : ""} on ${day.date}`}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            background: LEVEL_COLORS[level],
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4">
          <span className="text-xs text-sunny-cream-muted/40 mr-1">Less</span>
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
          <span className="text-xs text-sunny-cream-muted/40 ml-1">More</span>
        </div>
      </div>
    </section>
  );
}
