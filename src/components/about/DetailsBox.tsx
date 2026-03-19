"use client";

import { details } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

export default function DetailsBox() {
  return (
    <div>
      <SectionHeader title={`Luka's Details`} />
      <div className="bg-sunny-surface rounded-b-md overflow-hidden border-x border-b border-sunny-surface-light">
        {details.map((detail, i) => (
          <div
            key={detail.label}
            className={`grid grid-cols-[110px_1fr] text-xs ${
              i < details.length - 1
                ? "border-b border-sunny-surface-light"
                : ""
            }`}
            style={{
              backgroundColor: i % 2 === 0 ? "#2A1F14" : "#1A1209",
            }}
          >
            <span className="text-sunny-cream-muted font-medium px-3 py-2">
              {detail.label}:
            </span>
            <span className="text-sunny-cream px-3 py-2">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
