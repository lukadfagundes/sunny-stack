"use client";

import { useState } from "react";
import { getProjectsByCategory } from "@/lib/data/projects";
import type { ProjectCategory } from "@/lib/data/types";
import CategorySection from "@/components/portfolio/CategorySection";
import ProjectCard from "@/components/portfolio/ProjectCard";

const CATEGORIES: ProjectCategory[] = [
  "professional",
  "personal",
  "contribution",
];

export default function PortfolioPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <main className="flex-1 relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-sunny-gold mb-12">
          Portfolio
        </h1>

        {CATEGORIES.map((category) => {
          const projects = getProjectsByCategory(category);
          if (projects.length === 0) return null;

          return (
            <CategorySection key={category} category={category}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isExpanded={expandedId === project.id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === project.id ? null : project.id
                    )
                  }
                />
              ))}
            </CategorySection>
          );
        })}
      </div>
    </main>
  );
}
