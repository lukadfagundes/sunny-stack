"use client";

import { useReducer, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, RotateCcw, Swords } from "lucide-react";
import Link from "next/link";
import { gameReducer, createInitialState } from "./reducer";
import { useGameInput } from "./useGameInput";
import { getNamiLine } from "./quotes";
import GameBoard from "./GameBoard";
import GameHUD from "./GameHUD";
import DPad from "./DPad";
import WinCelebration from "./WinCelebration";
import type { Direction } from "./types";

// Client-only gate: returns false on server, true on client
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Nami escalation button — stable component, CSS transitions for smooth growth
function NamiEscalation({ moveCount }: { moveCount: number }) {
  const step = moveCount - 21;
  const progress = step / 19; // 0 to 1 over 20 steps
  const fontSize = 0.75 + progress * 0.5;
  const py = 8 + progress * 8;
  const px = 16 + progress * 16;
  const glow = progress * 25;
  const borderWidth = 1 + progress * 2;

  return (
    <motion.div
      key="nami-escalation"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="text-center"
    >
      <Link
        href="/"
        className="inline-block bg-sunny-red/80 hover:bg-sunny-red text-sunny-cream font-medium text-center"
        style={{
          fontSize: `${fontSize}rem`,
          padding: `${py}px ${px}px`,
          border: `${borderWidth}px solid rgba(240, 180, 41, ${0.4 + progress * 0.6})`,
          borderRadius: 8,
          boxShadow: glow > 0
            ? `0 0 ${glow}px rgba(240, 180, 41, ${progress * 0.5})`
            : undefined,
          transition: "font-size 0.3s ease, padding 0.3s ease, border 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {getNamiLine(moveCount)}
      </Link>
    </motion.div>
  );
}

export default function ZoroGame() {
  const isClient = useIsClient();
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const handleMove = useCallback(
    (direction: Direction) => {
      dispatch({ type: "MOVE", direction });
    },
    []
  );

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const { onTouchStart, onTouchEnd } = useGameInput(handleMove);

  const showNamiButton = state.moveCount >= 21 && !state.won;
  const namiTakeover = state.moveCount >= 40 && !state.won;

  // Show a loading state during SSR / before client hydration
  if (!isClient) {
    return (
      <main
        className="flex-1 min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(180deg, #1A1209 0%, #2A1F14 30%, #3D2E1F 55%, #6B4226 75%, #B8860B 95%)",
        }}
      >
        <div className="text-center">
          <Swords className="w-12 h-12 text-sunny-gold/40 mx-auto mb-4 animate-pulse" />
          <p className="text-sunny-cream-muted/60 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1A1209 0%, #2A1F14 30%, #3D2E1F 55%, #6B4226 75%, #B8860B 95%)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
        <div
          className="w-full h-8 -mt-4"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(240, 180, 41, 0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Game content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <h1
            className="text-3xl sm:text-4xl font-bold text-sunny-gold/80 mb-1"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            404
          </h1>
          <p className="text-sunny-cream-muted text-sm">
            Help Zoro find the Thousand Sunny
          </p>
          <p className="text-sunny-cream-muted/60 text-xs mt-1">
            Arrow keys / WASD / Swipe to move
          </p>
        </motion.div>

        {/* Game board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 30 }}
          className="relative"
        >
          <GameBoard state={state} />

          {/* Win celebration overlay */}
          <AnimatePresence>
            {state.won && (
              <WinCelebration
                quote={state.currentQuote}
                moveCount={state.moveCount}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* HUD (move counter + quotes) */}
        <GameHUD state={state} />

        {/* D-Pad (mobile only) */}
        {!state.won && (
          <DPad onMove={handleMove} />
        )}

        {/* Nami section — single AnimatePresence for smooth escalation → takeover */}
        <AnimatePresence mode="wait">
          {namiTakeover ? (
            <motion.div
              key="nami-takeover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="text-center p-6 max-w-sm"
              style={{
                background: "rgba(26, 18, 9, 0.95)",
                border: "2px solid #F0B429",
                borderRadius: 16,
              }}
            >
              <h2
                className="text-xl font-bold text-sunny-gold mb-2"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                THAT&apos;S IT!
              </h2>
              <p className="text-sunny-cream text-sm mb-4">
                Nami has grabbed Zoro by the ear and is dragging him back to the ship.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-sunny-red hover:bg-sunny-dark-red text-sunny-cream font-medium py-3 px-6 transition-colors"
                style={{ borderRadius: 8 }}
              >
                <Home className="w-5 h-5" />
                Back to the Ship. NOW.
              </Link>
            </motion.div>
          ) : showNamiButton ? (
            <NamiEscalation moveCount={state.moveCount} />
          ) : null}
        </AnimatePresence>

        {/* Escape hatch */}
        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sunny-cream-muted hover:text-sunny-cream text-xs transition-colors"
          >
            <Home className="w-3 h-3" />
            Just go home
          </Link>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sunny-cream-muted/60 hover:text-sunny-cream-muted text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New grid
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-sunny-cream-muted/50 mt-4">
          Error 404: Page not found (but your sense of direction was lost long ago)
        </p>
      </div>
    </main>
  );
}
