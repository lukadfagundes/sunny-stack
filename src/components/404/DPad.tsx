"use client";

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Direction } from "./types";

interface DPadProps {
  onMove: (direction: Direction) => void;
  disabled?: boolean;
}

const BUTTONS: { dir: Direction; Icon: typeof ChevronUp; label: string; pos: string }[] = [
  { dir: "up", Icon: ChevronUp, label: "Move up", pos: "col-start-2 row-start-1" },
  { dir: "left", Icon: ChevronLeft, label: "Move left", pos: "col-start-1 row-start-2" },
  { dir: "right", Icon: ChevronRight, label: "Move right", pos: "col-start-3 row-start-2" },
  { dir: "down", Icon: ChevronDown, label: "Move down", pos: "col-start-2 row-start-3" },
];

export default function DPad({ onMove, disabled }: DPadProps) {
  return (
    <div className="lg:hidden inline-grid grid-cols-3 grid-rows-3 gap-1">
      {BUTTONS.map(({ dir, Icon, label, pos }) => (
        <button
          key={dir}
          aria-label={label}
          disabled={disabled}
          onClick={() => onMove(dir)}
          className={`${pos} w-12 h-12 flex items-center justify-center rounded-md transition-colors
            bg-sunny-surface hover:bg-sunny-surface-light active:bg-sunny-gold/20
            disabled:opacity-40 disabled:cursor-not-allowed`}
          style={{ border: "1px solid rgba(184, 134, 11, 0.3)" }}
        >
          <Icon className="w-6 h-6 text-sunny-cream" />
        </button>
      ))}
    </div>
  );
}
