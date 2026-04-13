"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

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
      { name: "Lua", color: "#000080" },
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
      { name: "Electron", color: "#47848F" },
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
      { name: "SQLite", color: "#003B57" },
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

// ── Crate Item ──

function CrateItem({
  item,
  delay,
  isInView,
}: {
  item: TechItem;
  delay: number;
  isInView: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="relative cursor-pointer select-none"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={{ perspective: 400 }}
    >
      <div
        className="relative px-3 py-2 transition-all duration-300"
        style={{
          background: isOpen
            ? "rgba(62, 45, 28, 0.9)"
            : "rgba(42, 31, 20, 0.7)",
          borderRadius: 6,
          border: `1px solid ${
            isOpen ? `${item.color}50` : "rgba(107, 66, 38, 0.3)"
          }`,
          boxShadow: isOpen
            ? `0 4px 20px ${item.color}20, inset 0 0 20px ${item.color}08`
            : "inset 0 2px 4px rgba(0,0,0,0.2)",
          transform: isOpen ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {!isOpen && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ borderRadius: 6 }}
          >
            <div
              className="absolute w-full opacity-[0.06]"
              style={{
                top: "33%",
                height: 1,
                background: "rgba(184, 134, 11, 1)",
              }}
            />
            <div
              className="absolute w-full opacity-[0.06]"
              style={{
                top: "66%",
                height: 1,
                background: "rgba(184, 134, 11, 1)",
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 relative">
          <div
            className="transition-all duration-300"
            style={{
              width: isOpen ? 10 : 8,
              height: isOpen ? 10 : 8,
              borderRadius: "50%",
              background: item.color,
              boxShadow: isOpen
                ? `0 0 10px ${item.color}80, 0 0 20px ${item.color}40`
                : `0 0 4px ${item.color}30`,
              transition: "all 0.3s ease",
            }}
          />
          <span
            className="text-sm transition-colors duration-300"
            style={{
              color: isOpen ? item.color : "rgba(245, 230, 211, 0.6)",
              textShadow: isOpen ? `0 0 8px ${item.color}30` : "none",
            }}
          >
            {item.name}
          </span>
        </div>

        <div
          className="absolute top-0 left-1 right-1 transition-all duration-300"
          style={{
            height: 2,
            borderRadius: "2px 2px 0 0",
            background: isOpen
              ? `linear-gradient(90deg, transparent, ${item.color}60, transparent)`
              : "transparent",
            transform: isOpen ? "translateY(-2px)" : "translateY(0)",
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Category Shelf ──

function CategoryShelf({
  category,
  shelfIndex,
}: {
  category: TechCategory;
  shelfIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref}>
      <div className="flex items-center gap-2 mb-2">
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 1,
            background: "rgba(184, 134, 11, 0.3)",
          }}
        />
        <h4
          className="text-xs font-medium uppercase tracking-wider font-serif"
          style={{ color: "rgba(240, 180, 41, 0.5)" }}
        >
          {category.label}
        </h4>
        <div
          className="flex-1"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, rgba(107, 66, 38, 0.3), transparent)",
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {category.items.map((item, i) => (
          <CrateItem
            key={item.name}
            item={item}
            delay={shelfIndex * 0.1 + i * 0.04}
            isInView={isInView}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

export default function TechArsenal() {
  return (
    <div>
      <h3 className="text-lg sm:text-xl font-serif font-bold text-sunny-cream mb-5 text-center italic">
        The Cargo Hold
      </h3>

      <div className="space-y-4">
        {TECH_CATEGORIES.map((cat, i) => (
          <CategoryShelf key={cat.label} category={cat} shelfIndex={i} />
        ))}
      </div>
    </div>
  );
}
