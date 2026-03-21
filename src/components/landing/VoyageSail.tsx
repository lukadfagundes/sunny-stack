"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function useReducedMotion() {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  }, []);

  const getSnapshot = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ── Ship SVG ──

function ShipSilhouette() {
  return (
    <svg
      width={48}
      height={32}
      viewBox="0 0 48 32"
      fill="none"
      aria-hidden="true"
      className="w-10 h-7 sm:w-12 sm:h-8"
    >
      <path d="M4 24 Q8 28 24 28 Q40 28 44 24 L40 20 H8 Z" fill="#B8860B" />
      <path d="M8 20 H40 L38 18 H10 Z" fill="#F0B429" />
      <rect x="22" y="4" width="2" height="16" fill="#6B4226" />
      <path d="M24 6 L36 16 L24 16 Z" fill="#F5E6D3" opacity="0.85" />
      <path d="M22 4 L22 1 L16 2.5 Z" fill="#F0B429" />
    </svg>
  );
}

// ── Stars ──

// Round to 2 decimals to avoid hydration mismatch (server vs browser precision)
const r2 = (n: number) => Math.round(n * 100) / 100;

const STARS: Array<{ x: number; y: number; size: number; delay: number; duration: number }> = Array.from(
  { length: 60 },
  (_, i) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const v1 = s - Math.floor(s);
    const s2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
    const v2 = s2 - Math.floor(s2);
    const s3 = Math.sin(i * 419.2 + 71.9) * 43758.5453;
    const v3 = s3 - Math.floor(s3);
    return {
      x: r2(v1 * 100),
      y: r2(v2 * 65),
      size: r2(1 + v3 * 1.5),
      delay: r2(v1 * 5),
      duration: r2(2 + v2 * 4),
    };
  }
);

