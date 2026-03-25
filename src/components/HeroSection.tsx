"use client";

import { useSyncExternalStore, useCallback } from "react";
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
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Name and title */}
      <div className="relative z-10 text-center px-6">
        <LetterReveal
          text="Luka Fagundes"
          className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-sunny-cream mb-4"
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
