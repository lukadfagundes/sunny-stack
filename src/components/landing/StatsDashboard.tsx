"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FolderGit2,
  Star,
} from "lucide-react";

interface StatsDashboardProps {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalRepos: number;
  totalStars: number;
  totalContributions: number;
}

interface StatCardProps {
  icon: typeof GitCommit;
  label: string;
  value: number;
  delay: number;
}

function StatCard({ icon: Icon, label, value, delay }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start: number;
    let frame: number;
    const duration = 1500;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex flex-col items-center p-5 sm:p-6"
      style={{
        background: "rgba(42, 31, 20, 0.7)",
        borderRadius: 12,
        border: "1px solid rgba(184, 134, 11, 0.15)",
      }}
    >
      <Icon className="w-5 h-5 text-sunny-gold/60 mb-2" />
      <span className="text-3xl sm:text-4xl font-bold text-sunny-gold tabular-nums">
        {display.toLocaleString()}
      </span>
      <span className="mt-1 text-xs sm:text-sm text-sunny-cream-muted">
        {label}
      </span>
    </motion.div>
  );
}

export default function StatsDashboard({
  totalCommits,
  totalPRs,
  totalIssues,
  totalRepos,
  totalStars,
  totalContributions,
}: StatsDashboardProps) {
  const hasData = totalContributions > 0;

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
          By the Numbers
        </h2>

        {!hasData ? (
          <p className="text-sunny-cream-muted/60 text-sm text-center">
            GitHub data unavailable
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard icon={GitCommit} label="Commits" value={totalCommits} delay={0} />
            <StatCard icon={GitPullRequest} label="PRs Merged" value={totalPRs} delay={0.05} />
            <StatCard icon={AlertCircle} label="Issues" value={totalIssues} delay={0.1} />
            <StatCard icon={FolderGit2} label="Public Repos" value={totalRepos} delay={0.15} />
            <StatCard icon={Star} label="Total Stars" value={totalStars} delay={0.2} />
          </div>
        )}
      </div>
    </section>
  );
}
