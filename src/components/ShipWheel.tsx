"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  angle: number; // degrees on the wheel (0 = top)
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", angle: 0 },
  { label: "Portfolio", href: "/portfolio", angle: 90 },
  { label: "About", href: "/about", angle: 180 },
  { label: "The One Piece", href: "/the-one-piece", angle: 270 },
];

const WHEEL_SIZE = 80;
const HUB_RADIUS = 10;
const RIM_RADIUS = 36;
const LABEL_OFFSET = 18;

function ShipWheelSVG({
  hovered,
  currentAngle,
}: {
  hovered: boolean;
  currentAngle: number;
}) {
  const center = WHEEL_SIZE / 2;

  return (
    <motion.svg
      width={WHEEL_SIZE}
      height={WHEEL_SIZE}
      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
      animate={{ rotate: currentAngle }}
      transition={{ type: "spring", stiffness: 60, damping: 15 }}
      aria-hidden="true"
    >
      {/* Outer rim */}
      <circle
        cx={center}
        cy={center}
        r={RIM_RADIUS}
        fill="none"
        stroke={hovered ? "#8B5E3C" : "#6B4226"}
        strokeWidth={3}
        className="transition-colors duration-300"
      />

      {/* Inner rim */}
      <circle
        cx={center}
        cy={center}
        r={RIM_RADIUS - 6}
        fill="none"
        stroke={hovered ? "#6B4226" : "#3D2E1F"}
        strokeWidth={1}
        className="transition-colors duration-300"
      />

      {/* 8 spokes (4 main + 4 secondary) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const isMain = i % 2 === 0;
        const innerR = HUB_RADIUS + 2;
        const outerR = RIM_RADIUS - 2;
        const x1 = center + innerR * Math.sin(angle);
        const y1 = center - innerR * Math.cos(angle);
        const x2 = center + outerR * Math.sin(angle);
        const y2 = center - outerR * Math.cos(angle);

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isMain ? "#8B5E3C" : "#6B4226"}
            strokeWidth={isMain ? 2.5 : 1.5}
            className="transition-colors duration-300"
          />
        );
      })}

      {/* Spoke tip handles (main spokes only) */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i * 90 * Math.PI) / 180;
        const handleR = RIM_RADIUS + 3;
        const cx = center + handleR * Math.sin(angle);
        const cy = center - handleR * Math.cos(angle);

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={3}
            fill={hovered ? "#F0B429" : "#B8860B"}
            className="transition-colors duration-300"
          />
        );
      })}

      {/* Center hub */}
      <circle
        cx={center}
        cy={center}
        r={HUB_RADIUS}
        fill={hovered ? "#3D2E1F" : "#2A1F14"}
        stroke={hovered ? "#8B5E3C" : "#6B4226"}
        strokeWidth={2}
        className="transition-colors duration-300"
      />

      {/* Center dot */}
      <circle
        cx={center}
        cy={center}
        r={3}
        fill={hovered ? "#B8860B" : "#6B4226"}
        className="transition-colors duration-300"
      />
    </motion.svg>
  );
}

// Fixed label positions: top, right, bottom, left of the wheel
const LABEL_POSITIONS: {
  style: React.CSSProperties;
  align: string;
}[] = [
  {
    // Top
    style: { bottom: `${WHEEL_SIZE + LABEL_OFFSET}px`, left: "50%" },
    align: "-translate-x-1/2",
  },
  {
    // Right
    style: { left: `${WHEEL_SIZE + LABEL_OFFSET}px`, top: "50%" },
    align: "-translate-y-1/2",
  },
  {
    // Bottom
    style: { top: `${WHEEL_SIZE + LABEL_OFFSET}px`, left: "50%" },
    align: "-translate-x-1/2",
  },
  {
    // Left
    style: { right: `${WHEEL_SIZE + LABEL_OFFSET}px`, top: "50%" },
    align: "-translate-y-1/2",
  },
];

const KNOWN_ROUTES = new Set(["/", "/portfolio", "/about"]);

