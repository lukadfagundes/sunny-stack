"use client";

import { interests } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

export default function InterestsTable() {
  return (
    <div>
      <SectionHeader title="Interests" />
      <div className="rounded-b-md overflow-hidden border-x border-b border-sunny-surface-light">
        {interests.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] text-sm ${
              i < interests.length - 1
                ? "border-b border-sunny-surface-light"
                : ""
            }`}
            style={{
              backgroundColor: i % 2 === 0 ? "#2A1F14" : "#1A1209",
            }}
          >
            <span
              className="text-sunny-gold font-medium px-4 py-3"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              {row.label}
            </span>
            <span
              className="text-sunny-cream px-4 py-3"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
