"use client";

import { motion, LayoutGroup } from "framer-motion";
import type { ProjectCategory } from "@/lib/data/types";

const CATEGORY_CONFIG: Record<
  ProjectCategory,
  { label: string; accent: string; border: string }
> = {
  professional: {
    label: "Professional",
    accent: "text-sunny-gold",
    border: "border-sunny-gold",
  },
  personal: {
    label: "Personal",
    accent: "text-sunny-red",
    border: "border-sunny-red",
  },
  contribution: {
    label: "Contributions",
    accent: "text-sunny-cream-muted",
    border: "border-sunny-cream-muted",
  },
};

interface CategorySectionProps {
  category: ProjectCategory;
  children: React.ReactNode;
}

export default function CategorySection({
  category,
  children,
}: CategorySectionProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-16"
    >
      <div className="flex items-center gap-4 mb-8">
        <h2
          className={`font-display text-2xl sm:text-3xl font-bold ${config.accent}`}
        >
          {config.label}
        </h2>
        <div
          className={`flex-1 h-px border-t ${config.border} opacity-30`}
        />
      </div>

      <LayoutGroup id={category}>
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          transition={{ layout: { type: "spring", stiffness: 200, damping: 30 } }}
        >
          {children}
        </motion.div>
      </LayoutGroup>
    </motion.section>
  );
}
