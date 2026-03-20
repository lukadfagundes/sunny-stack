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

// ── Spyglass Viewport ──

export default function CurrentlyBuilding({ repos }: CurrentlyBuildingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [isHovered, setIsHovered] = useState(false);

  const latest = repos[0];

  if (!latest) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-4 italic">
            Through the Spyglass
          </h2>
          <p className="text-sunny-cream-muted/60 text-sm italic font-serif">
            Nothing sighted on the horizon
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6">
      <div ref={ref} className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-8 text-center italic">
          Through the Spyglass
        </h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto flex items-center justify-center"
          style={{ maxWidth: 420 }}
        >
          {/* Spyglass frame */}
          <a
            href={latest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              width: 280,
              height: 280,
            }}
          >
            {/* Outer brass ring */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(184, 134, 11, 0.3), rgba(240, 180, 41, 0.5), rgba(184, 134, 11, 0.2), rgba(240, 180, 41, 0.4), rgba(184, 134, 11, 0.3))",
                padding: 3,
                transform: isHovered ? "scale(1.03)" : "scale(1)",
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "conic-gradient(from 180deg, rgba(107, 66, 38, 0.4), rgba(184, 134, 11, 0.3), rgba(107, 66, 38, 0.5), rgba(184, 134, 11, 0.4), rgba(107, 66, 38, 0.4))",
                  padding: 3,
                }}
              >
                <div className="w-full h-full rounded-full" style={{ background: "rgba(26, 18, 9, 0.95)" }} />
              </div>
            </div>

            {/* Inner lens area */}
            <div
              className="absolute rounded-full overflow-hidden transition-all duration-500"
              style={{
                top: 10,
                left: 10,
                right: 10,
                bottom: 10,
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
                  top: "12%",
                  left: "15%",
                  width: "30%",
                  height: "20%",
                  background:
                    "radial-gradient(ellipse, rgba(245, 230, 211, 0.08) 0%, transparent 70%)",
                  transform: "rotate(-30deg)",
                  opacity: isHovered ? 0.6 : 0.3,
                }}
              />

              {/* Content inside the lens */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                {/* Lighthouse beacon sweep */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    width: "120%",
                    height: "120%",
                    transform: "translate(-50%, -50%)",
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, transparent 340deg, rgba(240, 180, 41, 0.08) 350deg, rgba(240, 180, 41, 0.15) 355deg, transparent 360deg)",
                    animation: "spyglass-sweep 4s linear infinite",
                  }}
                />

                {/* Repo name */}
                <div className="relative flex items-center gap-1.5 mb-2">
                  <span
                    className="text-lg sm:text-xl font-serif font-bold transition-colors duration-300"
                    style={{
                      color: isHovered
                        ? "rgba(240, 180, 41, 1)"
                        : "rgba(245, 230, 211, 0.9)",
                    }}
                  >
                    {latest.name}
                  </span>
                  <ExternalLink
                    className="w-3.5 h-3.5 transition-all duration-300"
                    style={{
                      color: isHovered
                        ? "rgba(240, 180, 41, 0.7)"
                        : "rgba(245, 230, 211, 0.2)",
                    }}
                  />
                </div>

                {/* Description */}
                {latest.description && (
                  <p
                    className="text-xs sm:text-sm mb-3 leading-relaxed transition-colors duration-300"
                    style={{
                      color: isHovered
                        ? "rgba(245, 230, 211, 0.6)"
                        : "rgba(245, 230, 211, 0.4)",
                      maxWidth: "80%",
                    }}
                  >
                    {latest.description.length > 80
                      ? latest.description.slice(0, 80) + "..."
                      : latest.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-3">
                  {latest.primaryLanguage && (
                    <div className="flex items-center gap-1.5">
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: latest.primaryLanguage.color,
                          boxShadow: `0 0 6px ${latest.primaryLanguage.color}60`,
                        }}
                      />
                      <span className="text-xs" style={{ color: "rgba(245, 230, 211, 0.4)" }}>
                        {latest.primaryLanguage.name}
                      </span>
                    </div>
                  )}
                  <span
                    className="text-xs font-serif italic"
                    style={{ color: "rgba(240, 180, 41, 0.5)" }}
                  >
                    {timeAgo(latest.pushedAt)}
                  </span>
                </div>

                {/* Crosshair lines */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "50%",
                    left: 16,
                    right: 16,
                    height: 1,
                    background:
                      "linear-gradient(90deg, rgba(184, 134, 11, 0.15), transparent 30%, transparent 70%, rgba(184, 134, 11, 0.15))",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: "50%",
                    top: 16,
                    bottom: 16,
                    width: 1,
                    background:
                      "linear-gradient(180deg, rgba(184, 134, 11, 0.15), transparent 30%, transparent 70%, rgba(184, 134, 11, 0.15))",
                  }}
                />
              </div>
            </div>

            {/* Brass screws on the ring */}
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const screwR = 134;
              return (
                <div
                  key={deg}
                  className="absolute"
                  style={{
                    left: 140 + screwR * Math.cos(rad) - 3,
                    top: 140 - screwR * Math.sin(rad) - 3,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(240, 180, 41, 0.5), rgba(107, 66, 38, 0.7))",
                    boxShadow: "inset 0 1px 1px rgba(0,0,0,0.3)",
                  }}
                />
              );
            })}
          </a>
        </motion.div>
      </div>

      {/* Keyframe for lighthouse sweep */}
      <style jsx global>{`
        @keyframes spyglass-sweep {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
