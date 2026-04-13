"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatsDashboardProps {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalRepos: number;
  totalStars: number;
  totalContributions: number;
}

// ── Gauge Component ──

interface GaugeProps {
  label: string;
  value: number;
  maxValue: number;
  delay: number;
  color: string;
  isInView: boolean;
}

// Gauge uses circle + stroke-dasharray (not SVG arc paths).
// Every gauge has identical geometry — only the dashoffset differs per value.
// This eliminates arc-flag / coordinate-system misalignment entirely.
// Ref: https://tomekdev.com/posts/interactive-radial-gauge-in-react

const SIZE = 100; // viewBox is 100×100
const CX = SIZE / 2; // center X = 50
const CY = SIZE / 2; // center Y = 50
const STROKE = 6; // track width
const R = (SIZE - STROKE) / 2; // radius = 47, keeps stroke inside viewBox
const CIRCUMFERENCE = 2 * Math.PI * R;
const TRACK_DEG = 270; // 270° arc, 90° gap at bottom
const TRACK_FRACTION = TRACK_DEG / 360; // 0.75
const TRACK_LENGTH = CIRCUMFERENCE * TRACK_FRACTION;
const TRACK_GAP = CIRCUMFERENCE - TRACK_LENGTH;
// Rotation: a circle's stroke starts at 3-o'clock (0°).
// We need the gap centered at 6-o'clock (bottom).
// Gap spans 90°, so it goes from 225° to 315° (centered on 270°).
// 3-o'clock = 0° in SVG. To move stroke start to 7:30 (225° in compass = 135° in SVG),
// we rotate by 135°.
const ROTATION = 135;
const NEEDLE_LEN = 32;

function Gauge({ label, value, maxValue, delay, color, isInView }: GaugeProps) {
  const [progress, setProgress] = useState(0);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start: number;
    let frame: number;
    const duration = 1800;
    const ratio = Math.min(value / maxValue, 1);

    const animate = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased =
        t === 1
          ? 1
          : 1 -
            Math.pow(2, -10 * t) *
              Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3));
      const clamped = Math.min(eased, 1);

      setProgress(clamped * ratio);
      setDisplayNum(Math.round(clamped * value));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [isInView, value, maxValue, delay]);

  // How much of the track to hide (0 = full, TRACK_LENGTH = empty)
  const valueOffset = TRACK_LENGTH * (1 - progress);

  // Needle angle in SVG degrees (clockwise from 3-o'clock).
  // At progress=0 the needle points to the start of the arc (ROTATION°).
  // At progress=1 it points to the end (ROTATION + TRACK_DEG°).
  const needleDeg = ROTATION + progress * TRACK_DEG;
  const needleRad = (needleDeg * Math.PI) / 180;
  const nx = CX + NEEDLE_LEN * Math.cos(needleRad);
  const ny = CY + NEEDLE_LEN * Math.sin(needleRad);

  // Tick marks — also use SVG angles (clockwise from 3-o'clock).
  // Round to 2 decimals to avoid server/client hydration mismatch from float precision.
  const rd = (n: number) => Math.round(n * 100) / 100;
  const ticks = Array.from({ length: 19 }, (_, i) => {
    const deg = ROTATION + (i / 18) * TRACK_DEG;
    const rad = (deg * Math.PI) / 180;
    const isMajor = i % 3 === 0;
    const innerR = isMajor ? R - 8 : R - 5;
    const outerR = R + 1;
    return (
      <line
        key={i}
        x1={rd(CX + innerR * Math.cos(rad))}
        y1={rd(CY + innerR * Math.sin(rad))}
        x2={rd(CX + outerR * Math.cos(rad))}
        y2={rd(CY + outerR * Math.sin(rad))}
        stroke="rgba(184, 134, 11, 0.2)"
        strokeWidth={isMajor ? 1.2 : 0.5}
      />
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px]"
      >
        {ticks}

        {/* Background track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          stroke="rgba(42, 31, 20, 0.8)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${TRACK_LENGTH} ${TRACK_GAP}`}
          transform={`rotate(${ROTATION} ${CX} ${CY})`}
          fill="none"
        />

        {/* Filled track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${TRACK_LENGTH} ${TRACK_GAP}`}
          strokeDashoffset={valueOffset}
          transform={`rotate(${ROTATION} ${CX} ${CY})`}
          fill="none"
          style={{
            filter: `drop-shadow(0 0 3px ${color}60)`,
            transition: "stroke-dashoffset 0.05s linear",
          }}
        />

        {/* Needle */}
        <line
          x1={CX}
          y1={CY}
          x2={nx}
          y2={ny}
          stroke="#F5E6D3"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 2px rgba(245, 230, 211, 0.3))" }}
        />

        {/* Center cap */}
        <circle
          cx={CX}
          cy={CY}
          r="4"
          fill="rgba(42, 31, 20, 0.9)"
          stroke={color}
          strokeWidth="1.2"
        />
        <circle cx={CX} cy={CY} r="1.5" fill={color} />
      </svg>

      {/* Value + label below the gauge */}
      <span
        className="text-xl sm:text-2xl font-bold tabular-nums mt-1"
        style={{ color }}
      >
        {displayNum.toLocaleString()}
      </span>
      <span className="text-[10px] sm:text-xs text-sunny-cream-muted font-serif mt-0.5">
        {label}
      </span>
    </motion.div>
  );
}

// ── Main Component ──

export default function StatsDashboard({
  totalCommits,
  totalPRs,
  totalIssues,
  totalRepos,
  totalStars,
  totalContributions,
}: StatsDashboardProps) {
  const hasData = totalContributions > 0;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const commitMax = Math.max(totalCommits * 1.2, 100);
  const prMax = Math.max(totalPRs * 1.3, 50);
  const issueMax = Math.max(totalIssues * 1.3, 50);
  const repoMax = Math.max(totalRepos * 1.5, 20);
  const starMax = Math.max(totalStars * 1.4, 10);

  return (
    <div ref={ref}>
      <h3 className="text-lg sm:text-xl font-serif font-bold text-sunny-cream mb-4 text-center italic">
        Ship&apos;s Instruments
      </h3>

      {!hasData ? (
        <p className="text-sunny-cream-muted/60 text-sm text-center italic font-serif">
          Instruments offline
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2 sm:grid sm:grid-cols-5">
          <Gauge
            label="Commits"
            value={totalCommits}
            maxValue={commitMax}
            delay={0}
            color="rgba(240, 180, 41, 0.9)"
            isInView={isInView}
          />
          <Gauge
            label="PRs"
            value={totalPRs}
            maxValue={prMax}
            delay={0.1}
            color="rgba(220, 160, 30, 0.85)"
            isInView={isInView}
          />
          <Gauge
            label="Issues"
            value={totalIssues}
            maxValue={issueMax}
            delay={0.2}
            color="rgba(200, 140, 20, 0.8)"
            isInView={isInView}
          />
          <Gauge
            label="Repos"
            value={totalRepos}
            maxValue={repoMax}
            delay={0.3}
            color="rgba(184, 134, 11, 0.85)"
            isInView={isInView}
          />
          <Gauge
            label="Stars"
            value={totalStars}
            maxValue={starMax}
            delay={0.4}
            color="rgba(245, 200, 66, 0.9)"
            isInView={isInView}
          />
        </div>
      )}
    </div>
  );
}
