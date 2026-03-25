"use client";

import { motion } from "framer-motion";
import { Swords, Anchor, Wine, Skull } from "lucide-react";
import type { GameState, TileType } from "./types";
import { GRID_SIZE } from "./types";

interface GameBoardProps {
  state: GameState;
}

const TILE_ICONS: Record<Exclude<TileType, "empty">, typeof Wine> = {
  sake: Wine,
  deadend: Skull,
};

export default function GameBoard({ state }: GameBoardProps) {
  return (
    <motion.div
      animate={{ rotate: state.gridRotation }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{
        filter:
          state.colorShiftAmount > 0
            ? `hue-rotate(${state.colorShiftAmount * 120}deg)`
            : undefined,
      }}
    >
      <div className="relative">
        {/* Grid tiles */}
        <div
          role="grid"
          aria-label="Game board"
          className="inline-grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {state.grid.map((row, r) =>
            row.map((tile, c) => {
              const isGoal =
                r === state.goalPos.row && c === state.goalPos.col;
              const isPlayer =
                r === state.playerPos.row && c === state.playerPos.col;
              const showObstacle =
                !isPlayer && !isGoal && tile !== "empty";
              const Icon =
                tile !== "empty" ? TILE_ICONS[tile] : null;

              return (
                <div
                  key={`${r}-${c}`}
                  role="gridcell"
                  aria-label={
                    isPlayer
                      ? "Zoro (you)"
                      : isGoal
                        ? "Thousand Sunny (goal)"
                        : tile === "sake"
                          ? "Sake shop"
                          : tile === "deadend"
                            ? "Dead end"
                            : "Empty tile"
                  }
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center"
                  style={{
                    background: isGoal
                      ? "rgba(240, 180, 41, 0.15)"
                      : "rgba(26, 18, 9, 0.6)",
                    border: `1px solid ${
                      isGoal
                        ? "rgba(240, 180, 41, 0.4)"
                        : "rgba(184, 134, 11, 0.2)"
                    }`,
                    borderRadius: 4,
                  }}
                >
                  {isGoal && !isPlayer && (
                    <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-sunny-gold" />
                  )}
                  {showObstacle && Icon && (
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        tile === "sake"
                          ? "text-sunny-gold/50"
                          : "text-sunny-red/40"
                      }`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Player overlay — single element, moves via transform */}
        <motion.div
          className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center z-10 pointer-events-none"
          animate={{
            x: `calc(${state.playerPos.col} * (100% + 4px))`,
            y: `calc(${state.playerPos.row} * (100% + 4px))`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            background: "rgba(184, 134, 11, 0.25)",
            borderRadius: 4,
            border: "1px solid rgba(240, 180, 41, 0.6)",
          }}
        >
          <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-sunny-gold" />
        </motion.div>
      </div>
    </motion.div>
  );
}
