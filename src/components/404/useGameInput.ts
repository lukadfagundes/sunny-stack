// ── Keyboard + touch swipe input hook ──

import { useEffect, useCallback, useRef } from "react";
import type { Direction } from "./types";

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  a: "left",
  A: "left",
  s: "down",
  S: "down",
  d: "right",
  D: "right",
};

const SWIPE_THRESHOLD = 50;

export function useGameInput(onMove: (direction: Direction) => void, disabled = false) {
  const onMoveRef = useRef(onMove);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onMoveRef.current = onMove;
  });

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabledRef.current) return;
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        onMoveRef.current(dir);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Touch swipe input
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabledRef.current) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabledRef.current || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      onMoveRef.current(dx > 0 ? "right" : "left");
    } else {
      onMoveRef.current(dy > 0 ? "down" : "up");
    }
  }, []);

  return { onTouchStart, onTouchEnd };
}
