"use client";

import { motion } from "framer-motion";
import { Swords, Anchor, Wine, Skull } from "lucide-react";
import type { TileType } from "./types";

interface GameTileProps {
  type: TileType;
  isPlayer: boolean;
  isGoal: boolean;
  row: number;
  col: number;
}

const TILE_ICONS: Record<Exclude<TileType, "empty">, typeof Wine> = {
  sake: Wine,
  deadend: Skull,
};

export default function GameTile({
  type,
  isPlayer,
  isGoal,
}: GameTileProps) {
  const showObstacle = !isPlayer && !isGoal && type !== "empty";
  const Icon = type !== "empty" ? TILE_ICONS[type] : null;

  return (
    <div
      role="gridcell"
      aria-label={
        isPlayer
          ? "Zoro (you)"
          : isGoal
            ? "Thousand Sunny (goal)"
            : type === "sake"
              ? "Sake shop"
              : type === "deadend"
                ? "Dead end"
                : "Empty tile"
      }
      className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center"
      style={{
        background: isGoal
          ? "rgba(240, 180, 41, 0.15)"
          : "rgba(26, 18, 9, 0.6)",
        border: `1px solid ${
          isGoal ? "rgba(240, 180, 41, 0.4)" : "rgba(184, 134, 11, 0.2)"
        }`,
        borderRadius: 4,
      }}
    >
      {/* Goal icon */}
      {isGoal && !isPlayer && (
        <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-sunny-gold" />
      )}

      {/* Obstacle icon */}
      {showObstacle && Icon && (
        <Icon
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            type === "sake" ? "text-sunny-gold/50" : "text-sunny-red/40"
          }`}
        />
      )}

      {/* Player (Zoro) */}
      {isPlayer && (
        <motion.div
          layoutId="zoro-player"
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{
            background: "rgba(184, 134, 11, 0.25)",
            borderRadius: 4,
            border: "1px solid rgba(240, 180, 41, 0.6)",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-sunny-gold" />
        </motion.div>
      )}
    </div>
  );
}
