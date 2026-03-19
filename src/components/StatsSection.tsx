"use client";

import StatCounter from "./StatCounter";

const STATS = [
  { value: 8, label: "Projects Built", suffix: "+" },
  { value: 20, label: "Technologies Used", suffix: "+" },
  { value: 1, label: "Year of Experience", suffix: "+" },
] as const;

export default function StatsSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STATS.map((stat) => (
          <StatCounter
            key={stat.label}
            value={stat.value}
            label={stat.label}
            suffix={stat.suffix}
          />
        ))}
      </div>
    </section>
  );
}
