"use client";

import { useRef, useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Compass, MapPin, Home, Navigation } from "lucide-react";

// ── Reduced motion hook ──

function useReducedMotion() {
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);
  const getSnapshot = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// ── Wandering compass ──

function WanderingCompass({ reduced }: { reduced: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    let frame: number;
    let t = Math.random() * 1000;

    const drift = () => {
      t += 0.003;
      setPos({
        x: Math.sin(t * 1.3) * 30 + Math.cos(t * 0.7) * 15,
        y: Math.cos(t * 1.1) * 20 + Math.sin(t * 0.9) * 10,
      });
      frame = requestAnimationFrame(drift);
    };

    frame = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  return (
    <motion.div
      className="absolute top-8 right-8 sm:top-12 sm:right-16 pointer-events-none"
      animate={reduced ? {} : { x: pos.x, y: pos.y }}
      transition={{ type: "tween", duration: 0.5, ease: "easeOut" }}
    >
      <Compass
        className="w-8 h-8 text-sunny-gold-muted"
        style={{
          animation: reduced ? "none" : "spin 8s linear infinite",
        }}
      />
    </motion.div>
  );
}

// ── Mouse-follow swords ──

function MouseFollowSwords({ reduced }: { reduced: boolean }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setMouse({
        x: (e.clientX - cx) * 0.02,
        y: (e.clientY - cy) * 0.02,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reduced]);

  return (
    <motion.div
      ref={containerRef}
      animate={reduced ? {} : { x: mouse.x, y: mouse.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      <Swords className="w-16 h-16 text-sunny-red mx-auto" />
    </motion.div>
  );
}

// ── Shaking button ──

function LyingButton() {
  const [shaking, setShaking] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    if (clickCount >= 2) {
      // After 3 clicks, finally navigate home
      window.location.href = "/";
      return;
    }
    setShaking(true);
    setClickCount((c) => c + 1);
    setTimeout(() => setShaking(false), 600);
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={
        shaking
          ? { x: [0, -6, 6, -4, 4, -2, 2, 0] }
          : {}
      }
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 bg-sunny-surface hover:bg-sunny-surface-light text-sunny-cream font-medium py-3 px-6 transition-colors"
      style={{ border: "1px solid #B8860B", borderRadius: 8 }}
    >
      <Navigation className="w-5 h-5" />
      {clickCount === 0
        ? "Definitely This Way"
        : clickCount === 1
          ? "No Wait, THIS Way"
          : "Okay Fine, Just Go Home"}
    </motion.button>
  );
}

// ── 404 number with hover Easter egg ──

function AnimatedFourOhFour() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.h1
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-8xl md:text-9xl font-bold text-sunny-gold/30 mb-6 select-none cursor-default"
      style={{ fontFamily: "var(--font-display), sans-serif" }}
    >
      <AnimatePresence mode="wait">
        {hovered ? (
          <motion.span
            key="swords"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            4
            <span className="inline-block text-sunny-red/50 mx-1">
              <Swords className="w-12 h-12 md:w-16 md:h-16 inline" />
            </span>
            4
          </motion.span>
        ) : (
          <motion.span
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            404
          </motion.span>
        )}
      </AnimatePresence>
    </motion.h1>
  );
}

// ── Navigation tips ──

const TIPS = [
  "Turn around 180° (you're probably going the wrong way)",
  "Follow literally anyone else's directions but your own",
  "The home page is NOT up those stairs to the left",
];

// ── Main page ──

export default function NotFound() {
  const reduced = useReducedMotion();

  return (
    <main
      className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1A1209 0%, #2A1F14 30%, #3D2E1F 55%, #6B4226 75%, #B8860B 95%)",
      }}
    >
      {/* Horizon glow */}
      <div className="absolute w-full pointer-events-none" style={{ top: "70%" }}>
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

      {/* Wandering compass */}
      <WanderingCompass reduced={reduced} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        {/* ── Hero ── */}
        <AnimatedFourOhFour />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MouseFollowSwords reduced={reduced} />
        </motion.div>

        {/* ── Main card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-8 md:p-10 bg-sunny-surface/90 backdrop-blur-sm"
          style={{
            border: "1px solid #B8860B",
            borderRadius: 12,
          }}
        >
          <h2
            className="text-2xl sm:text-3xl font-bold text-sunny-red mb-4"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            You Got Lost Again, Didn&apos;t You?
          </h2>

          <p className="text-sunny-cream/80 mb-6 leading-relaxed">
            Don&apos;t worry, it happens to the best swordsmen. This page seems
            to have wandered off in a completely different direction...
            probably ended up at a sake shop.
          </p>

          {/* Zoro quote */}
          <div
            className="text-left mb-8 py-3 px-4"
            style={{ borderLeft: "3px solid #F0B429" }}
          >
            <p className="text-sunny-cream-muted italic mb-1">
              &ldquo;I&apos;m not lost. The page is just in the wrong place.&rdquo;
            </p>
            <p className="text-xs text-sunny-cream-muted/50">
              — Definitely not what Zoro would say
            </p>
          </div>

          {/* Marimo Navigation Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sunny-cream font-medium mb-3 text-left">
              Marimo Navigation Tips:
            </p>
            <ul className="text-left space-y-2 mb-8">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sunny-gold mt-0.5 flex-shrink-0" />
                  <span className="text-sunny-cream-muted text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Navigation buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-sunny-red hover:bg-sunny-dark-red text-sunny-cream font-medium py-3 px-6 transition-colors"
              style={{ borderRadius: 8 }}
            >
              <Home className="w-5 h-5" />
              Go Home (Straight Ahead!)
            </Link>

            <LyingButton />
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-xs text-sunny-cream-muted/40"
        >
          Error 404: Page not found (but your sense of direction was lost long ago)
        </motion.p>
      </div>
    </main>
  );
}