export default function ShipWheel() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Calculate wheel rotation based on current page
  const currentItem = NAV_ITEMS.find((item) => item.href === pathname);
  const currentAngle = currentItem ? -currentItem.angle : 0;

  // Map each spoke position (top/right/bottom/left) to the nav item
  // whose spoke currently points there after rotation.
  // Spoke i in the SVG is at angle i*90°. After CSS rotation by currentAngle,
  // it visually points at (i*90 + currentAngle)°. We need: which item's spoke
  // ends up at position p (0=top, 1=right, 2=bottom, 3=left)?
  // A spoke drawn at svgAngle rotates to visual angle = svgAngle + currentAngle.
  // Position p corresponds to visual angle p*90.
  // So svgAngle = p*90 - currentAngle. The item at that svgAngle has item.angle = svgAngle.
  const labelsAtPositions = [0, 1, 2, 3].map((p) => {
    const targetSvgAngle = ((p * 90 - currentAngle) % 360 + 360) % 360;
    return NAV_ITEMS.find((item) => item.angle === targetSvgAngle)!;
  });

  const handleZoroClick = useCallback(() => {
    console.log("Zoro!");
  }, []);

  // Hide the wheel on 404 / unknown routes
  if (!KNOWN_ROUTES.has(pathname)) return null;

  return (
    <>
      {/* Desktop: Fixed ship's wheel */}
      <nav
        className="fixed bottom-6 right-16 z-50 hidden lg:block"
        aria-label="Main navigation"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ padding: LABEL_OFFSET + 40 }}
      >
        <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
          {/* Wheel */}
          <div
            className={`transition-opacity duration-300 ${
              hovered ? "opacity-100" : "opacity-60"
            }`}
          >
            <ShipWheelSVG hovered={hovered} currentAngle={currentAngle} />
          </div>

          {/* Center hub clickable area (Zoro easter egg) */}
          <button
            onClick={handleZoroClick}
            className="absolute rounded-full cursor-default"
            style={{
              width: HUB_RADIUS * 2,
              height: HUB_RADIUS * 2,
              top: WHEEL_SIZE / 2 - HUB_RADIUS,
              left: WHEEL_SIZE / 2 - HUB_RADIUS,
            }}
            aria-label="Center of the wheel"
            tabIndex={-1}
          />

          {/* Navigation labels — fixed at top/right/bottom/left of wheel */}
          <AnimatePresence>
            {hovered &&
              labelsAtPositions.map((item, posIndex) => {
                const pos = LABEL_POSITIONS[posIndex];
                const isActive = pathname === item.href;

                return (
                  <motion.div
                    key={`pos-${posIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute pointer-events-auto ${pos.align}`}
                    style={pos.style}
                  >
                    <Link
                      href={item.href}
                      className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded transition-colors duration-200 ${
                        isActive
                          ? "text-sunny-gold"
                          : "text-sunny-cream-muted hover:text-sunny-gold"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Keyboard-accessible nav links (visually hidden) */}
          <div className="sr-only">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile: Radial menu */}
      <nav
        className="fixed bottom-6 right-6 z-50 lg:hidden"
        aria-label="Main navigation"
      >
        <div className="relative">
          {/* Radial menu items */}
          <AnimatePresence>
            {mobileOpen &&
              NAV_ITEMS.map((item, i) => {
                // Fan out in a compass-rose pattern (upward arc)
                const spreadAngle = 60;
                const startAngle = -90 - spreadAngle * 1.5;
                const angle =
                  ((startAngle + i * spreadAngle) * Math.PI) / 180;
                const radius = 70;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const isActive = pathname === item.href;

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: i * 0.05,
                    }}
                    className="absolute bottom-0 right-0"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-center w-12 h-12 rounded-full text-xs font-medium shadow-lg transition-colors ${
                        isActive
                          ? "bg-sunny-gold text-sunny-bg"
                          : "bg-sunny-surface text-sunny-cream border border-sunny-surface-light hover:border-sunny-gold"
                      }`}
                    >
                      {item.href === "/the-one-piece" ? "???" : item.label.slice(0, 3)}
                    </Link>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Toggle button */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors duration-300 ${
              mobileOpen
                ? "bg-sunny-gold text-sunny-bg"
                : "bg-sunny-surface text-sunny-cream-muted border border-sunny-wood"
            }`}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            <Anchor
              size={24}
              className={`transition-transform duration-300 ${
                mobileOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </nav>
    </>
  );
}
