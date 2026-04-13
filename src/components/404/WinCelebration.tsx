"use client";

import { motion } from "framer-motion";
import { Anchor, Home } from "lucide-react";
import Link from "next/link";

// Generate particle configs at module level (stable across renders)
const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 300,
  y: (Math.random() - 0.5) * 300,
  rotation: Math.random() * 720 - 360,
  delay: Math.random() * 0.3,
  size: Math.random() * 6 + 4,
  color: i % 2 === 0 ? "#F0B429" : "#B8860B",
}));

interface WinCelebrationProps {
  quote: string | null;
  moveCount: number;
}

export default function WinCelebration({
  quote,
  moveCount,
}: WinCelebrationProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      {/* Particle burst */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            scale: 0.5,
            rotate: p.rotation,
          }}
          transition={{
            duration: 1.5,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Victory card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 150, damping: 20 }}
        className="text-center p-8 max-w-sm"
        style={{
          background: "rgba(26, 18, 9, 0.95)",
          border: "2px solid #F0B429",
          borderRadius: 16,
        }}
      >
        <Anchor className="w-12 h-12 text-sunny-gold mx-auto mb-4" />

        <h2
          className="text-2xl font-bold text-sunny-gold mb-2"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          He Found It!
        </h2>

        {quote && (
          <p className="text-sunny-cream italic mb-4 text-sm">
            &ldquo;{quote}&rdquo;
          </p>
        )}

        <p className="text-sunny-cream-muted text-xs mb-6">
          {moveCount} moves to find a ship that was right there the whole time.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-sunny-red hover:bg-sunny-dark-red text-sunny-cream font-medium py-3 px-6 transition-colors"
          style={{ borderRadius: 8 }}
        >
          <Home className="w-5 h-5" />
          Go Home for Real
        </Link>
      </motion.div>
    </div>
  );
}
