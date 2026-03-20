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
  icon: React.ReactNode;
}

function Gauge({ label, value, maxValue, delay, color, icon }: GaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [animatedValue, setAnimatedValue] = useState(0);
  const [displayNum, setDisplayNum] = useState(0);

  // Animate the needle sweep and number count-up
  useEffect(() => {
    if (!isInView) return;

    let start: number;
    let frame: number;
    const duration = 1800;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Elastic ease-out for needle overshoot
      const eased =
        progress === 1
          ? 1
          : 1 - Math.pow(2, -10 * progress) * Math.cos((progress * 10 - 0.75) * (2 * Math.PI / 3));
      const clamped = Math.min(eased, 1);

      setAnimatedValue(clamped * Math.min(value / maxValue, 1));
      setDisplayNum(Math.round(clamped * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [isInView, value, maxValue, delay]);

  // SVG gauge arc params
  const cx = 70;
  const cy = 70;
  const r = 54;
  const startAngle = 225; // degrees (bottom-left)
  const totalArc = 270;   // degrees of sweep

  // Convert angle to radians for SVG
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Arc path
  const arcStart = toRad(startAngle);
  const arcEnd = toRad(startAngle - totalArc);
  const x1 = cx + r * Math.cos(arcStart);
  const y1 = cy - r * Math.sin(arcStart);
  const x2 = cx + r * Math.cos(arcEnd);
  const y2 = cy - r * Math.sin(arcEnd);

  // Needle position
  const needleAngle = startAngle - animatedValue * totalArc;
  const needleRad = toRad(needleAngle);
  const needleLen = 42;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy - needleLen * Math.sin(needleRad);

  // Filled arc
  const filledSweep = animatedValue * totalArc;
  const filledEnd = toRad(startAngle - filledSweep);
  const fx = cx + r * Math.cos(filledEnd);
  const fy = cy - r * Math.sin(filledEnd);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: 140, height: 120 }}>
        <svg width={140} height={120} viewBox="0 0 140 120" fill="none">
          {/* Tick marks */}
          {Array.from({ length: 19 }, (_, i) => {
            const tickAngle = toRad(startAngle - (i / 18) * totalArc);
            const isMajor = i % 3 === 0;
            const innerR = isMajor ? r - 8 : r - 5;
            const outerR = r + 2;
            return (
              <line
                key={i}
                x1={cx + innerR * Math.cos(tickAngle)}
                y1={cy - innerR * Math.sin(tickAngle)}
                x2={cx + outerR * Math.cos(tickAngle)}
                y2={cy - outerR * Math.sin(tickAngle)}
                stroke="rgba(184, 134, 11, 0.2)"
                strokeWidth={isMajor ? 1.5 : 0.7}
              />
            );
          })}

          {/* Background arc */}
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 1 0 ${x2} ${y2}`}
            stroke="rgba(42, 31, 20, 0.8)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Filled arc */}
          {animatedValue > 0.01 && (
            <path
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${filledSweep > 180 ? 1 : 0} 0 ${fx} ${fy}`}
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
            />
          )}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#F5E6D3"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 2px rgba(245, 230, 211, 0.3))" }}
          />

          {/* Center cap */}
          <circle cx={cx} cy={cy} r="5" fill="rgba(42, 31, 20, 0.9)" stroke={color} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2" fill={color} />

          {/* Icon area */}
          <foreignObject x={cx - 10} y={cy + 12} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full opacity-50">
              {icon}
            </div>
          </foreignObject>
        </svg>

        {/* Value display */}
        <div
          className="absolute text-center"
          style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
        >
          <span
            className="text-2xl sm:text-3xl font-bold tabular-nums"
            style={{ color }}
          >
            {displayNum.toLocaleString()}
          </span>
        </div>
      </div>

      <span className="mt-1 text-xs sm:text-sm text-sunny-cream-muted font-serif">
        {label}
      </span>
    </motion.div>
  );
}

// ── Gauge Icons (simple SVG inline) ──

const CommitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunny-cream-muted">
    <circle cx="12" cy="12" r="4" />
    <line x1="1.05" y1="12" x2="7" y2="12" />
    <line x1="17.01" y1="12" x2="22.96" y2="12" />
  </svg>
);

const PRIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunny-cream-muted">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 21V9a9 9 0 0 0 9 9" />
  </svg>
);

const IssueIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunny-cream-muted">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const RepoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunny-cream-muted">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-sunny-cream-muted">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

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
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  // Compute reasonable max values for gauge fill (so needles don't all peg at 100%)
  const commitMax = Math.max(totalCommits * 1.2, 100);
  const prMax = Math.max(totalPRs * 1.3, 50);
  const issueMax = Math.max(totalIssues * 1.3, 50);
  const repoMax = Math.max(totalRepos * 1.5, 20);
  const starMax = Math.max(totalStars * 1.4, 10);

  return (
    <section ref={ref} className="py-16 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl mx-auto p-6 sm:p-8 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(42, 31, 20, 0.9) 0%, rgba(26, 18, 9, 0.95) 70%)",
          borderRadius: 16,
          border: "1px solid rgba(184, 134, 11, 0.2)",
        }}
      >
        {/* Subtle brass panel texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(184, 134, 11, 1) 0px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Rivets in corners */}
        {[
          { top: 12, left: 12 },
          { top: 12, right: 12 },
          { bottom: 12, left: 12 },
          { bottom: 12, right: 12 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              ...pos,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, rgba(240, 180, 41, 0.4), rgba(107, 66, 38, 0.6))",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
            }}
          />
        ))}

        <h2 className="relative text-2xl sm:text-3xl font-serif font-bold text-sunny-cream mb-8 text-center italic">
          Ship&apos;s Instruments
        </h2>

        {!hasData ? (
          <p className="text-sunny-cream-muted/60 text-sm text-center italic font-serif">
            Instruments offline — no signal from port
          </p>
        ) : (
          <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <Gauge
              label="Commits"
              value={totalCommits}
              maxValue={commitMax}
              delay={0}
              color="rgba(240, 180, 41, 0.9)"
              icon={<CommitIcon />}
            />
            <Gauge
              label="PRs Merged"
              value={totalPRs}
              maxValue={prMax}
              delay={0.1}
              color="rgba(220, 160, 30, 0.85)"
              icon={<PRIcon />}
            />
            <Gauge
              label="Issues"
              value={totalIssues}
              maxValue={issueMax}
              delay={0.2}
              color="rgba(200, 140, 20, 0.8)"
              icon={<IssueIcon />}
            />
            <Gauge
              label="Public Repos"
              value={totalRepos}
              maxValue={repoMax}
              delay={0.3}
              color="rgba(184, 134, 11, 0.85)"
              icon={<RepoIcon />}
            />
            <Gauge
              label="Total Stars"
              value={totalStars}
              maxValue={starMax}
              delay={0.4}
              color="rgba(245, 200, 66, 0.9)"
              icon={<StarIcon />}
            />
          </div>
        )}
      </motion.div>
    </section>
  );
}
