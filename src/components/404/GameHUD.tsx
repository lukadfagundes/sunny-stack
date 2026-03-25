"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Footprints } from "lucide-react";
import type { GameState } from "./types";

interface GameHUDProps {
  state: GameState;
}

function getPhaseLabel(moveCount: number): string {
  if (moveCount < 4) return "Smooth sailing...";
  if (moveCount < 9) return "Wait, which way is north?";
  if (moveCount < 16) return "The controls feel... wrong.";
  if (moveCount < 21) return "Is the world spinning?";
  if (moveCount < 26) return "Everything looks different...";
  return "The ship is RUNNING AWAY?!";
}

export default function GameHUD({ state }: GameHUDProps) {
  return (
    <div className="w-full max-w-md space-y-3">
      {/* Move counter + phase label */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-sunny-cream-muted">
          <Footprints className="w-4 h-4" />
          <span>
            {state.moveCount} move{state.moveCount !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-sunny-cream-muted text-xs italic">
          {getPhaseLabel(state.moveCount)}
        </span>
      </div>

      {/* Quote display — crossfade between quotes, no flicker */}
      <AnimatePresence mode="wait">
        {state.currentQuote && !state.won ? (
          <motion.div
            key={state.currentQuote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-live="polite"
            className="p-3 pointer-events-none"
            style={{
              background: "rgba(26, 18, 9, 0.9)",
              border: "2px solid rgba(240, 180, 41, 0.5)",
              borderRadius: 8,
              borderLeft: "4px solid #F0B429",
            }}
          >
            <p className="text-sunny-cream text-sm italic text-left">
              &ldquo;{state.currentQuote}&rdquo;
            </p>
            <p className="text-sunny-cream-muted/50 text-xs text-left mt-1">
              — Zoro
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
