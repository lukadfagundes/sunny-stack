"use client";

import { useRef, useSyncExternalStore, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import LetterReveal from "./LetterReveal";

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

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Parallax offset for the horizon line
  const horizonX = useTransform(mouseX, [0, 1], [-20, 20]);
  const horizonY = useTransform(mouseY, [0, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1A1209 0%, #2A1F14 30%, #3D2E1F 55%, #6B4226 75%, #B8860B 95%)",
      }}
    >
      {/* Horizon glow line */}
      <motion.div
        className="absolute w-full pointer-events-none"
        style={{
          top: "70%",
          x: reducedMotion ? 0 : horizonX,
          y: reducedMotion ? 0 : horizonY,
        }}
      >
        <div
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, #F0B429 30%, #F0B429 70%, transparent 95%)",
            boxShadow: "0 0 20px 2px rgba(240, 180, 41, 0.3)",
          }}
        />
        {/* Subtle glow below */}
        <div
          className="w-full h-8 -mt-4"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(240, 180, 41, 0.15) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Name and title */}
      <div className="relative z-10 text-center px-6">
        <LetterReveal
          text="Luka Fagundes"
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-sunny-cream mb-4"
          delay={0.3}
          reducedMotion={reducedMotion}
        />
        <LetterReveal
          text="Full Stack Developer"
          className="text-lg sm:text-xl md:text-2xl text-sunny-cream-muted tracking-wide"
          delay={1.2}
          staggerDelay={0.03}
          reducedMotion={reducedMotion}
        />
      </div>

    </section>
  );
}
