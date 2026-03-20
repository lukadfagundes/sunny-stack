"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TechItem {
  name: string;
  color: string;
}

interface TechCategory {
  label: string;
  items: TechItem[];
}

const TECH_CATEGORIES: TechCategory[] = [
  {
    label: "Languages",
    items: [
      { name: "TypeScript", color: "#3178C6" },
      { name: "JavaScript", color: "#F7DF1E" },
      { name: "Python", color: "#3776AB" },
      { name: "Java", color: "#ED8B00" },
      { name: "HTML/CSS", color: "#E34F26" },
      { name: "SQL", color: "#336791" },
    ],
  },
  {
    label: "Frameworks",
    items: [
      { name: "React", color: "#61DAFB" },
      { name: "Next.js", color: "#F5E6D3" },
      { name: "Node.js", color: "#339933" },
      { name: "Express", color: "#F5E6D3" },
      { name: "Tailwind CSS", color: "#06B6D4" },
      { name: "Discord.js", color: "#5865F2" },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Git", color: "#F05032" },
      { name: "Docker", color: "#2496ED" },
      { name: "Jest", color: "#C21325" },
      { name: "PostgreSQL", color: "#4169E1" },
      { name: "Prisma", color: "#2D3748" },
      { name: "Framer Motion", color: "#BB4B96" },
    ],
  },
  {
    label: "Cloud & Deploy",
    items: [
      { name: "Vercel", color: "#F5E6D3" },
      { name: "AWS", color: "#FF9900" },
      { name: "GitHub Actions", color: "#2088FF" },
      { name: "Supabase", color: "#3ECF8E" },
    ],
  },
];

function CategoryRow({
  category,
  delay,
}: {
  category: TechCategory;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref}>
      <h3 className="text-xs font-medium text-sunny-cream-muted/50 uppercase tracking-wider mb-3">
        {category.label}
      </h3>
      <div className="flex flex-wrap gap-2">
        {category.items.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: 0.3,
              delay: delay + i * 0.04,
              ease: "easeOut",
            }}
            className="group flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-default"
            style={{
              background: "rgba(42, 31, 20, 0.7)",
              borderRadius: 8,
              border: "1px solid rgba(184, 134, 11, 0.1)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: item.color,
                boxShadow: `0 0 6px ${item.color}40`,
              }}
            />
            <span className="text-sunny-cream-muted group-hover:text-sunny-cream transition-colors">
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function TechArsenal() {
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
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-8 text-center">
          Tech Arsenal
        </h2>

        <div className="space-y-6">
          {TECH_CATEGORIES.map((cat, i) => (
            <CategoryRow key={cat.label} category={cat} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
