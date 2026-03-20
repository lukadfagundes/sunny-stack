"use client";

import Link from "next/link";
import { Swords, MapPin, Home } from "lucide-react";

const TIPS = [
  "Turn around 180\u00B0 (you're probably going the wrong way)",
  "Follow literally anyone else's directions but your own",
  "The home page is NOT up those stairs to the left",
];

export default function StaticNotFound() {
  return (
    <main
      className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1A1209 0%, #2A1F14 30%, #3D2E1F 55%, #6B4226 75%, #B8860B 95%)",
      }}
    >
      {/* Horizon glow */}
      <div
        className="absolute w-full pointer-events-none"
        style={{ top: "70%" }}
      >
        <div
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, #F0B429 30%, #F0B429 70%, transparent 95%)",
            boxShadow: "0 0 20px 2px rgba(240, 180, 41, 0.3)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1
          className="text-8xl md:text-9xl font-bold text-sunny-gold/30 mb-6 select-none"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          404
        </h1>

        <Swords className="w-16 h-16 text-sunny-red mx-auto" />

        <div
          className="mt-8 p-8 md:p-10 bg-sunny-surface/90 backdrop-blur-sm"
          style={{ border: "1px solid #B8860B", borderRadius: 12 }}
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

          <div
            className="text-left mb-8 py-3 px-4"
            style={{ borderLeft: "3px solid #F0B429" }}
          >
            <p className="text-sunny-cream-muted italic mb-1">
              &ldquo;I&apos;m not lost. The page is just in the wrong
              place.&rdquo;
            </p>
            <p className="text-xs text-sunny-cream-muted/50">
              — Definitely not what Zoro would say
            </p>
          </div>

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

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-sunny-red hover:bg-sunny-dark-red text-sunny-cream font-medium py-3 px-6 transition-colors"
            style={{ borderRadius: 8 }}
          >
            <Home className="w-5 h-5" />
            Go Home (Straight Ahead!)
          </Link>
        </div>

        <p className="mt-8 text-xs text-sunny-cream-muted/40">
          Error 404: Page not found (but your sense of direction was lost long
          ago)
        </p>
      </div>
    </main>
  );
}
