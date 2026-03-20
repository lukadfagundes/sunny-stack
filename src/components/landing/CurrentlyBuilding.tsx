"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Hammer, ExternalLink } from "lucide-react";
import type { GitHubRepo } from "@/lib/github";

interface CurrentlyBuildingProps {
  repos: GitHubRepo[];
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function CurrentlyBuilding({ repos }: CurrentlyBuildingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  // Most recently pushed public repo
  const latest = repos[0];

  if (!latest) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-4">
            Currently Building
          </h2>
          <p className="text-sunny-cream-muted/60 text-sm">
            GitHub data unavailable
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6">
      <div
        ref={ref}
        className="max-w-5xl mx-auto p-6 sm:p-8"
        style={{
          background: "rgba(26, 18, 9, 0.85)",
          borderRadius: 16,
          border: "1px solid rgba(184, 134, 11, 0.15)",
        }}
      >
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-6 text-center">
          Currently Building
        </h2>

        <motion.a
          href={latest.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 mx-auto max-w-xl transition-colors"
          style={{
            background: "rgba(42, 31, 20, 0.7)",
            borderRadius: 12,
            border: "1px solid rgba(240, 180, 41, 0.25)",
          }}
        >
          {/* Pulsing beacon */}
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
              style={{
                borderRadius: 12,
                background: "rgba(240, 180, 41, 0.15)",
                border: "1px solid rgba(240, 180, 41, 0.3)",
              }}
            >
              <Hammer className="w-5 h-5 sm:w-6 sm:h-6 text-sunny-gold" />
            </div>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 animate-ping"
              style={{
                borderRadius: 12,
                border: "1px solid rgba(240, 180, 41, 0.4)",
                animationDuration: "2s",
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-medium text-sunny-cream group-hover:text-sunny-gold transition-colors truncate">
                {latest.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-sunny-cream-muted/30 group-hover:text-sunny-gold/60 transition-colors shrink-0" />
            </div>
            {latest.description && (
              <p className="text-sm text-sunny-cream-muted/60 truncate mt-0.5">
                {latest.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {latest.primaryLanguage && (
                <div className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: latest.primaryLanguage.color,
                    }}
                  />
                  <span className="text-xs text-sunny-cream-muted/50">
                    {latest.primaryLanguage.name}
                  </span>
                </div>
              )}
              <span className="text-xs text-sunny-gold/60">
                Last push {timeAgo(latest.pushedAt)}
              </span>
            </div>
          </div>
        </motion.a>
      </div>
    </section>
  );
}
