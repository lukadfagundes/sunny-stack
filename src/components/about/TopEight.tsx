"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { profile, topEight } from "@/lib/data/personal";

export default function TopEight() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      {/* MySpace Friend Space header */}
      <div
        className="bg-sunny-surface px-3 py-2 flex items-center justify-between"
        style={{ border: "1px solid #B8860B", borderRadius: "4px 4px 0 0" }}
      >
        <span className="text-sunny-gold font-bold text-sm">
          {profile.name}&apos;s Friend Space
        </span>
      </div>

      <div className="bg-sunny-surface rounded-b-md px-4 py-3 border-x border-b border-sunny-surface-light">
        <p className="text-xs text-sunny-cream-muted mb-3">
          {profile.name} has{" "}
          <span className="text-sunny-gold font-bold">{topEight.length}</span>{" "}
          friends.
        </p>

        {/* 4x2 grid of friends */}
        <div className="grid grid-cols-4 gap-3">
          {topEight.map((item, i) => (
            <div
              key={item.name}
              className="relative text-center"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Avatar placeholder */}
              <div
                className="w-full aspect-square flex items-center justify-center bg-sunny-bg mb-1 transition-colors"
                style={{
                  border: `1px solid ${
                    hoveredIndex === i ? "#F0B429" : "#3D2E1F"
                  }`,
                }}
              >
                <User className="w-6 h-6 text-sunny-cream-muted" />
              </div>
              <span className="text-xs text-sunny-gold hover:underline cursor-pointer block truncate">
                {item.name}
              </span>

              {/* Tooltip */}
              {hoveredIndex === i && item.reason !== "Placeholder" && (
                <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-sunny-surface-light rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                  <p className="text-xs text-sunny-cream">{item.reason}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-sunny-surface-light" />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-sunny-cream-muted mt-3">
          View {profile.name}&apos;s Friends:{" "}
          <span className="text-sunny-gold hover:underline cursor-pointer">
            All
          </span>
          {" | "}
          <span className="text-sunny-gold hover:underline cursor-pointer">
            Online
          </span>
        </p>
      </div>
    </div>
  );
}