function StarField({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ height: "70%" }} aria-hidden="true">
      {STARS.map((star, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            background: "#F5E6D3",
            opacity: reducedMotion ? 0.4 : undefined,
            animation: reducedMotion
              ? undefined
              : `voyage-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Shooting Stars ──

interface ShootingStarData {
  id: number;
  x: number;
  y: number;
  angle: number;
  duration: number;
}

function ShootingStars({ reducedMotion }: { reducedMotion: boolean }) {
  const [stars, setStars] = useState<ShootingStarData[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;

    function spawn() {
      const id = nextId.current++;
      setStars((prev) => [
        ...prev,
        {
          id,
          x: 20 + Math.random() * 60,
          y: 5 + Math.random() * 35,
          angle: 15 + Math.random() * 30,
          duration: 0.6 + Math.random() * 0.8,
        },
      ]);

      setTimeout(() => {
        setStars((prev) => prev.filter((s) => s.id !== id));
      }, 2000);
    }

    let timeout: ReturnType<typeof setTimeout>;
    function scheduleNext() {
      const delay = 3000 + Math.random() * 5000;
      timeout = setTimeout(() => {
        spawn();
        scheduleNext();
      }, delay);
    }

    timeout = setTimeout(() => {
      spawn();
      scheduleNext();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ height: "70%" }} aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#F5E6D3",
            boxShadow: "0 0 6px 2px rgba(245, 230, 211, 0.8), -8px 4px 12px 1px rgba(245, 230, 211, 0.3)",
            animation: `voyage-shooting-star ${star.duration}s ease-out forwards`,
            transform: `rotate(${star.angle}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ── Ocean Waves ──

function OceanWaves({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      className="absolute w-full overflow-hidden"
      style={{ top: "70%", bottom: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(26, 18, 9, 0.3) 0%, rgba(26, 18, 9, 0.9) 40%, #1A1209 100%)",
        }}
      />

      <svg
        className="absolute w-[200%] h-16"
        style={{
          top: -6,
          animation: reducedMotion ? "none" : "voyage-wave-drift 8s linear infinite",
        }}
        viewBox="0 0 2400 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 30 Q150 10 300 30 T600 30 T900 30 T1200 30 T1500 30 T1800 30 T2100 30 T2400 30 V60 H0 Z"
          fill="rgba(184, 134, 11, 0.08)"
        />
      </svg>

      <svg
        className="absolute w-[200%] h-12"
        style={{
          top: 2,
          animation: reducedMotion ? "none" : "voyage-wave-drift 12s linear infinite reverse",
        }}
        viewBox="0 0 2400 50"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 25 Q100 8 200 25 T400 25 T600 25 T800 25 T1000 25 T1200 25 T1400 25 T1600 25 T1800 25 T2000 25 T2200 25 T2400 25 V50 H0 Z"
          fill="rgba(107, 66, 38, 0.1)"
        />
      </svg>

      <svg
        className="absolute w-[200%] h-10"
        style={{
          top: 8,
          animation: reducedMotion ? "none" : "voyage-wave-drift 16s linear infinite",
        }}
        viewBox="0 0 2400 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 20 Q200 5 400 20 T800 20 T1200 20 T1600 20 T2000 20 T2400 20 V40 H0 Z"
          fill="rgba(42, 31, 20, 0.15)"
        />
      </svg>
    </div>
  );
}

// ── Sun Glow ──

function SunGlow() {
  return (
    <div className="absolute w-full pointer-events-none" style={{ top: "55%", height: "30%" }}>
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "80%",
          height: "100%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(240, 180, 41, 0.12) 0%, rgba(184, 134, 11, 0.06) 35%, transparent 70%)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "40%",
          height: "60%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(240, 180, 41, 0.18) 0%, rgba(240, 180, 41, 0.05) 40%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── Main Component ──

export default function VoyageSail() {
  const isClient = useIsClient();
  const reducedMotion = useReducedMotion();
  const scrollProgress = useMotionValue(0);
  const prevProgress = useRef(0);
  const [facingRight, setFacingRight] = useState(true);

  // Manual scroll tracking — computes progress from actual scroll position.
  // Naturally returns 0 on pages with no scrollable content (like 404),
  // and resets correctly on navigation without stale MotionValue issues.
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      const clamped = Math.min(Math.max(progress, 0), 1);

      scrollProgress.set(clamped);

      const delta = clamped - prevProgress.current;
      if (Math.abs(delta) > 0.001) {
        setFacingRight(delta > 0);
      }
      prevProgress.current = clamped;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollProgress]);

  const shipX = useTransform(scrollProgress, [0, 1], [5, 90]);
  const shipLeft = useTransform(shipX, (v) => `${v}vw`);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          "linear-gradient(180deg, #0D0A06 0%, #1A1209 25%, #2A1F14 50%, #3D2E1F 65%, #6B4226 80%, #B8860B 95%)",
      }}
    >
      {/* Global keyframes for all sub-components */}
      <style jsx global>{`
        @keyframes voyage-wave-drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes voyage-ship-bob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(1.5deg); }
          50% { transform: translateY(1px) rotate(-1deg); }
          75% { transform: translateY(-1px) rotate(0.5deg); }
        }
        @keyframes voyage-twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.8; }
        }
        @keyframes voyage-shooting-star {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translate(150px, 75px) scale(0.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .voyage-animate-bob,
          .voyage-animate-twinkle {
            animation: none !important;
          }
        }
      `}</style>

      {isClient && <StarField reducedMotion={reducedMotion} />}
      {isClient && <ShootingStars reducedMotion={reducedMotion} />}
      <SunGlow />

      {/* Horizon glow line */}
      <div className="absolute w-full" style={{ top: "70%" }}>
        <div
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, #F0B429 30%, #F0B429 70%, transparent 95%)",
            boxShadow: "0 0 20px 2px rgba(240, 180, 41, 0.3)",
          }}
        />
        <div
          className="w-full h-8 -mt-4"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(240, 180, 41, 0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <OceanWaves reducedMotion={reducedMotion} />

      {/* Ship on the horizon */}
      {reducedMotion ? (
        <div
          className="absolute"
          style={{
            top: "70%",
            left: "50%",
            transform: "translate(-50%, -100%)",
            filter: "drop-shadow(0 0 8px rgba(240, 180, 41, 0.4))",
          }}
        >
          <ShipSilhouette />
        </div>
      ) : (
        <motion.div
          className="absolute"
          style={{
            top: "70%",
            left: shipLeft,
            translateY: "-100%",
          }}
        >
          {/* Wake trail */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              right: "100%",
              width: 60,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, rgba(240, 180, 41, 0.2))",
              filter: "blur(1px)",
              transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
            }}
          />
          {/* Ship with bobbing + rocking */}
          <div
            style={{
              filter: "drop-shadow(0 0 8px rgba(240, 180, 41, 0.4))",
              transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
              transition: "transform 0.3s ease",
              animation: "voyage-ship-bob 4s ease-in-out infinite",
            }}
          >
            <ShipSilhouette />
          </div>
        </motion.div>
      )}
    </div>
  );
}
