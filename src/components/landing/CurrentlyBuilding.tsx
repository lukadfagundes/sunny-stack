"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);

  const topRepos = repos.slice(0, 3);

  if (topRepos.length === 0) {
    return (
      <div className="text-center py-4">
        <h3 className="text-lg sm:text-xl font-serif font-bold text-sunny-cream italic mb-2">
          Through the Spyglass
        </h3>
        <p className="text-sunny-cream-muted/60 text-sm italic font-serif">
          Nothing sighted on the horizon
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full">
      <h3 className="text-lg sm:text-xl font-serif font-bold text-sunny-cream mb-4 text-center italic">
        Through the Spyglass
      </h3>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex items-center justify-center"
      >
        {/* Spyglass frame — sized for mobile, scales up on sm+ */}
        <div
          className="relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Outer brass ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(184, 134, 11, 0.3), rgba(240, 180, 41, 0.5), rgba(184, 134, 11, 0.2), rgba(240, 180, 41, 0.4), rgba(184, 134, 11, 0.3))",
              padding: 4,
              transform: isHovered ? "scale(1.02)" : "scale(1)",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "conic-gradient(from 180deg, rgba(107, 66, 38, 0.4), rgba(184, 134, 11, 0.3), rgba(107, 66, 38, 0.5), rgba(184, 134, 11, 0.4), rgba(107, 66, 38, 0.4))",
                padding: 4,
              }}
            >
              <div className="w-full h-full rounded-full" style={{ background: "rgba(26, 18, 9, 0.95)" }} />
            </div>
          </div>

          {/* Inner lens area */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              top: 12,
              left: 12,
              right: 12,
              bottom: 12,
              background:
                "radial-gradient(circle at center, rgba(26, 18, 9, 0.7) 0%, rgba(13, 10, 6, 0.95) 80%)",
            }}
          >
            {/* Lens vignette */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 0 40px 20px rgba(10, 6, 3, 0.8), inset 0 0 80px 40px rgba(10, 6, 3, 0.4)",
              }}
            />

            {/* Lens glare */}
            <div
              className="absolute rounded-full pointer-events-none transition-opacity duration-500"
              style={{
                top: "8%",
                left: "12%",
                width: "30%",
                height: "18%",
                background: "radial-gradient(ellipse, rgba(245, 230, 211, 0.06) 0%, transparent 70%)",
                transform: "rotate(-30deg)",
                opacity: isHovered ? 0.6 : 0.3,
              }}
            />

            {/* Content inside the lens — 3 repos stacked */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-10">
              <div className="w-full space-y-3">
                {topRepos.map((repo, i) => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="text-sm sm:text-xl font-serif font-bold group-hover:text-sunny-gold transition-colors duration-200 truncate"
                        style={{ color: i === 0 ? "rgba(245, 230, 211, 0.9)" : "rgba(245, 230, 211, 0.6)" }}
                      >
                        {repo.name}
                      </span>
                      <ExternalLink
                        className="w-3.5 h-3.5 shrink-0 group-hover:text-sunny-gold/60 transition-colors duration-200"
                        style={{ color: "rgba(245, 230, 211, 0.15)" }}
                      />
                    </div>
                    <span
                      className="text-xs font-serif italic block mt-0.5"
                      style={{ color: "rgba(240, 180, 41, 0.4)" }}
                    >
                      {timeAgo(repo.pushedAt)}
                    </span>

                    {/* Separator between repos */}
                    {i < topRepos.length - 1 && (
                      <div
                        className="mx-auto mt-3"
                        style={{
                          width: 40,
                          height: 1,
                          background: "rgba(184, 134, 11, 0.15)",
                        }}
                      />
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Crosshair lines */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "50%", left: 16, right: 16, height: 1,
                background: "linear-gradient(90deg, rgba(184, 134, 11, 0.12), transparent 25%, transparent 75%, rgba(184, 134, 11, 0.12))",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%", top: 16, bottom: 16, width: 1,
                background: "linear-gradient(180deg, rgba(184, 134, 11, 0.12), transparent 25%, transparent 75%, rgba(184, 134, 11, 0.12))",
              }}
            />
          </div>

          {/* Brass screws on the ring — positioned as % of container */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            // screwR / containerSize ≈ 164/340 ≈ 0.4824
            const pct = 0.4824;
            return (
              <div
                key={deg}
                className="absolute w-[6px] h-[6px] sm:w-2 sm:h-2"
                style={{
                  left: `calc(50% + ${(pct * 100 * Math.cos(rad)).toFixed(2)}% - 4px)`,
                  top: `calc(50% - ${(pct * 100 * Math.sin(rad)).toFixed(2)}% - 4px)`,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, rgba(240, 180, 41, 0.5), rgba(107, 66, 38, 0.7))",
                  boxShadow: "inset 0 1px 1px rgba(0,0,0,0.3)",
                }}
              />
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
